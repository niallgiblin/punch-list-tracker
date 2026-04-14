"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { normalizeImageMimeType } from "@/lib/image-mime";
import type { PunchStatus } from "@/lib/punch-item-workflow";
import { isPunchStatus } from "@/lib/punch-item-workflow";
import { nextStatuses, statusLabel } from "@/lib/punch-item-ui";
import { api } from "@/trpc/react";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = r.split(",")[1];
      if (!base64) reject(new Error("Invalid data URL"));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const utils = api.useUtils();
  const projectQuery = api.project.getById.useQuery({ id }, { enabled: !!id });
  const itemsQuery = api.punchItem.listByProject.useQuery(
    { projectId: id },
    { enabled: !!id },
  );

  const createItem = api.punchItem.create.useMutation({
    onSuccess: () => {
      utils.punchItem.listByProject.invalidate({ projectId: id });
      utils.project.getById.invalidate({ id });
      utils.dashboard.getStats.invalidate();
      setLoc("");
      setDesc("");
      setPriority("normal");
      setAssignee("");
      setPhotoFile(null);
    },
  });
  const updateItem = api.punchItem.update.useMutation({
    onSuccess: () => {
      utils.punchItem.listByProject.invalidate({ projectId: id });
    },
  });
  const transition = api.punchItem.transitionStatus.useMutation({
    onSuccess: () => {
      utils.punchItem.listByProject.invalidate({ projectId: id });
      utils.dashboard.getStats.invalidate();
    },
  });
  const uploadPhoto = api.upload.punchPhoto.useMutation();
  const updateProject = api.project.update.useMutation({
    onSuccess: () => {
      utils.project.getById.invalidate({ id });
      utils.project.list.invalidate();
    },
  });

  const [loc, setLoc] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [assignee, setAssignee] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoc, setEditLoc] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "normal" | "high">("normal");
  const [editAssignee, setEditAssignee] = useState("");

  const sorted = useMemo(() => {
    const items = itemsQuery.data ?? [];
    return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [itemsQuery.data]);

  const allComplete = useMemo(() => {
    const items = itemsQuery.data ?? [];
    return items.length > 0 && items.every((i) => i.status === "complete");
  }, [itemsQuery.data]);

  if (!id) return null;

  if (projectQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading project…</p>;
  }
  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
        {projectQuery.error?.message ?? "Project not found."}{" "}
        <Link href="/projects" className="underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const p = projectQuery.data;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/projects" className="text-sm text-amber-500/90 hover:text-amber-400">
          ← Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{p.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">{p.address}</p>
            <p className="mt-2 text-xs text-neutral-600">
              {p.itemCount} punch item{p.itemCount === 1 ? "" : "s"} ·{" "}
              <span className={p.status === "archived" ? "text-amber-500/80" : ""}>
                {p.status}
              </span>
            </p>
          </div>
          {p.status === "active" && allComplete && (
            <button
              type="button"
              disabled={updateProject.isPending}
              onClick={() => updateProject.mutate({ id, status: "archived" })}
              className="rounded-md border border-green-700 bg-green-950/40 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-900/50 disabled:opacity-50"
            >
              {updateProject.isPending ? "Archiving…" : "Archive project"}
            </button>
          )}
          {p.status === "archived" && (
            <button
              type="button"
              disabled={updateProject.isPending}
              onClick={() => updateProject.mutate({ id, status: "active" })}
              className="rounded-md border border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800/50 disabled:opacity-50"
            >
              {updateProject.isPending ? "Reactivating…" : "Reactivate"}
            </button>
          )}
        </div>
        {updateProject.error && (
          <p className="mt-2 text-sm text-red-400">{updateProject.error.message}</p>
        )}
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-sm font-medium text-neutral-300">Add punch item</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!loc.trim() || !desc.trim()) return;
            try {
              let photoUrl: string | null = null;
              if (photoFile) {
                const base64 = await fileToBase64(photoFile);
                const up = await uploadPhoto.mutateAsync({
                  fileName: photoFile.name,
                  mimeType: normalizeImageMimeType(photoFile),
                  base64,
                });
                photoUrl = up.url;
              }
              createItem.mutate({
                projectId: id,
                location: loc.trim(),
                description: desc.trim(),
                priority,
                assignedTo: assignee.trim() || null,
                photo: photoUrl,
              });
            } catch {
              // upload/create errors are surfaced via mutation state below
            }
          }}
        >
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Location
            <input
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Description
            <textarea
              className="min-h-[88px] rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Priority
            <select
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "low" | "normal" | "high")
              }
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Assignee (optional)
            <input
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Name or crew"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Photo (optional)
            <input
              type="file"
              accept="image/*"
              className="text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:px-3 file:py-1.5 file:text-neutral-200"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createItem.isPending || uploadPhoto.isPending}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {uploadPhoto.isPending || createItem.isPending ? "Saving…" : "Add item"}
            </button>
          </div>
        </form>
        {(createItem.error || uploadPhoto.error) && (
          <p className="mt-2 text-sm text-red-400">
            {createItem.error?.message ?? uploadPhoto.error?.message}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-300">Punch items</h2>
        {itemsQuery.isLoading && (
          <p className="mt-4 text-sm text-neutral-500">Loading items…</p>
        )}
        {itemsQuery.error && (
          <p className="mt-4 text-sm text-red-400">{itemsQuery.error.message}</p>
        )}
        {!itemsQuery.isLoading && sorted.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-neutral-700 px-4 py-8 text-center text-sm text-neutral-500">
            No punch items yet.
          </p>
        )}
        <ul className="mt-4 space-y-4">
          {sorted.map((item) => {
            const st = isPunchStatus(item.status) ? item.status : "open";
            const options = nextStatuses(st);
            const isEditing = editingId === item.id;

            return (
              <li
                key={item.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-950">
                    {item.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-neutral-600">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    {isEditing ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                          value={editLoc}
                          onChange={(e) => setEditLoc(e.target.value)}
                        />
                        <select
                          className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                          value={editPriority}
                          onChange={(e) =>
                            setEditPriority(e.target.value as typeof editPriority)
                          }
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                        <textarea
                          className="sm:col-span-2 min-h-[72px] rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                        <input
                          className="sm:col-span-2 rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                          value={editAssignee}
                          onChange={(e) => setEditAssignee(e.target.value)}
                          placeholder="Assignee"
                        />
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <button
                            type="button"
                            className="rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-neutral-950"
                            disabled={updateItem.isPending}
                            onClick={() => {
                              updateItem.mutate(
                                {
                                  id: item.id,
                                  location: editLoc.trim(),
                                  description: editDesc.trim(),
                                  priority: editPriority,
                                  assignedTo: editAssignee.trim() || null,
                                },
                                {
                                  onSuccess: () => setEditingId(null),
                                },
                              );
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded border border-neutral-600 px-3 py-1.5 text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-neutral-100">{item.location}</span>
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                            {item.priority}
                          </span>
                          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                            {statusLabel(st)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400 whitespace-pre-wrap">
                          {item.description}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {item.assignedTo ? `Assigned: ${item.assignedTo}` : "Unassigned"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {!isEditing && (
                      <button
                        type="button"
                        className="text-xs text-amber-500/90 hover:text-amber-400"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditLoc(item.location);
                          setEditDesc(item.description);
                          setEditPriority(item.priority as typeof editPriority);
                          setEditAssignee(item.assignedTo ?? "");
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <label className="text-xs text-neutral-500">
                      Change status
                      <select
                        className="mt-1 block w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
                        value=""
                        onChange={(e) => {
                          const v = e.target.value as PunchStatus;
                          if (!v) return;
                          transition.mutate({ id: item.id, toStatus: v });
                          e.currentTarget.value = "";
                        }}
                        disabled={transition.isPending}
                      >
                        <option value="">Select…</option>
                        {options.map((s) => {
                          const needsAssignee = s === "in_progress" && !item.assignedTo?.trim();
                          return (
                            <option key={s} value={s} disabled={needsAssignee}>
                              → {statusLabel(s)}{needsAssignee ? " (assign first)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                </div>
                {transition.isError &&
                  transition.variables?.id === item.id && (
                    <p className="mt-2 text-xs text-red-400">{transition.error.message}</p>
                  )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
