"use client";

import { useMemo, useState } from "react";
import { api } from "@/trpc/react";

function BarList({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { key: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4">
      <h3 className="text-sm font-medium text-neutral-300">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No data.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => {
            const pct = total === 0 ? 0 : Math.round((r.count / total) * 1000) / 10;
            return (
              <li key={r.key}>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span className="truncate pr-2">{r.key}</span>
                  <span>
                    {r.count} ({pct}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-neutral-800">
                  <div
                    className="h-full rounded bg-amber-500/80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: projects, isLoading: loadingProjects } = api.project.list.useQuery();
  const [projectId, setProjectId] = useState<string | "all">("all");

  const statsQuery = api.dashboard.getStats.useQuery(
    projectId === "all" ? {} : { projectId },
  );

  const title = useMemo(() => {
    if (projectId === "all") return "All projects";
    const p = projects?.find((x) => x.id === projectId);
    return p ? p.name : "Project";
  }, [projectId, projects]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Completion and breakdowns by location, priority, and assignee.
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <label className="text-sm text-neutral-500">
          Scope
          <select
            className="ml-2 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            value={projectId}
            onChange={(e) =>
              setProjectId(e.target.value === "all" ? "all" : e.target.value)
            }
            disabled={loadingProjects}
          >
            <option value="all">All projects</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {statsQuery.isLoading && (
        <p className="text-sm text-neutral-500">Loading stats…</p>
      )}
      {statsQuery.error && (
        <p className="text-sm text-red-400">{statsQuery.error.message}</p>
      )}

      {statsQuery.data && (
        <>
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-neutral-950 p-8">
            <p className="text-xs uppercase tracking-wide text-neutral-500">{title}</p>
            <p className="mt-2 text-5xl font-semibold tabular-nums text-amber-400">
              {statsQuery.data.completionPercent}%
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              {statsQuery.data.complete} of {statsQuery.data.total} items complete
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BarList
              title="By location"
              rows={statsQuery.data.byLocation}
              total={statsQuery.data.total}
            />
            <BarList
              title="By priority"
              rows={statsQuery.data.byPriority}
              total={statsQuery.data.total}
            />
            <BarList
              title="By assignee"
              rows={statsQuery.data.byAssignee}
              total={statsQuery.data.total}
            />
          </div>
        </>
      )}
    </div>
  );
}
