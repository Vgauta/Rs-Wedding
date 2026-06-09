import { NextResponse } from "next/server";
import { listPackageTemplates, savePackageTemplate } from "@/lib/db";
import type { PackageTemplate } from "@/lib/types";
import { createId } from "@/lib/id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listPackageTemplates());
}

export async function POST(request: Request) {
  const template = await request.json().catch(() => null) as (Omit<PackageTemplate, "id" | "createdAt" | "updatedAt" | "usageCount"> & Partial<PackageTemplate>) | null;
  if (!template?.name || !template.servicesTitle || !Array.isArray(template.services) || !Array.isArray(template.deliveryItems) || !Array.isArray(template.addons)) {
    return NextResponse.json({ error: "Invalid package template payload." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const saved = savePackageTemplate({
    ...template,
    id: template.id || createId(),
    usageCount: template.usageCount ?? 0,
    createdAt: template.createdAt ?? now,
    updatedAt: now,
  } as PackageTemplate);
  return NextResponse.json(saved);
}
