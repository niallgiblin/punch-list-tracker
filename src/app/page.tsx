import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Punch List Tracker</h1>
        <p className="mt-2 max-w-xl text-neutral-400">
          Track construction defects from open through in progress to complete — with a clear
          workflow and dashboard insights.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-amber-400 transition-colors"
        >
          View projects
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:border-neutral-500 transition-colors"
        >
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
