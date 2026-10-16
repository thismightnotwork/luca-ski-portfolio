# Live GBSki Worker

This Cloudflare Worker fetches Luca’s GBSki biography page server-side, extracts race rows, and returns JSON for the portfolio.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

After deployment, Wrangler prints a URL such as:

```text
https://luca-gbski-proxy.<your-subdomain>.workers.dev
```

Test it:

```text
https://luca-gbski-proxy.<your-subdomain>.workers.dev/api/gbski
```

Then open `data.js` and set:

```js
gbskiApi: "https://luca-gbski-proxy.<your-subdomain>.workers.dev/api/gbski"
```

The portfolio will use this live feed. If the Worker is unavailable, it falls back to the static results in `RACE_RESULTS`.

## Force a refresh

```text
/api/gbski?refresh=1
```

The normal response is cached for 10 minutes.
