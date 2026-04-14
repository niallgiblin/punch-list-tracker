"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";

export default function ProjectsPage() {
  const utils = api.useUtils();
  const { data: projects, isLoading, error } = api.project.list.useQuery();
  const create = api.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setName("");
      setAddress("");
    },
  });

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-neutral-400">Create a site and manage punch items.</p>
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-medium text-neutral-300">New project</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !address.trim()) return;
            create.mutate({ name: name.trim(), address: address.trim() });
          }}
        >
          <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
            Name
            <input
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500/60"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Riverside Tower — Phase 2"
            />
          </label>
          <label className="flex flex-[2] flex-col gap-1 text-xs text-neutral-500">
            Address
            <input
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500/60"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city"
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
        </form>
        {create.error && (
          <p className="mt-2 text-sm text-red-400">{create.error.message}</p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-300">All projects</h2>
        {isLoading && <p className="mt-4 text-sm text-neutral-500">Loading…</p>}
        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error.message} — ensure DATABASE_URL is set and migrations have run.
          </p>
        )}
        {!isLoading && !error && projects?.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-neutral-700 px-4 py-8 text-center text-sm text-neutral-500">
            No projects yet. Add one above.
          </p>
        )}
        <ul className="mt-4 divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/30">
          {projects?.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-neutral-800/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-neutral-100">{p.name}</span>
                <span className="text-sm text-neutral-500">{p.address}</span>
                <span className="text-xs text-neutral-600">
                  {p.itemCount} item{p.itemCount === 1 ? "" : "s"} · {p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
