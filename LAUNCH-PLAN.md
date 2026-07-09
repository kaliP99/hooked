# Hooked — Launch & Monetization Plan
*Deep analysis, 2026-07-07. Read the Legal section first: it decides everything else.*

---

## 1. Legal reality check (researched, not guessed)

### Can you use the free iTunes API for this app?
**Yes for discovery + promotion. No for an ads-monetized entertainment product.** The exact terms:

| Apple's rule (iTunes Search API) | What it means for Hooked |
|---|---|
| Previews may be used **"only to promote store content and not for entertainment purposes"** | The app must be framed and function as *music discovery that sends people to Apple Music*, not as a replacement listening experience |
| Attribution **"provided courtesy of iTunes"** + an Apple-approved **badge adjacent to the preview** linking to the store | ✅ Implemented: every card now shows "Preview courtesy of Apple Music" + a store link |
| Previews **streamed only** — never downloaded, cached, or saved | ✅ Already compliant (we never store audio) |
| ~20 calls/min rate limit | See §4 — our client-side architecture sidesteps this at scale |

### Can you put ads on it?
**Not while the audio is Apple previews.** Two separate Apple rules block it:
1. The Search API terms above (ads make the "promotional use" claim indefensible — the previews become the ad-monetized entertainment).
2. Apple's MusicKit/Apple Music API guidelines are explicit: apps **may not monetize access to Apple Music content through advertising** — such apps get rejected.

Running AdSense on top of Apple previews risks: API access cut, ad account ban, and a takedown letter. Don't.

### The alternatives, checked:
- **Spotify** — removed 30s preview URLs for all new API apps (Nov 2024). Dead end.
- **Deezer** — free API is **non-commercial only**; commercial use requires a negotiated partnership.
- **YouTube embeds** — the only "free" source where a page *can* carry its own ads (YouTube plays its own ads inside the player; yours must not overlay or interfere with it). Costs: ~100 searches/day API quota, must show the video player, heavy UX.
- **Licensed B2B catalog (7digital, SoundExchange-cleared providers)** — previews explicitly licensed for commercial apps. This is what real discovery products use. Costs real money (typically $500+/mo + per-stream).

### Verdict
> **The legal way to monetize Hooked *as built* is Apple's own affiliate program, not display ads.**

**Apple Services Performance Partners** pays **100% of the first month** of every Apple Music membership you refer (+ ~7% on movies/books referrals). Hooked is *exactly* what this program exists for: it demos songs and pushes "listen on Apple Music." This flips the legal problem into the business model — the more promotional the app is, the more compliant *and* the more paid you are. Caveat: Apple accepts a limited number of partners; you apply with a working product and traffic.

---

## 2. Monetization paths, ranked

| Path | Legal? | Effort | Revenue shape |
|---|---|---|---|
| **A. Apple affiliate (recommended start)** | ✅ Clean | Low — apply, add affiliate tokens to existing links | 100% of first month per Apple Music signup; scales with users |
| **B. Premium tier** (unlimited playlists, taste insights, profile sync) | ✅ You're charging for *your* features, not Apple's content — keep free previews un-gated | Medium — needs accounts + Stripe | $1–3/mo subscriptions |
| **C. Display ads** | ❌ with Apple previews. ✅ only after switching audio to YouTube embeds or a licensed catalog | High (content-source migration) | AdSense RPM for music/entertainment: roughly $1–4 per 1,000 views — needs big traffic to matter |
| **D. Licensed catalog + ads/subs** | ✅ | Highest (contracts + cost) | The "real startup" path |

**Recommended sequence: A now → B when accounts land → revisit C/D only if traffic justifies it.**
The ad framework is already built into the app (`ADS.enabled=false`, reels-style ad cards every 7 songs + desktop side rails) so if you ever switch content sources, monetization is a config flip, not a rebuild.

---

## 3. Accounts & backend (Phase 2)

