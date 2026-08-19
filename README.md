# Luca Finnis-Bernard — Alpine Skiing Portfolio

Official personal portfolio for **Luca Finnis-Bernard**: Great Britain U18 alpine ski racer,
**BASI Ski UK Level 2** instructor, Hemel Ski Race Club (HSRC) racer, instructor at The Snow
Centre Hemel and Knockhatch Adventure Park, and SnowShepard Pro Team athlete.

Live at **https://lucafinnisbernard.co.uk**.

## Tech stack

Static HTML, CSS and vanilla JavaScript — no build step, no framework, no dependencies to
install. This keeps the site fast, easy to edit, and simple to deploy on GitHub Pages with a
custom domain.

- `index.html` — the single-page site (hero, about, skiing/performance, journey, gallery, contact)
- `about.html` — a secondary editorial about page
- `styles.css` — the full design system and styles
- `data.js` — **all editable content**: race results, season stats, equipment, journey
  timeline, social links, contact form endpoint
- `app.js` — behaviour: preloader, navigation, the slalom scroll animation, reveal
  animations, the gallery/lightbox, form validation
- `photos/` — image folder, auto-discovered by the gallery

## Editing content

Everything factual lives in **`data.js`**. To update race results, season stats, equipment,
timeline entries or social links, edit the arrays at the top of that file — no HTML or CSS
changes required.

### Adding gallery photos

1. Add an image (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` or `.avif`) to the `photos/` folder.
2. Commit and push to `main`.
3. The gallery reads the `photos/` directory through GitHub's public Contents API and
   displays new images automatically. Favicon/manifest files in `photos/` are ignored
   automatically and never shown in the gallery.

Use descriptive filenames (e.g. `tignes-slalom-2026.jpg`) — filenames become part of the alt text.

### Connecting the contact form

The contact form ships in an honest, disconnected state: submitting it explains that direct
sending isn't configured yet and points visitors to social channels instead. To enable real
submissions:

1. Create a form endpoint with [Formspree](https://formspree.io), [Web3Forms](https://web3forms.com)
   or a Cloudflare Worker.
2. Set `SITE_CONFIG.formEndpoint` in `data.js` to that URL.
3. Never commit private API keys — Formspree/Web3Forms endpoint IDs are safe to expose
   client-side by design; a Worker should validate/rate-limit server-side instead.

## The slalom scroll course

A thin SVG rail runs down the left edge of the page. A marker moves along a winding path using
`getPointAtLength()`, mapped to scroll progress, with alternating red/blue gate markers placed
along the course. On mobile the rail narrows and shows fewer gates; a slim progress bar at the
top of the viewport mirrors scroll progress everywhere. The moving marker is disabled under
`prefers-reduced-motion: reduce`, leaving the static course line and gates visible. The
animation never hijacks scrolling — it only reads `window.scrollY`.

## Local development

No install step is required.

```bash
# from the repository root
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deployment (GitHub Pages, custom domain)

Deployment is automated by `.github/workflows/deploy.yml`:

- Runs on every push to `main`.
- Uploads the repository as a Pages artifact (no build step — the site is already static).
- Deploys via `actions/deploy-pages`.

In **Settings → Pages**, the source should be set to **GitHub Actions**. The `CNAME` file
(containing `lucafinnisbernard.co.uk`) keeps the custom domain configured; do not remove it.

## Accessibility

Semantic HTML, visible focus states, a skip-to-content link, keyboard-operable navigation and
lightbox with focus trapping, accessible form labels/errors, and a full `prefers-reduced-motion`
mode that disables the moving marker, parallax and large entrance animations while keeping all
content immediately visible.

## Content accuracy

All race results, season statistics, qualifications and equipment listed on this site are drawn
from Luca's own published record. No results, rankings, sponsors or qualifications are invented.
Journey timeline entries without a specific confirmed date are labelled "Ongoing" or by season
rather than given an invented date.

## Still to confirm

- Exact dates for BASI Level 1 and Level 2 qualification (shown as "Ongoing" milestones for now).
- A contact-form endpoint (see above) — currently disabled by design.
