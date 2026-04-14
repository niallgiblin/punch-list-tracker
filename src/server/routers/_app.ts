import { router } from "@/server/trpc";
import { dashboardRouter } from "@/server/routers/dashboard";
import { projectRouter } from "@/server/routers/project";
import { punchItemRouter } from "@/server/routers/punchItem";
import { uploadRouter } from "@/server/routers/upload";

export const appRouter = router({
  project: projectRouter,
  punchItem: punchItemRouter,
  dashboard: dashboardRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
