# Local Development Guide

## Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Local data locations

- SQLite database: `data/rs-weddings.sqlite`
- Uploaded images: `public/uploads/`
- Generated PDFs: `public/proposals/*.pdf`
- Generated HTML previews: `public/proposals/*.html`

These generated files are intentionally ignored by git.

## Recommended local workflow

1. Open the app on desktop or mobile viewport.
2. Upload reusable images in the Media Library.
3. Create or select a saved package template.
4. Fill client details.
5. Select PDF template, cover style, gallery layout, and showcase image count.
6. Generate and use the sharing buttons.

## Reset local state

Stop the dev server, then remove generated runtime data:

```bash
rm -f data/rs-weddings.sqlite
rm -f public/uploads/* public/proposals/*
touch public/uploads/.gitkeep public/proposals/.gitkeep
```

Browser-side drafts are stored in `localStorage` under `rs-weddings-draft`.
