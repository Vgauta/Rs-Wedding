import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { defaultSettings, starterPackageTemplates } from "./defaults";
import type { DashboardStats, MediaAsset, PackageTemplate, Settings } from "./types";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "rs-weddings.sqlite"));

db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    groom_name TEXT NOT NULL,
    wedding_date TEXT,
    venue TEXT,
    whatsapp_number TEXT,
    pdf_url TEXT NOT NULL,
    package_template_id TEXT,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    alt TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS package_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

try {
  db.exec("ALTER TABLE proposals ADD COLUMN package_template_id TEXT");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("duplicate column")) {
    throw error;
  }
}

db.prepare("INSERT OR IGNORE INTO settings (id, data, updated_at) VALUES (1, ?, ?)").run(JSON.stringify(defaultSettings), new Date().toISOString());

const insertStarterPackage = db.prepare("INSERT OR IGNORE INTO package_templates (id, name, data, usage_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
for (const template of starterPackageTemplates) {
  insertStarterPackage.run(template.id, template.name, JSON.stringify(template), template.usageCount, template.createdAt, template.updatedAt);
}

export function getSettings(): Settings {
  const row = db.prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
  return { ...defaultSettings, ...(row ? JSON.parse(row.data) : {}) };
}

export function saveSettings(settings: Settings) {
  db.prepare("UPDATE settings SET data = ?, updated_at = ? WHERE id = 1").run(JSON.stringify(settings), new Date().toISOString());
  return settings;
}

export function listMediaAssets(search = "", category = "all"): MediaAsset[] {
  const where: string[] = [];
  const params: string[] = [];
  if (search) { where.push("LOWER(name) LIKE LOWER(?)"); params.push(`%${search}%`); }
  if (category !== "all") { where.push("category = ?"); params.push(category); }
  const query = `SELECT id, url, name, category, alt, sort_order as sortOrder, created_at as createdAt FROM media_assets ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY sort_order ASC, created_at DESC`;
  return db.prepare(query).all(...params) as MediaAsset[];
}

export function createMediaAsset(asset: MediaAsset) {
  db.prepare("INSERT INTO media_assets (id, url, name, category, alt, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(asset.id, asset.url, asset.name, asset.category, asset.alt ?? "", asset.sortOrder, asset.createdAt);
  return asset;
}

export function deleteMediaAsset(id: string) {
  const row = db.prepare("SELECT url FROM media_assets WHERE id = ?").get(id) as { url: string } | undefined;
  db.prepare("DELETE FROM media_assets WHERE id = ?").run(id);
  return row?.url ?? null;
}

export function reorderMediaAssets(ids: string[]) {
  const update = db.prepare("UPDATE media_assets SET sort_order = ? WHERE id = ?");
  ids.forEach((id, index) => update.run(index, id));
}

export function getMediaByIds(ids: string[]): MediaAsset[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db.prepare(`SELECT id, url, name, category, alt, sort_order as sortOrder, created_at as createdAt FROM media_assets WHERE id IN (${placeholders})`).all(...ids) as MediaAsset[];
  return ids.map((id) => rows.find((row) => row.id === id)).filter(Boolean) as MediaAsset[];
}

export function listPackageTemplates(): PackageTemplate[] {
  const rows = db.prepare("SELECT data, usage_count as usageCount FROM package_templates ORDER BY updated_at DESC").all() as Array<{ data: string; usageCount: number }>;
  return rows.map((row) => ({ ...JSON.parse(row.data), usageCount: row.usageCount }));
}

export function savePackageTemplate(template: PackageTemplate) {
  db.prepare(`INSERT INTO package_templates (id, name, data, usage_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data, updated_at = excluded.updated_at`)
    .run(template.id, template.name, JSON.stringify(template), template.usageCount, template.createdAt, template.updatedAt);
  return template;
}

export function incrementPackageUsage(id?: string) {
  if (!id) return;
  db.prepare("UPDATE package_templates SET usage_count = usage_count + 1 WHERE id = ?").run(id);
}

export function saveProposal(record: {
  id: string;
  clientName: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  venue: string;
  whatsappNumber: string;
  pdfUrl: string;
  packageTemplateId?: string;
  payload: unknown;
}) {
  db.prepare(`INSERT INTO proposals (id, client_name, bride_name, groom_name, wedding_date, venue, whatsapp_number, pdf_url, package_template_id, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(record.id, record.clientName, record.brideName, record.groomName, record.weddingDate, record.venue, record.whatsappNumber, record.pdfUrl, record.packageTemplateId ?? "", JSON.stringify(record.payload), new Date().toISOString());
}

export function getDashboardStats(): DashboardStats {
  const total = db.prepare("SELECT COUNT(*) AS count FROM proposals").get() as { count: number };
  const mostUsed = db.prepare("SELECT name FROM package_templates ORDER BY usage_count DESC, updated_at DESC LIMIT 1").get() as { name: string } | undefined;
  const recentProposals = db.prepare("SELECT id, client_name as clientName, bride_name as brideName, groom_name as groomName, pdf_url as pdfUrl, created_at as createdAt FROM proposals ORDER BY created_at DESC LIMIT 5").all() as DashboardStats["recentProposals"];
  const recentClients = db.prepare("SELECT client_name as clientName, whatsapp_number as whatsappNumber, MAX(created_at) as createdAt FROM proposals GROUP BY client_name, whatsapp_number ORDER BY createdAt DESC LIMIT 5").all() as DashboardStats["recentClients"];
  return { totalProposals: total.count, mostUsedPackage: mostUsed?.name ?? "No package yet", recentProposals, recentClients };
}
