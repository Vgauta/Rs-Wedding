import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(request: Request) {
  const form = await request.formData();
  const settings = JSON.parse(String(form.get("settings") ?? "{}"));
  const logoUrl = await saveUpload(form.get("logo") as File | null, "brand");
  const saved = saveSettings({ ...getSettings(), ...settings, ...(logoUrl ? { logoUrl } : {}) });
  return NextResponse.json(saved);
}
