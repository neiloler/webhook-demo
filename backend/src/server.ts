import cors from "@fastify/cors";
import { pathToFileURL } from "node:url";
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { requireSession } from "./auth-session.js";
import { config } from "./config.js";
import { initializeWebhookSchema } from "./database.js";
import { registerWebhookRoutes } from "./webhook-routes.js";

const toBetterAuthRequest = (request: FastifyRequest): Request => {
  const url = new URL(request.url, config.authUrl);
  const init: RequestInit = {
    headers: fromNodeHeaders(request.headers),
    method: request.method,
  };

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    init.body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
  }

  return new Request(url, init);
};

const sendBetterAuthResponse = async (
  response: Response,
  reply: FastifyReply,
) => {
  reply.status(response.status);
  response.headers.forEach((value, key) => reply.header(key, value));

  const body = await response.text();
  return reply.send(body || null);
};

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = Fastify({ logger: true });
  initializeWebhookSchema();

  server.setErrorHandler((error: FastifyError, request, reply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({
        code: statusCode === 413 ? "REQUEST_BODY_TOO_LARGE" : "BAD_REQUEST",
        error: error.message,
      });
    }

    request.log.error({ error }, "Request failed");
    return reply.status(500).send({
      code: "INTERNAL_SERVER_ERROR",
      error: "Internal server error",
    });
  });

  await server.register(cors, {
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: config.clientOrigins,
  });

  server.get("/health", async () => ({
    ok: true,
    service: "webhook-demo-backend",
  }));

  server.route({
    handler: async (request, reply) => {
      try {
        const response = await auth.handler(toBetterAuthRequest(request));
        return sendBetterAuthResponse(response, reply);
      } catch (error) {
        request.log.error({ error }, "Authentication route failed");
        return reply.status(500).send({
          code: "AUTH_FAILURE",
          error: "Internal authentication error",
        });
      }
    },
    method: ["GET", "POST"],
    url: "/api/auth/*",
  });

  server.get("/api/me", async (request, reply) => {
    const session = await requireSession(request, reply);

    if (!session) {
      return;
    }

    return {
      authenticated: true,
      session: session.session,
      user: session.user,
    };
  });

  registerWebhookRoutes(server, requireSession);

  return server;
};

const startServer = async () => {
  const server = await buildServer();

  try {
    await server.listen({ host: config.host, port: config.port });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startServer();
}
