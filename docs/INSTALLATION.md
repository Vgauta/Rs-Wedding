# Installation Guide

## Prerequisites

- Node.js `>=24.0.0`.
- npm `>=10.0.0`.
- Network access to the npm registry during installation.
- A Chromium-compatible browser for Puppeteer. A normal Puppeteer install downloads one automatically unless `PUPPETEER_SKIP_DOWNLOAD=true` is set.

## Install dependencies

```bash
npm install
```

If your environment blocks the npm registry, installation cannot complete. Restore registry access or configure an approved internal npm mirror, then rerun the command.

## Puppeteer browser setup

Default install:

```bash
npm install
```

System Chromium install mode:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

When using system Chromium, configure the runtime environment so Puppeteer can locate the browser. The current app uses Puppeteer's default launcher, so the simplest production path is to allow Puppeteer to download its managed browser during deployment.

## Verify installation

```bash
npm run typecheck
npm run build
```
