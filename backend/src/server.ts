import cors from "@fastify/cors";
import { pathToFileURL } from "node:url";
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { config } from "./config.js";

type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const getSession = async (
  request: FastifyRequest,
): Promise<BetterAuthSession> => {
  return auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
};

const requireSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<NonNullable<BetterAuthSession> | null> => {
  const session = await getSession(request);

  if (!session) {
    reply.status(401).send({ error: "Unauthorized" });
    return null;
  }

  return session;
};

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
