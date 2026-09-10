# Supreme Student Advisory Council — IIUI

A single-page registration website for the **Supreme Student Advisory Council**,
International Islamic University, Islamabad (IIUI).

Everything lives in **`index.html`** — no build step, no dependencies. Open it in
any modern browser or host it as a static site.

## Features

- **Bilingual (English / العربية).** Toggle with the 🌐 button in the navbar; the
  whole interface, including right-to-left layout, switches instantly.
- **Two university seals** shown together in the header.
- **Guided registration flow**, navigated by numbered step circles:
  1. **Choose your faculty** — the eleven faculties of IIUI.
  2. **Select your council** — Male or Female council, shown as portrait cards
     (no gender symbols).
  3. **Student registration** — personal details → academic information → review
     and submit.
- **Success page** confirming the submission.
- **Admin panel** to review, count, and clear submitted registrations.
- Registrations are saved in the browser via `localStorage`, so the site is fully
  functional as a standalone page. If the site is hosted in an environment that
  injects a `window.storage` key/value API, that is used automatically instead.

## Running locally

Just open the file:

```bash
# from the project folder
open index.html        # macOS
# or double-click index.html in your file manager
```

Or serve it (recommended, so localStorage is scoped to a stable origin):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set the source to this branch and the root folder.
3. Your site will be published at `https://<user>.github.io/<repo>/`.

## Admin access

- Open the **Admin** link in the navbar.
- Default password: **`sac2026`** (change it in `index.html` — search for
  `sac2026`).
- The admin panel lists all registrations with totals per council and per
  faculty, and can clear all records.

## Color palette

| Token   | Value     |
|---------|-----------|
| Navy    | `#023047` |
| Teal    | `#219EBC` |
| Sky     | `#8ECAE6` |
| Amber   | `#FFB703` |
| Orange  | `#FB8500` |
| Paper   | `#F5FAFC` |
