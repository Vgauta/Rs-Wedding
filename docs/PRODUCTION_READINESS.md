# Production Readiness Report

## Current status

The application is suitable for local hosting or a small studio deployment after dependency installation and a successful production build. It is intentionally local-first: SQLite stores operational data and the filesystem stores uploaded media and generated proposals.

## Audit findings and fixes applied

- Dependency ranges are pinned by major version instead of using `latest`, and Node/npm engine requirements are declared in `package.json`.
- Proposal generation now validates required client/couple/WhatsApp fields and returns structured API errors for malformed payloads.
- The PWA service worker now avoids caching API responses and generated proposal PDFs, reducing stale dashboard/media/proposal data risks.
- Media deletion now removes both the SQLite row and the uploaded public file.
- Upload handling now rejects unsupported non-image extensions.
- PDF renderer settings are sanitized before being interpolated into CSS, reducing malformed brand setting risk.
- PDF rendering now has safe defaults for older drafts or partial API payloads.
- Local draft restoration now handles corrupted `localStorage` data without crashing the app.

## Known environment limitation during this audit

The current execution environment returns HTTP 403 from `https://registry.npmjs.org/`, so dependencies could not be installed here. Because of that, `npm run typecheck` and `npm run build` cannot be completed in this container until registry access is restored.

## Production checklist

- Run `npm install` with registry access.
- Run `npm run typecheck` and `npm run build`.
- Ensure Puppeteer can launch Chromium in the target host.
- Serve the app over HTTPS so PWA installation, clipboard, and native sharing work reliably.
- Put the app behind authentication before exposing it publicly; this is a staff tool and currently has no auth layer.
- Back up `data/rs-weddings.sqlite`, `public/uploads`, and `public/proposals`.
- For multi-user or high-volume deployments, move uploads/PDFs to object storage and replace SQLite helpers in `lib/db.ts` with MySQL or another managed database.
- Configure a public base URL or tunnel for local hosting if clients need to open PDF links from WhatsApp outside the studio network.

## Risk notes

- SQLite is appropriate for local-first or single-instance deployments, not horizontally scaled multi-instance hosting.
- Generated proposal links are public static files under `public/proposals`; avoid sensitive pricing or add authenticated file delivery if needed.
- WhatsApp cannot attach arbitrary files via URL schemes; the app shares a PDF link inside a prefilled message.
