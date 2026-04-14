import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  assertTransition,
  canTransitionToInProgress,
  isPunchStatus,
} from "@/lib/punch-item-workflow";
import { prioritySchema, punchStatusSchema } from "@/lib/schemas";
import { notFound, publicProcedure, router } from "@/server/trpc";

export const punchItemRouter = router({
  listByProject: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) notFound("Project not found");
      return ctx.db.punchItem.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        location: z.string().min(1).max(300),
        description: z.string().min(1).max(5000),
        priority: prioritySchema.default("normal"),
        assignedTo: z.string().max(200).optional().nullable(),
        photo: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) notFound("Project not found");
      return ctx.db.punchItem.create({
        data: {
          projectId: input.projectId,
          location: input.location,
          description: input.description,
          priority: input.priority,
          assignedTo: input.assignedTo ?? null,
          photo: input.photo ?? null,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        location: z.string().min(1).max(300).optional(),
        description: z.string().min(1).max(5000).optional(),
        priority: prioritySchema.optional(),
        assignedTo: z.string().max(200).optional().nullable(),
        photo: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const existing = await ctx.db.punchItem.findUnique({ where: { id } });
      if (!existing) notFound("Punch item not found");
      return ctx.db.punchItem.update({
        where: { id },
        data: patch,
      });
    }),

  transitionStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        toStatus: punchStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.punchItem.findUnique({ where: { id: input.id } });
      if (!item) notFound("Punch item not found");
      const from = item.status;
      if (!isPunchStatus(from)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Invalid stored status: ${from}`,
        });
      }
      assertTransition(from, input.toStatus);
      if (input.toStatus === "in_progress" && !canTransitionToInProgress(item)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assign someone before moving to In progress",
        });
      }
      return ctx.db.punchItem.update({
        where: { id: input.id },
        data: { status: input.toStatus },
      });
    }),
});
