# Project Structure Documentation

## Root files

- `package.json` — Next.js scripts, pinned dependency ranges, and Node/npm engine requirements.
- `next.config.ts` — Next.js configuration; keeps Puppeteer external to the server bundle.
- `tsconfig.json` — strict TypeScript configuration with `@/*` path aliases.
- `tailwind.config.ts` and `postcss.config.mjs` — Tailwind CSS 3 and PostCSS setup.
- `.gitignore` — excludes build output, dependencies, generated PDFs, uploads, local SQLite data, and local environment files.

## Application routes

- `app/layout.tsx` — global metadata, PWA manifest metadata, viewport settings, and Google font wiring.
- `app/page.tsx` — primary mobile-first proposal studio UI: dashboard launcher, media library modal, admin settings modal, proposal form, package templates, dynamic repeaters, and sharing actions.
- `app/globals.css` — global Tailwind imports, RS Weddings color tokens, dark-mode base styles, and shared utility classes.

## API routes

- `app/api/proposals/route.ts` — validates proposal payloads, saves one-off uploads, resolves reusable media, renders HTML, generates PDFs, stores proposal records, and returns sharing URLs.
- `app/api/media/route.ts` — media library list/search/filter, multi-upload, drag-sort persistence, and delete endpoint.
- `app/api/package-templates/route.ts` — saved package template list/create endpoint.
- `app/api/settings/route.ts` — brand/static-content settings read/update endpoint.
- `app/api/dashboard/route.ts` — proposal count, most-used package, recent proposals, and recent client metrics.

## Library layer

- `lib/types.ts` — shared domain types for media, templates, services, settings, payloads, and dashboard stats.
- `lib/defaults.ts` — starter brand settings, default service/delivery/addon data, and starter package templates.
- `lib/db.ts` — SQLite schema creation, migrations, and persistence helpers.
- `lib/storage.ts` — local public file upload/delete helpers.
- `lib/pdf.ts` — PDF HTML rendering, template/cover/gallery engines, and Puppeteer PDF generation.

## Public assets and generated storage

- `public/brand/rs-logo.svg` — default RS Weddings logo.
- `public/manifest.json` — PWA manifest.
- `public/sw.js` — conservative same-origin offline shell cache.
- `public/uploads/.gitkeep` — placeholder for reusable and one-off uploaded images.
- `public/proposals/.gitkeep` — placeholder for generated proposal PDFs and HTML previews.
- `data/.gitkeep` — placeholder for local SQLite data; runtime database is ignored by git.
