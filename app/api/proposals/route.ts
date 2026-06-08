import { NextResponse } from "next/server";
import { getMediaByIds, getSettings, incrementPackageUsage, saveProposal } from "@/lib/db";
import { generatePdf, renderProposalHtml, saveHtmlPreview } from "@/lib/pdf";
import { saveUpload } from "@/lib/storage";
import type { ProposalPayload } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function absoluteUrl(request: Request, path: string) {
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return `${origin}${path}`;
}

function whatsappMessage(template: string, clientName: string, pdfUrl: string) {
  return template.replaceAll("[Client Name]", clientName).replaceAll("[PDF LINK]", pdfUrl);
}

export async function POST(request: Request) {
  const form = await request.formData();
  let payload: ProposalPayload;
  try {
    payload = JSON.parse(String(form.get("payload") ?? "{}")) as ProposalPayload;
  } catch {
    return NextResponse.json({ error: "Invalid proposal payload." }, { status: 400 });
  }
  const normalizedNumber = payload.whatsappNumber?.replace(/\D/g, "") ?? "";
  if (!payload.clientName || !payload.brideName || !payload.groomName || !normalizedNumber) {
    return NextResponse.json({ error: "Client name, bride name, groom name, and WhatsApp number are required." }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const heroImage = await saveUpload(form.get("heroImage") as File | null, "uploads");
  const galleryImages: string[] = [];
  for (const file of form.getAll("galleryImages")) {
    const saved = await saveUpload(file as File, "uploads");
    if (saved) galleryImages.push(saved);
  }

  const settings = getSettings();
  const reusableImages = getMediaByIds(payload.selectedMediaIds ?? []).map((asset) => asset.url);
  const allGalleryImages = [...reusableImages, ...galleryImages];
  const html = renderProposalHtml({ ...payload, heroImage: heroImage ?? allGalleryImages[0] ?? null, galleryImages: allGalleryImages }, settings);
  await saveHtmlPreview(html, id);
  const pdfPath = await generatePdf(html, id);
  const publicPdfUrl = absoluteUrl(request, pdfPath);
  saveProposal({ ...payload, id, pdfUrl: pdfPath, packageTemplateId: payload.packageTemplateId, payload: { ...payload, heroImage, galleryImages: allGalleryImages } });
  incrementPackageUsage(payload.packageTemplateId);

  const waUrl = `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(whatsappMessage(settings.whatsappTemplate, payload.clientName, publicPdfUrl))}`;

  return NextResponse.json({ id, pdfUrl: publicPdfUrl, previewUrl: absoluteUrl(request, `/proposals/${id}.html`), whatsappUrl: waUrl });
}
