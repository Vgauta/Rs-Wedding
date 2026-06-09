import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createId } from "./id";

const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

export async function saveUpload(file: File | null, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = (path.extname(file.name) || ".jpg").toLowerCase();
  if (!allowedImageExtensions.has(ext)) throw new Error("Unsupported image format. Use JPG, PNG, WEBP, GIF, or SVG.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = `${Date.now()}-${createId()}${ext}`;
  const publicDir = path.join(process.cwd(), "public", folder);
  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, safeName), bytes);
  return `/${folder}/${safeName}`;
}

export async function deletePublicFile(publicUrl: string) {
  if (!publicUrl.startsWith("/uploads/") && !publicUrl.startsWith("/brand/")) return;
  const resolved = path.normalize(path.join(process.cwd(), "public", publicUrl));
  const publicRoot = path.join(process.cwd(), "public");
  if (!resolved.startsWith(publicRoot)) return;
  await rm(resolved, { force: true });
}
