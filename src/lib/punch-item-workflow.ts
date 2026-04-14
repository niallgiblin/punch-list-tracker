import { TRPCError } from "@trpc/server";

export const PUNCH_STATUSES = ["open", "in_progress", "complete"] as const;
export type PunchStatus = (typeof PUNCH_STATUSES)[number];

const ALLOWED: Record<PunchStatus, readonly PunchStatus[]> = {
  open: ["in_progress"],
  in_progress: ["complete"],
  complete: ["open"],
};

export function isPunchStatus(value: string): value is PunchStatus {
  return (PUNCH_STATUSES as readonly string[]).includes(value);
}

/**
 * Enforces allowed transitions; no skipping (e.g. open → complete).
 * Reopen: complete → open.
 */
export function assertTransition(from: PunchStatus, to: PunchStatus): void {
  if (from === to) return;
  const next = ALLOWED[from];
  if (!next?.includes(to)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid status transition: ${from} → ${to}`,
    });
  }
}

/** Assignment gate: cannot move to in_progress without an assignee. */
export function canTransitionToInProgress(item: {
  assignedTo: string | null;
}): boolean {
  return !!(item.assignedTo?.trim());
}
