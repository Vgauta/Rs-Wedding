# RS Weddings Proposal Studio

A premium mobile-first Wedding Proposal Management System for creating luxury proposal PDFs and sharing them instantly via WhatsApp.

## Features

- Mobile-first PWA with offline shell caching and installable manifest.
- Luxury RS Weddings branding with emerald, ivory, and gold editorial styling.
- Proposal form for client details, cover image, gallery images, services, delivery items, and optional addons.
- Unlimited dynamic repeaters for service blocks, service bullet points, delivery details, and addons.
- Admin settings for logo, brand colors, editable static content, terms, WhatsApp template, and footer.
- SQLite-backed settings and proposal records using Node's built-in SQLite module.
- Local file storage for uploaded images and generated proposal files.
- Puppeteer-powered A4 PDF generation from an editorial HTML layout.
- WhatsApp sharing URL with a pre-filled client message and public PDF link.
- Local device draft saving via `localStorage`.

## Quick Start

```bash
npm install
npm run dev
```

Puppeteer downloads a compatible browser during a normal install. If your deployment sets `PUPPETEER_SKIP_DOWNLOAD=true`, install a system Chromium browser and configure Puppeteer accordingly before generating PDFs.

Open <http://localhost:3000> on a mobile device or browser emulator.

## Production Build

```bash
npm run build
npm run start
```

Generated data is stored locally:

- SQLite database: `data/rs-weddings.sqlite`
- Uploads: `public/uploads`
- Generated PDFs and HTML previews: `public/proposals`

## WhatsApp Link Requirements

The PDF link inserted into WhatsApp is based on the current request origin. For client delivery outside your local network, host the app on a reachable domain or expose the local host through a secure tunnel.

## MySQL Upgrade Path

All persistence is isolated in `lib/db.ts`. To upgrade from SQLite to MySQL, replace the functions in that file (`getSettings`, `saveSettings`, and `saveProposal`) with a MySQL client implementation while keeping the same return shapes.

## Phase 2 Premium Tools

- Media Library: upload multiple reusable images, categorize them, search/filter, drag-sort, delete, preview, and select images for proposals.
- PDF Template System: choose Luxury Editorial, Magazine Style, Minimal Elegant, or Premium Dark Theme before generation.
- Cover + Gallery Engines: choose smart cover styles and adaptive gallery layouts with 1, 2, 4, 6, or 8-image showcase sections.
- Service Upgrades: services now support descriptions, icons, featured styling, and premium badges.
- Client Experience Section: optional personalized story block with couple details, venue, date, and custom welcome message.
- Save as Template: save packages such as Royal, Destination, Premium, or Standard packages and reuse them to autofill proposals.
- Sharing Suite: after generation, use WhatsApp, Telegram, Email, Copy Link, Download PDF, or native Share actions.
- Studio Dashboard: view total proposals, most-used package, recent proposals, recent clients, and quick-create access.


## Documentation

- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Installation Guide](docs/INSTALLATION.md)
- [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)
- [Production Readiness Report](docs/PRODUCTION_READINESS.md)
