import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
export type AuthenticatedSession = NonNullable<BetterAuthSession>;

export const getSession = async (
  request: FastifyRequest,
): Promise<BetterAuthSession> => {
  return auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
};

export const requireSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthenticatedSession | null> => {
  const session = await getSession(request);

  if (!session) {
    reply.status(401).send({
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    });
    return null;
  }

  return session;
};
