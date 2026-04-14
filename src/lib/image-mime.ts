const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type ImageMimeType = (typeof ALLOWED)[number];

/** Map browser File to an allowed image/* type for upload (matches server z.enum). */
export function normalizeImageMimeType(file: File): ImageMimeType {
  const t = file.type;
  if ((ALLOWED as readonly string[]).includes(t)) {
    return t as ImageMimeType;
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}
