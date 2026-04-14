import { initTRPC, TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import superjson from "superjson";

export type Context = {
  db: PrismaClient;
};

export const createContext = async (): Promise<Context> => {
  const { db } = await import("@/server/db");
  return { db };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause && typeof error.cause === "object" && "issues" in error.cause
            ? error.cause
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export function notFound(message = "Not found"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}
