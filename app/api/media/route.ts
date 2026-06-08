import { NextResponse } from "next/server";
import { createMediaAsset, deleteMediaAsset, listMediaAssets, reorderMediaAssets } from "@/lib/db";
import { deletePublicFile, saveUpload } from "@/lib/storage";
import type { MediaAsset, MediaCategory } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(listMediaAssets(url.searchParams.get("q") ?? "", url.searchParams.get("category") ?? "all"));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const category = String(form.get("category") ?? "Wedding") as MediaCategory;
  const assets: MediaAsset[] = [];
  for (const file of form.getAll("images")) {
    const saved = await saveUpload(file as File, "uploads");
    if (!saved) continue;
    const asset: MediaAsset = { id: crypto.randomUUID(), url: saved, name: (file as File).name, category, alt: String(form.get("alt") ?? ""), sortOrder: Date.now(), createdAt: new Date().toISOString() };
    assets.push(createMediaAsset(asset));
  }
  return NextResponse.json(assets);
}

export async function PATCH(request: Request) {
  const body = await request.json() as { ids?: string[] };
  reorderMediaAssets(body.ids ?? []);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const url = deleteMediaAsset(id);
    if (url) await deletePublicFile(url);
  }
  return NextResponse.json({ ok: true });
}
