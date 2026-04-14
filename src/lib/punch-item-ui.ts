import type { PunchStatus } from "@/lib/punch-item-workflow";

/** Next allowed statuses for UI controls (mirrors server rules). */
export function nextStatuses(current: PunchStatus): PunchStatus[] {
  if (current === "open") return ["in_progress"];
  if (current === "in_progress") return ["complete"];
  if (current === "complete") return ["open"];
  return [];
}

export function statusLabel(s: PunchStatus): string {
  switch (s) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "complete":
      return "Complete";
    default:
      return s;
  }
}
