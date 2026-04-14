import { z } from "zod";
import { notFound, publicProcedure, router } from "@/server/trpc";

function groupCount<T extends string | null>(
  items: { key: T }[],
  labelForNull: string,
): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const { key } of items) {
    const k = key == null || key === "" ? labelForNull : key;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export const dashboardRouter = router({
  getStats: publicProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.projectId) {
        const project = await ctx.db.project.findUnique({
          where: { id: input.projectId },
        });
        if (!project) notFound("Project not found");
      }

      const where = input.projectId ? { projectId: input.projectId } : {};

      const items = await ctx.db.punchItem.findMany({
        where,
        select: {
          status: true,
          location: true,
          priority: true,
          assignedTo: true,
        },
      });

      const total = items.length;
      const complete = items.filter((i) => i.status === "complete").length;
      const completionPercent = total === 0 ? 0 : Math.round((complete / total) * 1000) / 10;

      return {
        total,
        complete,
        completionPercent,
        byLocation: groupCount(
          items.map((i) => ({ key: i.location })),
          "Unknown",
        ),
        byPriority: groupCount(
          items.map((i) => ({ key: i.priority })),
          "Unknown",
        ),
        byAssignee: groupCount(
          items.map((i) => ({ key: i.assignedTo })),
          "Unassigned",
        ),
      };
    }),
});
