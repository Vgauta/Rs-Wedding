import { NextResponse } from "next/server";
import { listPackageTemplates, savePackageTemplate } from "@/lib/db";
import type { PackageTemplate } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listPackageTemplates());
}

export async function POST(request: Request) {
  const template = await request.json() as Omit<PackageTemplate, "id" | "createdAt" | "updatedAt" | "usageCount"> & Partial<PackageTemplate>;
  const now = new Date().toISOString();
  const saved = savePackageTemplate({
    ...template,
    id: template.id || crypto.randomUUID(),
    usageCount: template.usageCount ?? 0,
    createdAt: template.createdAt ?? now,
    updatedAt: now,
  } as PackageTemplate);
  return NextResponse.json(saved);
}
