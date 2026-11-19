# TRACE - Netipattu Rahil's portfolio

The site is a single request trace (`GET /rahil`). Each section is a span, and the right-hand rail is a Jaeger-style waterfall of the page itself.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # chunker, ledger and terminal-parser unit tests
npm run build    # type-check + production bundle in dist/
```
Deploy: `vercel.json` rewrites every route to `index.html`, so `/systems/<slug>` deep links work.

## Where things live
- `src/data/profile.ts` - **the only place content lives**. Edit facts, links, projects and skills here.
- `src/components/` - service card, span rail, hero + system map, experience timeline, systems list, stack resolver, record, contact, cursor.
- `src/systems/<Project>/` - each case study's interactive model:
  - `BlobCloud/chunker.ts` - FastCDC-style gear-hash chunking + AIMD controller (runs in a Web Worker)
  - `PayCore/ledger.ts` - idempotent double-entry ledger → outbox → relay → ordered projection + DLQ
  - `ShopLon/`, `Ada/`, `LibraryMS/` - stream lifecycle, research graph, pattern map
- `src/terminal/` - the command parser (`parser.ts`) and the terminal UI. Open it with `` ` `` or Ctrl/⌘+K.
- `src/styles/tokens.css` - palette (ink/bone major, signal-orange minor, mint/amber state accents) and type scale.

## To update
- ShopLon and the Library Management System link to the GitHub profile. Put their repo URLs in `profile.ts` (`github:`).
- The resume download serves `public/Netipattu_Rahil_Resume.pdf`. Replace that file to update it.
