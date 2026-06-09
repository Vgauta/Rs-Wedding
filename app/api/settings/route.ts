import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { saveUpload } from "@/lib/storage";
import type { Settings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(request: Request) {
  const form = await request.formData();
  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(String(form.get("settings") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
  }
  const logoUrl = await saveUpload(form.get("logo") as File | null, "brand");
  const saved = saveSettings({ ...getSettings(), ...settings, ...(logoUrl ? { logoUrl } : {}) } as Settings);
  return NextResponse.json(saved);
}
