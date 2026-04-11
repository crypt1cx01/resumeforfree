# Resume For Free

Source code for **[resumeforfree.com](https://resumeforfree.com)** — a resume builder that doesn't want your email, your money, or your data.

No accounts required. No watermarks. No "upgrade to Pro to download as PDF." No ads. No tracking. You open the site, build a resume, and it's yours.

---

## Why this exists

Every "free" resume builder has the same trick: you spend 30 minutes laying out your CV, hit download, and suddenly the real price appears — a $3 trial that bills $24/month, a compulsory email signup, a huge watermark across your PDF, or an "export" that's actually a low-res screenshot. The alternatives are desktop apps you have to install or LaTeX templates with a learning curve.

This project is the thing I wanted to exist: a resume builder that loads in a browser, runs entirely on your machine, and lets you download a real PDF without asking for anything in return.

It's free because there's nothing to pay for. The PDFs are generated locally in your browser using [Typst](https://typst.app) compiled to WebAssembly — there's no server rendering documents on a cost-per-compile basis. Hosting the static site is cheap. So the honest answer to "what's the catch?" is: there isn't one.

---

## What makes it different

**Your data never leaves your device by default.** Everything is stored in `localStorage`. If you want to sync across devices, you can create an account — but that's opt-in and only used for sync. Never for analytics, never for marketing, never sold.

**PDFs are generated in your browser, not on a server.** Typst.ts (the WASM build of the Typst typesetting engine) runs client-side. This means:
- No queue, no rate limits, no "compiling..." spinner for 8 seconds
- The output is a real, properly-typeset PDF with selectable text and embedded fonts
- You can generate unlimited resumes without us paying for compute — which is why it stays free

**It works offline.** Once you've loaded the site once, the PWA service worker caches everything. You can build and export resumes on a plane, in a tunnel, or on a bad hotel Wi-Fi.

**Arabic and RTL are first-class.** Most resume builders treat right-to-left languages as an afterthought. This one uses Noto Naskh Arabic, flips the layout properly, and overrides direction for phone numbers and email addresses so they render correctly inside an RTL document.

**Unlimited resumes, unlimited downloads.** No "3 free downloads" counter. No "upgrade to save more than one resume" popup. Create fifty resumes if you want.

---

## Features

- Multiple templates with live preview
- Drag-and-reorder sections
- Import/export resume data as JSON (so you own your data, literally)
- Optional cloud sync (JWT auth, Cloudflare D1 database)
- English and Arabic UI with full RTL support
- Offline-capable PWA
- Keyboard-friendly
- No tracking, no analytics cookies, no third-party scripts beyond Cloudflare Turnstile (used only on auth/contact forms to block bots)

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Nuxt 4 (Vue 3) | SSR-capable, good DX, Cloudflare Workers target |
| PDF engine | [Typst.ts](https://github.com/Myriad-Dreamin/typst.ts) | Runs in the browser, output quality is better than pdfmake/jsPDF, faster than headless Chromium |
| UI | [shadcn-vue](https://www.shadcn-vue.com) + Tailwind CSS v4 | Copy-paste components, no black-box dependency |
| State | Pinia with `pinia-plugin-persistedstate` | Automatic `localStorage` sync |
| i18n | `@nuxtjs/i18n` | EN/AR with lazy-loaded translation files |
| Hosting | Cloudflare Workers | Global edge, generous free tier, D1 for the sync database |
| Auth | `@tsndr/cloudflare-worker-jwt` + bcryptjs | Lightweight JWT for the optional sync account |
| Captcha | Cloudflare Turnstile | Privacy-friendlier alternative to reCAPTCHA |

Typst was the interesting pick. Most web resume builders either use a layout library like `pdfmake` (which produces stiff, table-like PDFs) or render HTML to PDF via headless Chromium (expensive, slow, and layout quality depends on CSS-to-print quirks). Typst is a modern typesetting system — think LaTeX's output quality without LaTeX's ergonomics — and its WASM build means the whole compiler ships to the browser. The templates in `app/templates/` are Typst markup generated from the user's resume data.

---

## Local development

```bash
git clone https://github.com/imkonsowa/resume-builder.git
cd resume-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: cloud sync database

Cloud sync is optional. If you want to run the full stack locally with the auth/sync features:

```bash
make local-db       # Apply D1 migrations to ./dev.db
npm run dev
```

The app degrades gracefully — if the D1 binding isn't available, the sync-related API routes just return errors and the frontend falls back to pure local storage.

### Running tests

```bash
npm run test:unit   # Vitest unit tests (template parsing, utilities)
npm run test:e2e    # Playwright E2E tests (real Typst WASM compilation)
```

The E2E tests are the important ones — they catch cases where special characters in user input break Typst compilation (escaping issues are the single biggest source of bugs in this codebase).

### Deployment

```bash
npm run deploy            # Production → resumeforfree.com
npm run deploy:staging    # Staging environment
```

Both commands build and deploy to Cloudflare Workers via Wrangler. You'll need your own `wrangler.toml` bindings if you're forking.

---

## Architecture notes

**Templates are Typst generators, not Vue components.** Each template in `app/templates/` exports a `parse(resumeData, font, locale, t)` function that returns a Typst source string. That string gets compiled to SVG (for the live preview) or PDF (for download) by `window.$typst` — the Typst WASM compiler loaded lazily on the client.

**Never call composables inside template parse functions.** This was a hard-learned rule. `useI18n()`, `useRoute()`, etc. must be called at the top of `<script setup>` and passed down. Templates use a `RendererContext` dependency injection pattern (`app/utils/rendererContext.ts`) to receive the translation function without violating Vue's Composition API rules.

**Client-only boundary is strict.** Typst.ts is excluded from Vite's `optimizeDeps` and all code paths that touch `window.$typst` are gated behind `import.meta.client`. The server has no idea Typst exists.

**i18n uses `prefix_except_default`.** English lives at `/`, Arabic lives at `/ar/*`. This gives Google proper hreflang signals instead of making it guess between two locales sharing a URL.

**RTL is handled with explicit CSS overrides, not logical properties.** Tailwind's directional utilities (`mr-*`, `ml-*`) don't auto-flip in RTL mode, and refactoring 100+ components to `me-*`/`ms-*` was too invasive. Instead, `app/assets/css/app.css` has ~150 lines of `[dir="rtl"]` overrides. Ugly but it works and it's localized to one file.

---

## Contributing

Bug reports, template contributions, and translation improvements are welcome. Please:

1. Open an issue before starting on anything large — a lot of things in this codebase are that way on purpose (see the architecture notes) and I'd rather save you the rework.
2. Run `npm run lint:fix` and the test suite before opening a PR.
3. If you're adding UI copy, add it to both `i18n/locales/en.json` and `i18n/locales/ar.json`. No hardcoded strings.
4. If you're adding a template, include a unit test that runs its `parse()` against the fixtures in `tests/fixtures/resumes.ts`.

New template contributions are especially appreciated. The bar is: it should look good, handle edge cases (missing sections, long names, many jobs), and work in both LTR and RTL.

---

## License

MIT. Do what you want with it. If you fork it and put it online, I'd appreciate a link back but it's not a requirement.

---

## Links

- **Live site**: [resumeforfree.com](https://resumeforfree.com)
- **Issues**: [GitHub Issues](https://github.com/imkonsowa/resume-builder/issues)
- **Typst**: [typst.app](https://typst.app) — the typesetting system that makes this possible
