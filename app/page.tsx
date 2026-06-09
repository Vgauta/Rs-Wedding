"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, BarChart3, Check, Copy, Moon, Plus, Save, Send, Settings, Share2, Sparkles, Trash2, Upload } from "lucide-react";
import { ChangeEvent, DragEvent, FormEvent, MouseEvent, ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import type { AddonItem, CoverStyle, DashboardStats, DeliveryItem, GalleryLayout, MediaAsset, MediaCategory, PackageTemplate, PdfTemplate, ProposalPayload, ServiceBlock, Settings as SettingsType } from "@/lib/types";
import { defaultAddons, defaultDeliveryItems, defaultServices, defaultSettings } from "@/lib/defaults";
import { createId } from "@/lib/id";

const uid = () => createId();
const categories: MediaCategory[] = ["Wedding", "Pre Wedding", "Reception", "Haldi", "Mehendi", "Engagement", "Drone", "Cinematic", "Candid"];
const pdfTemplates: PdfTemplate[] = ["Luxury Editorial", "Magazine Style", "Minimal Elegant", "Premium Dark Theme"];
const coverStyles: CoverStyle[] = ["Full Screen Hero Image", "Split Layout", "Magazine Cover", "Luxury Minimal"];
const galleryLayouts: GalleryLayout[] = ["Editorial Layout", "Masonry Layout", "Premium Grid", "Story Layout", "Showcase Layout"];
const emptyService = (): ServiceBlock => ({ id: uid(), title: "Drone Coverage", description: "Aerial venue visuals and cinematic establishing shots.", icon: "◇", featured: false, badge: "Recommended", points: ["Licensed drone operator", "Venue aerials", "Cinematic movement shots"] });
const emptyDelivery = (): DeliveryItem => ({ id: uid(), title: "Highlight Film", points: ["Edited cinematic highlight film", "Delivered in shareable digital format"] });
const emptyAddon = (): AddonItem => ({ id: uid(), title: "Pre Wedding Shoot", description: "Editorial portrait session planned before the wedding celebration." });

type Result = { pdfUrl: string; previewUrl: string; whatsappUrl: string };

const initialProposal: ProposalPayload = {
  clientName: "",
  brideName: "",
  groomName: "",
  weddingDate: "",
  venue: "",
  whatsappNumber: "",
  servicesTitle: "CINEMATIC, CANDID & TRADITIONAL PHOTOGRAPHY + VIDEOGRAPHY",
  services: defaultServices.map((service) => ({ ...service, id: uid() })),
  deliveryItems: defaultDeliveryItems.map((item) => ({ ...item, id: uid() })),
  addons: defaultAddons.map((addon) => ({ ...addon, id: uid() })),
  pdfTemplate: "Luxury Editorial",
  coverStyle: "Full Screen Hero Image",
  galleryLayout: "Editorial Layout",
  showcaseImageCount: 8,
  selectedMediaIds: [],
  includeClientStory: true,
  welcomeMessage: "A celebration shaped by family, tradition, and the quiet moments that make your story unforgettable.",
};

export default function Home() {
  const [dark, setDark] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [proposal, setProposal] = useState<ProposalPayload>(initialProposal);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaCategory, setMediaCategory] = useState<MediaCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("Wedding");
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [packageName, setPackageName] = useState("Premium Package");
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

  useEffect(() => { document.body.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).catch(() => setSettings(defaultSettings));
    fetchPackages();
    fetchDashboard();
    const draft = localStorage.getItem("rs-weddings-draft");
    if (draft) {
      try { setProposal({ ...initialProposal, ...JSON.parse(draft) }); }
      catch { localStorage.removeItem("rs-weddings-draft"); }
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => null);
  }, []);
  useEffect(() => { fetchMedia(); }, [mediaSearch, mediaCategory]);

  const imagePreviews = useMemo(() => galleryImages.map((file) => URL.createObjectURL(file)), [galleryImages]);
  const heroPreview = useMemo(() => (heroImage ? URL.createObjectURL(heroImage) : null), [heroImage]);
  const selectedMedia = media.filter((asset) => proposal.selectedMediaIds.includes(asset.id));

  function setField<K extends keyof ProposalPayload>(key: K, value: ProposalPayload[K]) { setProposal((prev) => ({ ...prev, [key]: value })); }
  function updateService(id: string, patch: Partial<ServiceBlock>) { setField("services", proposal.services.map((service) => (service.id === id ? { ...service, ...patch } : service))); }
  function updateDelivery(id: string, patch: Partial<DeliveryItem>) { setField("deliveryItems", proposal.deliveryItems.map((item) => (item.id === id ? { ...item, ...patch } : item))); }
  function move<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) { const index = items.findIndex((item) => item.id === id); const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }
  function saveDraft() { localStorage.setItem("rs-weddings-draft", JSON.stringify(proposal)); window.alert("Draft saved on this device."); }

  async function fetchMedia() { const params = new URLSearchParams({ q: mediaSearch, category: mediaCategory }); setMedia(await fetch(`/api/media?${params}`).then((r) => r.json()).catch(() => [])); }
  async function fetchPackages() { setPackages(await fetch("/api/package-templates").then((r) => r.json()).catch(() => [])); }
  async function fetchDashboard() { setDashboard(await fetch("/api/dashboard").then((r) => r.json()).catch(() => null)); }

  async function uploadMedia(files: File[]) {
    const form = new FormData();
    form.set("category", uploadCategory);
    files.forEach((file) => form.append("images", file));
    await fetch("/api/media", { method: "POST", body: form });
    await fetchMedia();
  }

  async function deleteMedia(id: string) {
    await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    setField("selectedMediaIds", proposal.selectedMediaIds.filter((selectedId) => selectedId !== id));
    await fetchMedia();
  }

  async function reorderMedia(targetId: string) {
    if (!draggedMediaId || draggedMediaId === targetId) return;
    const current = [...media];
    const from = current.findIndex((item) => item.id === draggedMediaId);
    const to = current.findIndex((item) => item.id === targetId);
    const [item] = current.splice(from, 1);
    current.splice(to, 0, item);
    setMedia(current);
    setDraggedMediaId(null);
    await fetch("/api/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: current.map((asset) => asset.id) }) });
  }

  function applyPackage(template: PackageTemplate) {
    setProposal((prev) => ({ ...prev, packageTemplateId: template.id, servicesTitle: template.servicesTitle, services: template.services.map((service) => ({ ...service, id: uid() })), deliveryItems: template.deliveryItems.map((item) => ({ ...item, id: uid() })), addons: template.addons.map((addon) => ({ ...addon, id: uid() })) }));
  }

  async function saveAsPackage() {
    const body = { name: packageName, servicesTitle: proposal.servicesTitle, services: proposal.services, deliveryItems: proposal.deliveryItems, addons: proposal.addons };
    const saved = await fetch("/api/package-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    setProposal((prev) => ({ ...prev, packageTemplateId: saved.id }));
    await fetchPackages();
    window.alert("Package template saved.");
  }

  async function submit(event?: FormEvent | MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    setGenerating(true);
    setResult(null);
    const form = new FormData();
    form.append("payload", JSON.stringify(proposal));
    if (heroImage) form.append("heroImage", heroImage);
    galleryImages.forEach((file) => form.append("galleryImages", file));
    try {
      const response = await fetch("/api/proposals", { method: "POST", body: form });
      if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error ?? "Unable to generate proposal."); }
      const data = (await response.json()) as Result;
      setResult(data);
      await fetchDashboard();
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) { window.alert(error instanceof Error ? error.message : "Unable to generate proposal."); }
    finally { setGenerating(false); }
  }

  async function saveAdminSettings(event: FormEvent) {
    event.preventDefault();
    setSavingSettings(true);
    const form = new FormData(event.currentTarget as HTMLFormElement);
    form.set("settings", JSON.stringify(settings));
    const response = await fetch("/api/settings", { method: "POST", body: form });
    setSettings(await response.json());
    setSavingSettings(false);
    setSettingsOpen(false);
  }

  function copyLink() { if (result?.pdfUrl) navigator.clipboard.writeText(result.pdfUrl); }
  function nativeShare() { if (result?.pdfUrl && navigator.share) navigator.share({ title: "RS Weddings Proposal", text: "Your personalized RS Weddings proposal", url: result.pdfUrl }); }

  return <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] dark:bg-[#071915] dark:text-[#F4F2EC]">
    <header className="sticky top-0 z-30 border-b border-[#A58F68]/20 bg-[#F4F2EC]/90 px-4 py-3 backdrop-blur dark:bg-[#071915]/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3"><img src={settings.logoUrl} className="h-12 w-12 border border-[#D6C3A5]/40" alt="RS Weddings" /><div><p className="font-serif text-xl tracking-wide">RS Weddings</p><p className="text-xs uppercase tracking-[0.26em] text-[#A58F68]">Luxury Sales Studio</p></div></div>
        <div className="flex gap-2"><IconButton label="Dashboard" onClick={() => setDashboardOpen(true)}><BarChart3 /></IconButton><IconButton label="Media" onClick={() => setMediaOpen(true)}><Sparkles /></IconButton><IconButton label="Dark" onClick={() => setDark(!dark)}><Moon /></IconButton><IconButton label="Settings" onClick={() => setSettingsOpen(true)}><Settings /></IconButton></div>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-4 pb-40 pt-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border border-[#A58F68]/25 bg-[#fffdf8] p-6 editorial-shadow dark:bg-[#0D2A24] md:p-10">
        <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[#A58F68]"><Sparkles className="h-4 w-4" /> 60-Second Proposal Tool</div>
        <h1 className="font-serif text-5xl leading-[0.95] md:text-7xl">Design, generate and share a luxury proposal from one screen.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#49645c] dark:text-[#D6C3A5]">Reusable media, saved packages, premium PDF templates, smart covers, and multi-channel sharing built for a high-end wedding studio.</p>
      </motion.div>

      {dashboard && <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Total Proposals" value={String(dashboard.totalProposals)} /><Metric label="Most Used" value={dashboard.mostUsedPackage} /><Metric label="Media Selected" value={String(proposal.selectedMediaIds.length)} /><Metric label="PDF Template" value={proposal.pdfTemplate} /></div>}

      <form onSubmit={submit} className="space-y-5">
        <Card title="Proposal Experience" eyebrow="Step 01"><div className="grid gap-4 md:grid-cols-2"><Select label="Saved Package" value={proposal.packageTemplateId ?? ""} onChange={(v) => { const chosen = packages.find((item) => item.id === v); if (chosen) applyPackage(chosen); }} options={[{ label: "Choose a package", value: "" }, ...packages.map((item) => ({ label: item.name, value: item.id }))]} /><Input label="Save Current Setup As" value={packageName} onChange={setPackageName} /><button type="button" onClick={saveAsPackage} className="h-13 border border-[#A58F68]/35 text-sm font-semibold md:col-span-2"><Save className="mr-2 inline h-4 w-4" />Save as Package Template</button></div></Card>

        <Card title="Client Information" eyebrow="Step 02"><div className="grid gap-4 md:grid-cols-2"><Input label="Client Name" value={proposal.clientName} onChange={(v) => setField("clientName", v)} required /><Input label="WhatsApp Number" value={proposal.whatsappNumber} onChange={(v) => setField("whatsappNumber", v)} placeholder="919999999999" required /><Input label="Bride Name" value={proposal.brideName} onChange={(v) => setField("brideName", v)} required /><Input label="Groom Name" value={proposal.groomName} onChange={(v) => setField("groomName", v)} required /><Input label="Wedding Date" type="date" value={proposal.weddingDate} onChange={(v) => setField("weddingDate", v)} /><Input label="Venue" value={proposal.venue} onChange={(v) => setField("venue", v)} /></div><div className="mt-5 grid gap-4 md:grid-cols-2"><FileBox label="Hero Cover Image" onChange={(files) => setHeroImage(files[0] ?? null)} preview={heroPreview} /><FileBox label="One-Off Gallery Uploads" multiple onChange={setGalleryImages} previews={imagePreviews} /></div></Card>

        <Card title="Template & Story" eyebrow="Step 03"><div className="grid gap-4 md:grid-cols-2"><Select label="PDF Template" value={proposal.pdfTemplate} onChange={(v) => setField("pdfTemplate", v as PdfTemplate)} options={pdfTemplates.map((value) => ({ label: value, value }))} /><Select label="Cover Style" value={proposal.coverStyle} onChange={(v) => setField("coverStyle", v as CoverStyle)} options={coverStyles.map((value) => ({ label: value, value }))} /><Select label="Gallery Layout" value={proposal.galleryLayout} onChange={(v) => setField("galleryLayout", v as GalleryLayout)} options={galleryLayouts.map((value) => ({ label: value, value }))} /><Select label="Showcase Images" value={String(proposal.showcaseImageCount)} onChange={(v) => setField("showcaseImageCount", Number(v) as 1 | 2 | 4 | 6 | 8)} options={[1, 2, 4, 6, 8].map((value) => ({ label: `${value} images`, value: String(value) }))} /></div><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={proposal.includeClientStory} onChange={(e) => setField("includeClientStory", e.target.checked)} className="h-5 w-5" /> Include “Your Wedding Story Begins Here” page section</label><div className="mt-4"><TextArea label="Custom Welcome Message" value={proposal.welcomeMessage} onChange={(v) => setField("welcomeMessage", v)} /></div></Card>

        <Card title="Reusable Portfolio Selection" eyebrow="Step 04"><div className="mb-4 flex flex-wrap gap-2">{selectedMedia.map((asset) => <button key={asset.id} type="button" onClick={() => setField("selectedMediaIds", proposal.selectedMediaIds.filter((id) => id !== asset.id))} className="relative h-24 w-20 overflow-hidden border border-[#D6C3A5]"><img src={asset.url} alt={asset.name} className="h-full w-full object-cover" /><Check className="absolute right-1 top-1 h-4 w-4 bg-[#0D2A24] text-[#D6C3A5]" /></button>)}<button type="button" onClick={() => setMediaOpen(true)} className="h-24 w-24 border border-dashed border-[#A58F68]/50 text-xs uppercase tracking-[0.2em] text-[#A58F68]">Open Library</button></div><p className="text-sm leading-6 text-[#49645c] dark:text-[#D6C3A5]">Select reusable images from the media library; one-off uploads above are still available for client-specific images.</p></Card>

        <Card title="Services Section" eyebrow="Step 05"><TextArea label="Main Services Title" value={proposal.servicesTitle} onChange={(v) => setField("servicesTitle", v)} rows={3} /><div className="mt-5 space-y-4">{proposal.services.map((service) => <RepeaterCard key={service.id} title={service.title || "Service"} onDelete={() => setField("services", proposal.services.filter((s) => s.id !== service.id))} onUp={() => setField("services", move(proposal.services, service.id, -1))} onDown={() => setField("services", move(proposal.services, service.id, 1))}><div className="grid gap-4 md:grid-cols-[.5fr_1.5fr_1fr]"><Input label="Icon" value={service.icon ?? ""} onChange={(v) => updateService(service.id, { icon: v })} /><Input label="Service Title" value={service.title} onChange={(v) => updateService(service.id, { title: v })} /><Input label="Badge" value={service.badge ?? ""} onChange={(v) => updateService(service.id, { badge: v })} /></div><TextArea label="Description" value={service.description ?? ""} onChange={(v) => updateService(service.id, { description: v })} /><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={Boolean(service.featured)} onChange={(e) => updateService(service.id, { featured: e.target.checked })} className="h-5 w-5" /> Featured premium service</label><PointsEditor points={service.points} onChange={(points) => updateService(service.id, { points })} /></RepeaterCard>)}</div><AddButton onClick={() => setField("services", [...proposal.services, emptyService()])}>Add Service</AddButton></Card>

        <Card title="Final Delivery Section" eyebrow="Step 06"><div className="space-y-4">{proposal.deliveryItems.map((item) => <RepeaterCard key={item.id} title={item.title || "Delivery Item"} onDelete={() => setField("deliveryItems", proposal.deliveryItems.filter((d) => d.id !== item.id))} onUp={() => setField("deliveryItems", move(proposal.deliveryItems, item.id, -1))} onDown={() => setField("deliveryItems", move(proposal.deliveryItems, item.id, 1))}><Input label="Delivery Item" value={item.title} onChange={(v) => updateDelivery(item.id, { title: v })} /><PointsEditor points={item.points} onChange={(points) => updateDelivery(item.id, { points })} /></RepeaterCard>)}</div><AddButton onClick={() => setField("deliveryItems", [...proposal.deliveryItems, emptyDelivery()])}>Add Delivery Item</AddButton></Card>

        <Card title="Optional Addons" eyebrow="Step 07"><div className="space-y-4">{proposal.addons.map((addon) => <RepeaterCard key={addon.id} title={addon.title || "Addon"} onDelete={() => setField("addons", proposal.addons.filter((a) => a.id !== addon.id))} onUp={() => setField("addons", move(proposal.addons, addon.id, -1))} onDown={() => setField("addons", move(proposal.addons, addon.id, 1))}><Input label="Addon Title" value={addon.title} onChange={(v) => setField("addons", proposal.addons.map((a) => a.id === addon.id ? { ...a, title: v } : a))} /><TextArea label="Addon Description" value={addon.description ?? ""} onChange={(v) => setField("addons", proposal.addons.map((a) => a.id === addon.id ? { ...a, description: v } : a))} /></RepeaterCard>)}</div><AddButton onClick={() => setField("addons", [...proposal.addons, emptyAddon()])}>Add Addon</AddButton></Card>
      </form>
    </section>

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#A58F68]/20 bg-[#F4F2EC]/95 px-4 py-3 safe-bottom backdrop-blur dark:bg-[#071915]/95"><div className="mx-auto flex max-w-6xl gap-3"><button onClick={saveDraft} className="flex h-14 flex-1 items-center justify-center gap-2 border border-[#A58F68]/35 text-sm font-semibold"><Save className="h-4 w-4" /> Save Draft</button><button onClick={submit} disabled={generating} className="flex h-14 flex-[1.4] items-center justify-center gap-2 bg-[#0D2A24] text-sm font-semibold text-[#F4F2EC] disabled:opacity-60 dark:bg-[#D6C3A5] dark:text-[#0D2A24]"><Send className="h-4 w-4" /> {generating ? "Generating…" : "Generate & Send"}</button></div>{result && <div className="mx-auto mt-3 grid max-w-6xl grid-cols-3 gap-2 text-xs md:grid-cols-6"><ShareButton href={result.whatsappUrl}>WhatsApp</ShareButton><ShareButton href={`https://t.me/share/url?url=${encodeURIComponent(result.pdfUrl)}`}>Telegram</ShareButton><ShareButton href={`mailto:?subject=RS Weddings Proposal&body=${encodeURIComponent(result.pdfUrl)}`}>Email</ShareButton><ShareButton href={result.pdfUrl} download>Download</ShareButton><button onClick={copyLink} className="border border-[#A58F68]/30 py-2"><Copy className="mx-auto h-4 w-4" />Copy</button><button onClick={nativeShare} className="border border-[#A58F68]/30 py-2"><Share2 className="mx-auto h-4 w-4" />Share</button></div>}</div>

    <AnimatePresence>{mediaOpen && <Modal title="Media Library" eyebrow="Reusable Portfolio System" onClose={() => setMediaOpen(false)}><div className="grid gap-4 md:grid-cols-[1fr_.6fr]"><Input label="Search Images" value={mediaSearch} onChange={setMediaSearch} /><Select label="Filter Category" value={mediaCategory} onChange={(v) => setMediaCategory(v as MediaCategory | "all")} options={[{ label: "All Categories", value: "all" }, ...categories.map((value) => ({ label: value, value }))]} /></div><div className="mt-4 grid gap-4 md:grid-cols-[.6fr_1fr]"><Select label="Upload Category" value={uploadCategory} onChange={(v) => setUploadCategory(v as MediaCategory)} options={categories.map((value) => ({ label: value, value }))} /><FileBox label="Upload Unlimited Photos" multiple onChange={uploadMedia} /></div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{media.map((asset) => <div key={asset.id} draggable onDragStart={() => setDraggedMediaId(asset.id)} onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={() => reorderMedia(asset.id)} className="group border border-[#A58F68]/20 bg-[#fffdf8] p-2"><button type="button" onClick={() => setField("selectedMediaIds", proposal.selectedMediaIds.includes(asset.id) ? proposal.selectedMediaIds.filter((id) => id !== asset.id) : [...proposal.selectedMediaIds, asset.id])} className="relative block h-36 w-full overflow-hidden"><img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition group-hover:scale-105" />{proposal.selectedMediaIds.includes(asset.id) && <Check className="absolute right-2 top-2 h-5 w-5 bg-[#0D2A24] text-[#D6C3A5]" />}</button><div className="mt-2 flex items-center justify-between gap-2"><div><p className="truncate text-xs font-semibold">{asset.name}</p><p className="text-[10px] uppercase tracking-[0.18em] text-[#A58F68]">{asset.category}</p></div><button type="button" onClick={() => deleteMedia(asset.id)} className="h-8 w-8 border border-[#A58F68]/30"><Trash2 className="m-auto h-3 w-3" /></button></div></div>)}</div></Modal>}</AnimatePresence>

    <AnimatePresence>{dashboardOpen && <Modal title="Studio Dashboard" eyebrow="Luxury sales overview" onClose={() => setDashboardOpen(false)}><div className="grid grid-cols-2 gap-3"><Metric label="Total Proposals Created" value={String(dashboard?.totalProposals ?? 0)} /><Metric label="Most Used Package" value={dashboard?.mostUsedPackage ?? "No package yet"} /></div><h3 className="mt-6 font-serif text-2xl">Recent Proposals</h3><div className="mt-3 space-y-2">{dashboard?.recentProposals.map((item) => <a key={item.id} href={item.pdfUrl} target="_blank" className="flex justify-between border border-[#A58F68]/20 p-3 text-sm"><span>{item.clientName || `${item.brideName} & ${item.groomName}`}</span><span className="text-[#A58F68]">PDF</span></a>)}</div><h3 className="mt-6 font-serif text-2xl">Recent Clients</h3><div className="mt-3 space-y-2">{dashboard?.recentClients.map((item) => <div key={`${item.clientName}-${item.createdAt}`} className="border border-[#A58F68]/20 p-3 text-sm"><p>{item.clientName}</p><p className="text-[#A58F68]">{item.whatsappNumber}</p></div>)}</div><button type="button" onClick={() => { setDashboardOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-5 h-13 w-full bg-[#0D2A24] text-[#F4F2EC]">Quick Create Proposal</button></Modal>}</AnimatePresence>

    <AnimatePresence>{settingsOpen && <Modal title="Brand & Static Content" eyebrow="Admin Settings" onClose={() => setSettingsOpen(false)}><form onSubmit={saveAdminSettings}><div className="grid gap-4 md:grid-cols-2"><Input label="Primary Color" value={settings.primaryColor} onChange={(v) => setSettings({ ...settings, primaryColor: v })} /><Input label="Secondary Color" value={settings.secondaryColor} onChange={(v) => setSettings({ ...settings, secondaryColor: v })} /><Input label="Accent Color" value={settings.accentColor} onChange={(v) => setSettings({ ...settings, accentColor: v })} /><Input label="Footer Text" value={settings.footer} onChange={(v) => setSettings({ ...settings, footer: v })} /><Input label="Heading Font" value={settings.headingFont} onChange={(v) => setSettings({ ...settings, headingFont: v })} /><Input label="Body Font" value={settings.bodyFont} onChange={(v) => setSettings({ ...settings, bodyFont: v })} /><label className="text-sm font-medium md:col-span-2">Logo Upload<input name="logo" type="file" accept="image/*,.svg" className="mt-2 w-full border border-[#A58F68]/30 p-3" /></label></div><div className="mt-4 space-y-4"><TextArea label="A Beautiful Beginning" value={settings.beautifulBeginning} onChange={(v) => setSettings({ ...settings, beautifulBeginning: v })} /><TextArea label="Why Choose Us" value={settings.whyChooseUs} onChange={(v) => setSettings({ ...settings, whyChooseUs: v })} /><TextArea label="Terms & Conditions" value={settings.terms} onChange={(v) => setSettings({ ...settings, terms: v })} /><TextArea label="WhatsApp Template" value={settings.whatsappTemplate} onChange={(v) => setSettings({ ...settings, whatsappTemplate: v })} rows={7} /></div><button disabled={savingSettings} className="mt-5 h-13 w-full bg-[#0D2A24] text-[#F4F2EC]">{savingSettings ? "Saving…" : "Save Settings"}</button></form></Modal>}</AnimatePresence>
  </main>;
}

function Modal({ eyebrow, title, children, onClose }: { eyebrow: string; title: string; children: ReactNode; onClose: () => void }) { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-auto bg-[#071915]/70 p-4 backdrop-blur"><motion.div initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} className="mx-auto max-w-5xl bg-[#fffdf8] p-5 text-[#0D2A24]"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.26em] text-[#A58F68]">{eyebrow}</p><h2 className="font-serif text-4xl">{title}</h2></div><button type="button" onClick={onClose} className="border px-4 py-2">Close</button></div>{children}</motion.div></motion.div>; }
function Card({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) { return <section className="border border-[#A58F68]/25 bg-[#fffdf8] p-5 dark:bg-[#0D2A24]"><p className="mb-2 text-xs uppercase tracking-[0.28em] text-[#A58F68]">{eyebrow}</p><h2 className="mb-5 font-serif text-3xl">{title}</h2>{children}</section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-[#A58F68]/25 bg-[#fffdf8] p-4 dark:bg-[#0D2A24]"><p className="text-[10px] uppercase tracking-[0.22em] text-[#A58F68]">{label}</p><p className="mt-2 truncate font-serif text-2xl">{value}</p></div>; }
function Input({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) { return <label className="block text-sm font-medium">{label}<input required={required} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-2 h-13 w-full border border-[#A58F68]/30 bg-transparent px-4 outline-none focus:border-[#0D2A24] dark:focus:border-[#D6C3A5]" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) { return <label className="block text-sm font-medium">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-13 w-full border border-[#A58F68]/30 bg-transparent px-4 outline-none focus:border-[#0D2A24] dark:focus:border-[#D6C3A5]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) { return <label className="block text-sm font-medium">{label}<textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border border-[#A58F68]/30 bg-transparent p-4 leading-6 outline-none focus:border-[#0D2A24] dark:focus:border-[#D6C3A5]" /></label>; }
function FileBox({ label, multiple, onChange, preview, previews }: { label: string; multiple?: boolean; onChange: (files: File[]) => void; preview?: string | null; previews?: string[] }) { return <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onChange(Array.from(event.dataTransfer.files ?? [])); }} className="flex min-h-36 cursor-pointer flex-col justify-between border border-dashed border-[#A58F68]/50 p-4"><span className="flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4" />{label}</span><input type="file" accept="image/*" multiple={multiple} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Array.from(event.target.files ?? []))} className="sr-only" />{preview && <img src={preview} alt="Preview" className="mt-4 h-32 w-full object-cover" />}{previews && previews.length > 0 && <div className="mt-4 grid grid-cols-4 gap-2">{previews.slice(0, 8).map((src) => <img key={src} src={src} alt="Gallery preview" className="h-16 object-cover" />)}</div>}<span className="mt-3 text-xs text-[#A58F68]">Tap or drop to upload</span></label>; }
function RepeaterCard({ title, children, onDelete, onUp, onDown }: { title: string; children: ReactNode; onDelete: () => void; onUp: () => void; onDown: () => void }) { return <div className="border border-[#A58F68]/20 p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-serif text-2xl">{title}</h3><div className="flex gap-2"><IconButton label="Move up" onClick={onUp}><ArrowUp /></IconButton><IconButton label="Move down" onClick={onDown}><ArrowDown /></IconButton><IconButton label="Delete" onClick={onDelete}><Trash2 /></IconButton></div></div><div className="space-y-4">{children}</div></div>; }
function IconButton({ children, onClick, label }: { children: ReactElement; onClick: () => void; label: string }) { return <button aria-label={label} type="button" onClick={onClick} className="h-10 w-10 border border-[#A58F68]/30 [&_svg]:m-auto [&_svg]:h-4 [&_svg]:w-4">{children}</button>; }
function PointsEditor({ points, onChange }: { points: string[]; onChange: (points: string[]) => void }) { return <div className="space-y-2"><p className="text-sm font-medium">Bullet Points</p>{points.map((point, index) => <div key={index} className="flex gap-2"><input value={point} onChange={(e) => onChange(points.map((p, i) => i === index ? e.target.value : p))} className="h-12 flex-1 border border-[#A58F68]/30 bg-transparent px-4 outline-none" /><button type="button" onClick={() => onChange(points.filter((_, i) => i !== index))} className="h-12 w-12 border border-[#A58F68]/30"><Trash2 className="m-auto h-4 w-4" /></button></div>)}<button type="button" onClick={() => onChange([...points, ""])} className="mt-2 flex h-11 items-center gap-2 border border-[#A58F68]/30 px-4 text-sm"><Plus className="h-4 w-4" /> Add Bullet</button></div>; }
function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className="mt-5 flex h-12 w-full items-center justify-center gap-2 border border-[#A58F68]/35 text-sm font-semibold"><Plus className="h-4 w-4" />{children}</button>; }
function ShareButton({ children, href, download }: { children: ReactNode; href: string; download?: boolean }) { return <a href={href} target="_blank" download={download} className="border border-[#A58F68]/30 py-2 text-center">{children}</a>; }
