# Numvero

Numvero is a fast, privacy-friendly calculator hub: basic, scientific, percentage, age, simple interest, compound interest, EMI, ratio and unit conversion.

## Stack
- React + TypeScript
- Vite
- Tailwind-ready frontend with a custom Purple Galaxy design system
- Node.js + Express production server
- No database and no authentication

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Set `PORT` in `.env` if the VPS should listen on a different port. See `.env.example`.

## VPS

1. Install Node.js LTS.
2. Clone the repository.
3. Run `npm ci` (or `npm install` when no lockfile is available).
4. Run `npm run build`.
5. Run `npm start` behind the VPS reverse proxy.
6. Keep the Node process alive with the VPS process manager of your choice and terminate TLS at the reverse proxy.

## SEO and accessibility

The site includes semantic sections, keyboard-friendly controls, responsive layouts, descriptive metadata, canonical metadata, Open Graph metadata, structured data, reduced-motion support and a crawler-friendly sitemap/robots setup.

## Design

Purple Galaxy, modern minimal, sans-serif typography, subtle transitions and responsive desktop-first layouts. There are no ads and no login requirement.
