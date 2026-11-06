# Watchline web

The Next.js presentation layer for Watchline, the video analytics engine.

- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix, Lenis, next-themes.
- **Theme:** light and dark shadcn token themes in `app/globals.css`; the toggle switches directly with no menu.
- **Data:** deterministic sample data only. There is no dashboard route and no backend call from the UI.
- **Design references:** `design/DESIGN.md`, `design/index.html`, `design/logo.svg`, `design/theming.md`.
- **Open Graph:** `public/og-home.png` and `public/og-architecture.png`; editable sources in `design/og/`.

Run from the repository root so the shared engine and server modules resolve:

```bash
npm run dev        # next dev -p 3000, executed in web/
npm run build      # production build
npm run start      # production server
npm run typecheck  # tsc -p web/tsconfig.json
```

The data side stays at the repository root: `engine/`, `server/`, `tests/`,
`docs/diagrams/` and the broker adapters. The API route handlers in
`app/api/analytics/` are the bridge between the two.
