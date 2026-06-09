import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AddonItem, DeliveryItem, GalleryLayout, PdfTemplate, ProposalPayload, ServiceBlock, Settings } from "./types";

const esc = (value = "") => value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]!));
const paragraph = (value = "") => esc(value).split("\n").filter(Boolean).map((line) => `<p>${line}</p>`).join("");
const asset = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `file://${path.join(process.cwd(), "public", url)}`;
};

const cssColor = (value: string, fallback: string) => /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
const cssFont = (value: string, fallback: string) => /^[A-Za-z0-9 ,'-]{1,60}$/.test(value) ? value : fallback;

function sanitizeSettings(settings: Settings): Settings {
  return {
    ...settings,
    primaryColor: cssColor(settings.primaryColor, "#0D2A24"),
    secondaryColor: cssColor(settings.secondaryColor, "#133A33"),
    backgroundColor: cssColor(settings.backgroundColor, "#F4F2EC"),
    goldColor: cssColor(settings.goldColor, "#D6C3A5"),
    accentColor: cssColor(settings.accentColor, "#A58F68"),
    headingFont: cssFont(settings.headingFont, "Cormorant Garamond"),
    bodyFont: cssFont(settings.bodyFont, "Inter"),
  };
}

function templateClass(template: PdfTemplate) {
  return template.toLowerCase().replaceAll(" ", "-");
}

function serviceMarkup(services: ServiceBlock[]) {
  return services.map((service, index) => `<article class="service ${service.featured ? "featured" : ""}">
    <div class="service-head"><span class="icon">${esc(service.icon || "◈")}</span><span class="number">0${index + 1}</span></div>
    ${service.featured ? `<strong class="badge">${esc(service.badge || "Recommended")}</strong>` : ""}
    <h3>${esc(service.title)}</h3>${service.description ? `<p class="service-description">${esc(service.description)}</p>` : ""}
    <ul>${service.points.filter(Boolean).map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
  </article>`).join("");
}

function deliveryMarkup(items: DeliveryItem[]) {
  return items.map((item) => `<article class="delivery"><h3>${esc(item.title)}</h3><ul>${item.points.filter(Boolean).map((point) => `<li>${esc(point)}</li>`).join("")}</ul></article>`).join("");
}

function addonsMarkup(items: AddonItem[]) {
  return items.map((item) => `<article class="addon"><h3>${esc(item.title)}</h3>${item.description ? `<p>${esc(item.description)}</p>` : ""}</article>`).join("");
}

function galleryClass(layout: GalleryLayout) {
  return `gallery ${layout.toLowerCase().replaceAll(" ", "-")}`;
}

function galleryMarkup(images: string[], layout: GalleryLayout, limit: number) {
  return images.slice(0, limit).map((image, index) => `<figure class="tile t${(index % 8) + 1}"><img src="${asset(image)}" /></figure>`).join("");
}

function coverMarkup(input: ProposalPayload & { heroImage?: string | null }, settings: Settings) {
  const hero = input.heroImage ? `<img class="cover-hero" src="${asset(input.heroImage)}" />` : "";
  const names = `<h1 class="serif">${esc(input.brideName)}<br /><em>&</em> ${esc(input.groomName)}</h1>`;
  const quote = `<p class="quote serif">Every love story is beautiful,<br />but yours deserves to be remembered forever.<br /><br />We don't just capture moments,<br />we create timeless memories.</p>`;
  if (input.coverStyle === "Split Layout") return `<section class="page cover split-cover"><div class="cover-copy"><div class="kicker">Personal Wedding Proposal</div>${names}${quote}</div><div class="cover-art">${hero}</div><div class="bottom"><img class="logo" src="${asset(settings.logoUrl)}" /><div class="meta">${esc(input.weddingDate)} · ${esc(input.venue)}</div></div></section>`;
  if (input.coverStyle === "Magazine Cover") return `<section class="page cover magazine-cover">${hero}<div class="magazine-masthead">RS WEDDINGS</div><div class="cover-overlay"><div class="kicker">The Wedding Issue</div>${names}${quote}</div><div class="bottom"><img class="logo" src="${asset(settings.logoUrl)}" /><div class="meta">${esc(input.weddingDate)} · ${esc(input.venue)}</div></div></section>`;
  if (input.coverStyle === "Luxury Minimal") return `<section class="page cover minimal-cover"><div class="kicker">Personal Wedding Proposal</div>${names}<div class="minimal-line"></div>${quote}<div class="bottom"><img class="logo" src="${asset(settings.logoUrl)}" /><div class="meta">${esc(input.weddingDate)} · ${esc(input.venue)}</div></div></section>`;
  return `<section class="page dark cover full-cover">${hero}<div class="cover-overlay"><div class="kicker">Personal Wedding Proposal</div>${names}${quote}</div><div class="bottom"><img class="logo" src="${asset(settings.logoUrl)}" /><div class="meta">${esc(input.weddingDate)} · ${esc(input.venue)}</div></div></section>`;
}

export function renderProposalHtml(input: ProposalPayload & { heroImage?: string | null; galleryImages: string[] }, settings: Settings) {
  settings = sanitizeSettings(settings);
  input = { ...input, pdfTemplate: input.pdfTemplate ?? "Luxury Editorial", coverStyle: input.coverStyle ?? "Full Screen Hero Image", galleryLayout: input.galleryLayout ?? "Editorial Layout", showcaseImageCount: input.showcaseImageCount ?? 8, services: input.services ?? [], deliveryItems: input.deliveryItems ?? [], addons: input.addons ?? [], selectedMediaIds: input.selectedMediaIds ?? [], includeClientStory: input.includeClientStory ?? false, welcomeMessage: input.welcomeMessage ?? "" };
  const intro = "Our coverage is designed around cinematic storytelling, candid emotion, and complete traditional documentation, so every ritual, portrait, detail, and quiet in-between moment is preserved with intention.";
  const template = templateClass(input.pdfTemplate);
  const dark = input.pdfTemplate === "Premium Dark Theme";
  const showcaseLimit = Number(input.showcaseImageCount || 8);
  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; color: ${settings.primaryColor}; background: ${settings.backgroundColor}; font-family: ${settings.bodyFont}, Inter, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 22mm; page-break-after: always; position: relative; overflow: hidden; background: ${dark ? settings.primaryColor : "#fffdf8"}; color: ${dark ? settings.backgroundColor : settings.primaryColor}; }
    .dark { background: ${settings.primaryColor}; color: ${settings.backgroundColor}; }
    .serif { font-family: ${settings.headingFont}, Georgia, 'Times New Roman', serif; letter-spacing: .02em; }
    .kicker { color: ${settings.accentColor}; text-transform: uppercase; font-size: 10px; letter-spacing: .34em; margin-bottom: 10mm; }
    h1, h2, h3, p { margin: 0; } p { line-height: 1.72; font-size: 12px; }
    .cover h1 { font-size: 58px; line-height: .92; font-weight: 400; margin: 11mm 0; position: relative; z-index: 2; }
    .cover h1 em { color: ${settings.goldColor}; font-style: italic; }
    .cover-hero { width: 100%; height: 100%; object-fit: cover; filter: saturate(.92) contrast(1.04); }
    .full-cover { padding: 0; } .full-cover .cover-hero { position: absolute; inset: 0; opacity: .56; } .cover-overlay { position: relative; z-index: 2; padding: 24mm; }
    .split-cover { display: grid; grid-template-columns: .92fr 1.08fr; gap: 12mm; align-items: center; } .split-cover .cover-art { height: 190mm; overflow: hidden; }
    .magazine-cover { padding: 0; } .magazine-cover .cover-hero { position: absolute; inset: 0; } .magazine-cover:after { content: ''; position: absolute; inset: 0; background: rgba(13,42,36,.34); } .magazine-masthead { position: relative; z-index: 2; padding-top: 12mm; text-align: center; font-size: 34px; letter-spacing: .38em; color: #fffdf8; }
    .minimal-cover { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; } .minimal-line { width: 42mm; border-top: 1px solid ${settings.goldColor}; margin: 8mm auto; }
    .quote { font-size: 19px; line-height: 1.42; max-width: 120mm; position: relative; z-index: 2; }
    .logo { width: 31mm; height: auto; }
    .bottom { position: absolute; left: 22mm; right: 22mm; bottom: 18mm; display: flex; align-items: end; justify-content: space-between; z-index: 3; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; align-items: start; }
    h2 { font-size: 38px; line-height: 1; font-weight: 400; margin-bottom: 8mm; }
    .feature { width: 100%; height: 118mm; object-fit: cover; margin-top: 10mm; }
    .story-card { margin-top: 14mm; padding: 12mm; border: 1px solid ${settings.goldColor}; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
    .story-card h2 { margin-bottom: 5mm; } .story-meta { text-transform: uppercase; letter-spacing: .2em; font-size: 10px; color: ${settings.accentColor}; line-height: 2; }
    .services h1 { font-size: 35px; line-height: 1.05; font-weight: 500; max-width: 150mm; }
    .intro { max-width: 145mm; margin: 8mm 0 12mm; color: ${dark ? settings.goldColor : "#465b55"}; }
    .service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
    .service, .delivery, .addon { border-top: 1px solid ${settings.goldColor}; padding-top: 5mm; break-inside: avoid; }
    .service.featured { border: 1px solid ${settings.goldColor}; padding: 5mm; background: rgba(214,195,165,.11); }
    .service-head { display: flex; justify-content: space-between; color: ${settings.accentColor}; font-size: 12px; letter-spacing: .24em; } .icon { font-size: 20px; letter-spacing: 0; }
    .badge { display: inline-block; margin-top: 3mm; color: ${settings.accentColor}; text-transform: uppercase; font-size: 9px; letter-spacing: .24em; }
    .service h3, .delivery h3, .addon h3 { font-size: 18px; font-family: ${settings.headingFont}, Georgia, serif; font-weight: 400; margin: 2mm 0 3mm; }
    .service-description { color: ${dark ? settings.goldColor : "#526861"}; margin-bottom: 2mm; }
    ul { margin: 0; padding-left: 4mm; } li { margin: 1.5mm 0; font-size: 11px; line-height: 1.45; }
    .delivery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-bottom: 14mm; }
    .terms { position: absolute; left: 22mm; right: 22mm; bottom: 22mm; border-top: 1px solid ${settings.goldColor}; padding-top: 7mm; }
    .addon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-bottom: 12mm; }
    .gallery { display: grid; gap: 4mm; grid-auto-flow: dense; }
    .gallery img { width: 100%; height: 100%; object-fit: cover; } .tile { margin: 0; overflow: hidden; background: ${settings.backgroundColor}; }
    .editorial-layout, .showcase-layout { grid-template-columns: repeat(6, 1fr); grid-auto-rows: 29mm; } .masonry-layout { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 24mm; } .premium-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 36mm; } .story-layout { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 42mm; }
    .t1 { grid-column: span 4; grid-row: span 2; } .t2 { grid-column: span 2; grid-row: span 1; } .t3 { grid-column: span 2; grid-row: span 2; } .t4 { grid-column: span 3; grid-row: span 1; } .t5 { grid-column: span 3; grid-row: span 2; } .t6 { grid-column: span 3; grid-row: span 1; } .t7 { grid-column: span 2; grid-row: span 2; } .t8 { grid-column: span 4; grid-row: span 1; }
    .magazine-style .page { background: #fbfaf6; } .magazine-style h2:after { content: ''; display: block; width: 24mm; border-top: 1px solid ${settings.goldColor}; margin-top: 4mm; }
    .minimal-elegant .page { padding: 26mm; } .minimal-elegant .service-grid, .minimal-elegant .delivery-grid { gap: 10mm; }
    .meta { color: ${settings.goldColor}; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
  </style></head><body class="${template}">
  ${coverMarkup(input, settings)}
  <section class="page"><div class="two"><div><div class="kicker">A Beautiful Beginning</div><h2 class="serif">Designed for your forever story.</h2>${paragraph(settings.beautifulBeginning)}</div><div><div class="kicker">Why Choose Us</div><h2 class="serif">Editorial beauty. Complete coverage.</h2>${paragraph(settings.whyChooseUs)}</div></div>${input.galleryImages[0] ? `<img class="feature" src="${asset(input.galleryImages[0])}" />` : ""}${input.includeClientStory ? `<div class="story-card"><div><div class="kicker">Your Wedding Story Begins Here</div><h2 class="serif">${esc(input.brideName)} & ${esc(input.groomName)}</h2><p>${esc(input.welcomeMessage)}</p></div><div class="story-meta">${esc(input.weddingDate)}<br/>${esc(input.venue)}<br/>Prepared for ${esc(input.clientName)}</div></div>` : ""}</section>
  <section class="page services"><div class="kicker">Services Included</div><h1 class="serif">${esc(input.servicesTitle)}</h1><p class="intro">${intro}</p><div class="service-grid">${serviceMarkup(input.services)}</div></section>
  <section class="page"><div class="kicker">Final Data Delivery Details</div><h2 class="serif">Your finished memories, prepared with care.</h2><div class="delivery-grid">${deliveryMarkup(input.deliveryItems)}</div><div class="terms"><div class="kicker">Terms and Conditions</div>${paragraph(settings.terms)}</div></section>
  <section class="page"><div class="kicker">Optional Addons</div><h2 class="serif">Enhance the celebration experience.</h2><div class="addon-grid">${addonsMarkup(input.addons)}</div><div class="kicker">Portfolio Showcase</div><div class="${galleryClass(input.galleryLayout)}">${galleryMarkup(input.galleryImages, input.galleryLayout, showcaseLimit)}</div><div class="bottom"><span>${esc(settings.footer)}</span><img class="logo" src="${asset(settings.logoUrl)}" /></div></section>
  </body></html>`;
}

export async function generatePdf(html: string, id: string) {
  const outputDir = path.join(process.cwd(), "public", "proposals");
  await mkdir(outputDir, { recursive: true });
  const pdfPath = path.join(outputDir, `${id}.pdf`);
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 2480, height: 3508, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.emulateMediaType("print");
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true, preferCSSPageSize: true, scale: 1 });
  } finally {
    await browser.close();
  }
  return `/proposals/${id}.pdf`;
}

export async function saveHtmlPreview(html: string, id: string) {
  const outputDir = path.join(process.cwd(), "public", "proposals");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, `${id}.html`), html);
}