**Stack: Supabase** (free tier: 50k monthly active users, Postgres, auth, row-level security). One `profiles` table replaces localStorage:

```
profiles: id (auth uid) | genres jsonb | artists jsonb | interactions int | settings jsonb
liked:    user_id | track_id | track jsonb | created_at
playlists: id | user_id | name
playlist_tracks: playlist_id | track_id | track jsonb
follows:  user_id | artist_name
plays:    user_id | track_id | signal | created_at        ← feeds the recommender
```

- Login: magic-link email + Google OAuth (Supabase built-ins, no password handling).
- Existing localStorage profile imports on first login (the Export/Merge code already handles the format).
- App stays a static site — Supabase is called directly from the browser with RLS enforcing per-user access. **No server to run.**

**What I need from you to build it:** create a free Supabase project (supabase.com) and give me the project URL + anon key. It's ~a day of work from there.

## 4. The rate-limit question — good news

You suggested "a separate API for each user" — **that's accidentally already how it works.** The iTunes API has no keys; its ~20/min limit is per **IP address**. Every user's *own browser* calls Apple directly, so every user gets their own allowance. A central backend proxy would actually *create* the scaling problem by funneling everyone through one IP. Combined with the 10-minute seed cache we added, one user physically can't exceed the limit. **This part needs no work at any scale.** (If Apple ever tightens it: the Apple Music API with a $99/yr developer token has app-level limits designed for production scale.)

## 5. Collaborative filtering — "people like you" (Phase 3, needs Phase 2)

With the `plays`/`liked` tables populated, the simplest thing that works:

1. **Item-item co-occurrence**: nightly SQL job computes "tracks most often liked by people who liked X" (a materialized view — ~20 lines of SQL, no ML infra).
2. Feed blend becomes: 45% your taste (current engine) / 30% co-occurrence neighbors of your recent likes / 25% exploration.
3. Cold start: the current client-side engine already handles new users — nothing to change.
4. Later upgrades: user-user similarity on genre vectors, then a real embedding model if you hit ~10k+ users.

The current keyword engine stays as the fallback and the cold-start layer — nothing gets thrown away.

## 6. Pre-launch compliance checklist (do these regardless of path)

- [x] "Preview courtesy of Apple Music" attribution on every card *(done)*
- [x] Store link adjacent to the preview *(done — the Apple Music button)*
- [x] Never cache/download audio *(already true)*
- [ ] Swap plain Apple links for **Apple Music badges + affiliate token** after Performance Partners approval
- [ ] Privacy policy page (one paragraph — honest: "all data stays on your device" today; update when accounts land)
- [ ] Terms of use page (limitation of liability, DMCA contact)
- [ ] PNG apple-touch-icon for iOS install
- [ ] Host on HTTPS with a real domain (needed for PWA, share links, affiliate application credibility)

## 7. Phased roadmap

| Phase | What ships | Cost | Blocked on |
|---|---|---|---|
| **1. Public launch** (this week) | Host on Cloudflare Pages/Netlify (free) + domain (~$12/yr), privacy/terms pages, PNG icon, apply to Apple Performance Partners | ~$12 | You: buy domain, submit affiliate application |
| **2. Accounts** | Supabase auth + profile sync, cross-device | $0 (free tier) | You: create Supabase project |
| **3. Social recommender** | plays table + co-occurrence view + feed blend; "friends' favorites" | $0 until ~50k MAU | Phase 2 |
| **4. Premium** | Stripe, $1–3/mo: unlimited playlists, taste insights, export | Stripe fees only | Phase 2 + traction |
| **5. Ads / licensed audio** | Only if traffic makes it worth it — YouTube-embed mode or 7digital licensing, then flip `ADS.enabled` | $500+/mo (licensed) | Real usage data |

---

*Bottom line: publish Phase 1 now — it's legal as a promotional discovery app with the attribution that's already in place. Monetize through Apple's affiliate program first. Ads become an option only if you change where the audio comes from; the ad slots are built and waiting either way.*
