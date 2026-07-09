# Hooked

Music discovery, 20 seconds at a time. Static site, zero build step, zero dependencies.
All song previews and metadata courtesy of Apple (iTunes Search API). See `LAUNCH-PLAN.md` for the monetization/legal roadmap.

## Run locally

```
npx serve .
```

(Service worker and PWA install need http://localhost or HTTPS, not file://.)

## Deploy (pick one, both free)

**Cloudflare Pages**
```
npm i -g wrangler
wrangler login
wrangler pages deploy . --project-name hooked
```

**Netlify**
```
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir .
```

Then add your custom domain in the host's dashboard. HTTPS is automatic on both.

## After deploy

1. Verify PWA install works (Chrome: address bar install icon; iOS Safari: Share > Add to Home Screen).
2. Apply to Apple Services Performance Partners (https://performance-partners.apple.com) with the live URL.
3. Once approved, append your affiliate token (`&at=YOURTOKEN`) to the Apple Music links in `deepLinks()` in index.html.

## Files

| File | What |
|---|---|
| `index.html` | The whole app (UI, feed, learning engine, playlists, PWA registration) |
| `sw.js` | Service worker, caches the app shell only |
| `manifest.webmanifest` | PWA manifest |
| `icon.svg`, `icon-180.png`, `icon-512.png` | App icons (`node make-icons.js` regenerates the PNGs) |
| `privacy.html`, `terms.html` | Legal pages, linked from the app |
| `LAUNCH-PLAN.md` | Monetization, legal analysis, backend roadmap |

Self-test: open `index.html#selftest` and check the console.
