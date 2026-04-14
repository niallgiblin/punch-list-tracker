import { z } from "zod";
import { notFound, publicProcedure, router } from "@/server/trpc";
import { projectStatusSchema } from "@/lib/schemas";

export const projectRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      status: p.status,
      createdAt: p.createdAt,
      itemCount: p._count.items,
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        address: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          name: input.name,
          address: input.address,
        },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { items: true } },
        },
      });
      if (!project) notFound("Project not found");
      return {
        id: project.id,
        name: project.name,
        address: project.address,
        status: project.status,
        createdAt: project.createdAt,
        itemCount: project._count.items,
      };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        address: z.string().min(1).max(500).optional(),
        status: projectStatusSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.db.project.findUnique({ where: { id } });
      if (!existing) notFound("Project not found");
      return ctx.db.project.update({
        where: { id },
        data,
      });
    }),
});
