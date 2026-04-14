import { z } from "zod";
import { PUNCH_STATUSES } from "@/lib/punch-item-workflow";

export const projectStatusSchema = z.enum(["active", "archived"]);

export const punchStatusSchema = z.enum(PUNCH_STATUSES);

export const prioritySchema = z.enum(["low", "normal", "high"]);
