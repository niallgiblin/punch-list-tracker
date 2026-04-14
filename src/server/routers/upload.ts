import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { publicProcedure, router } from "@/server/trpc";

const BUCKET = "punch-photos";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadRouter = router({
  punchPhoto: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(200),
        mimeType: z.enum(ALLOWED_MIME),
        base64: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length > MAX_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`,
        });
      }
      const supabase = getAdmin();
      if (!supabase) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Photo upload is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and create bucket punch-photos.",
        });
      }
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: input.mimeType,
        upsert: false,
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { url: data.publicUrl };
    }),
});
