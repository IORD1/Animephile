# Architecture

> **April 2026 — Inkwell redesign (R1–R5).** The UI now follows the
> manga-editorial "Inkwell" system: paper background, ink black, vermilion
> accent, Anton/Inter Tight/Noto Serif JP/JetBrains Mono fonts, halftone +
> stripe + stamp atoms. The directory layout and route map below have
> changed — see `plan/redesign.md` for the redesign plan and the
> "Post-redesign tree" section toward the end of this file.

## Stack

- **Framework:** Next.js `13.5.11` (stable, Pages Router) with React 18.2.0.
- **Auth:** Firebase JS SDK ~9.23. **Firebase Auth (Google provider)**. RTDB
  is no longer used — only the auth subpath remains.
- **Database:** **MongoDB Atlas**. Five collections (`users`,
  `subscriptions`, `animes`, `jikanCache`, `notifications`) with JSON
  Schema validators applied. See `plan/data-model.md` for the schema.
- **Anime data source:** Public **Jikan API v4**, wrapped in `src/lib/jikan.js`.
- **Email:** `nodemailer` 6.9.x hitting Gmail SMTP, credentials in `SMTP_USER`/`SMTP_PASS`.
- **Styling:** SCSS modules + plain CSS modules under `src/styles/`.
- **Linting:** `eslint-config-next` only — no custom rules.

## Hosting

- **Primary:** Vercel (per README). `package.json` scripts are stock Next.js
  (`next dev` / `next build` / `next start`).
- **Configured but unused:** Firebase Hosting in `asia-east1` — `firebase.json`
  has a `hosting` block and `frameworksBackend.region` set, but deployment
  goes to Vercel.
- **Firebase project ID:** `animephile-a28c7` (`.firebaserc`). RTDB lives in
  `asia-southeast1`.

## Directory layout (post phase-1 refactor)

```
src/
├── lib/                      ← infrastructure modules (added in phase 1)
│   ├── firebase.js           ← Firebase singleton (initializeApp, auth, db, googleProvider)
│   ├── mongo.js              ← MongoClient connection helper (defined; unused until phase 2)
│   ├── jikan.js              ← Jikan API wrapper: getTopAnime, getTodaySchedule, getManga
│   ├── AuthContext.js        ← AuthProvider + useAuth() — wraps the app
│   ├── useSubscriptions.js   ← follow(title) hook, dedupe-aware
│   └── notifications.js      ← notifyTodaysSubscribers() — used by admin button
├── components/               ← (moved out of pages/ — were leaking as routes)
│   ├── check.js              ← admin-only "Check Updates" button
│   ├── loginpage.js          ← Google OAuth landing
│   ├── Navbar.jsx            ← header + logout
│   ├── Recent.js             ← top anime carousel
│   ├── Airingtoday.js        ← today's schedule
│   ├── News.jsx              ← manga feed
│   ├── Recentcard.jsx
│   ├── AiringCard.js
│   ├── Newscard.jsx
│   ├── applogo.js
│   └── assets/               ← images & SVG (was misspelled "assests/")
├── pages/
│   ├── index.js              ← ~30 lines; render-only, gates on useAuth()
│   ├── _app.js               ← wraps with <AuthProvider>
│   ├── _document.js          ← stock HTML document
│   └── api/
│       └── sendEmail.js      ← POST /api/sendEmail — Nodemailer (env-driven)
└── styles/
    ├── globals.css
    ├── Home.module.scss
    ├── Checkbutton.module.css
    ├── Loginstyle.module.css
    └── RecentCard.module.scss

public/                       ← favicon, logo, news.png, profile.jpg, etc.
database.rules.json           ← RTDB security rules (overly permissive)
firebase.json                 ← Firebase hosting + DB rules wiring
.firebaserc                   ← project: animephile-a28c7
next.config.js                ← reactStrictMode: true (only)
jsconfig.json                 ← @/* → ./src/*
.eslintrc.json                ← extends next/core-web-vitals
```

## Route map

| Route | File | Purpose |
|---|---|---|
| `/` | `src/pages/index.js` | Single-page app — gates on auth state, renders different trees for admin vs regular users. |
| `POST /api/sendEmail` | `src/pages/api/sendEmail.js` | Nodemailer endpoint. Body: `{ recipientEmail, subject }`. Note: no body content sent. |
| `GET /api/getSearch` | `src/pages/api/getSearch.js` | **Dead code.** Hardcoded "naruto" search via `@mateoaranda/jikanjs`. Not referenced. |
| `GET /api/hello` | `src/pages/api/hello.js` | Stock Next.js example. |

There is no separate `/admin`, `/following`, or `/anime/[id]` route. A
commented-out `/following` link in `Navbar.jsx` suggests an abandoned
"my subscriptions" page.

## Config files (verbatim or near-verbatim)

`next.config.js`:
```js
const nextConfig = { reactStrictMode: true }
module.exports = nextConfig
```

`firebase.json`:
```json
{
  "database": { "rules": "database.rules.json" },
  "hosting": {
    "source": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "frameworksBackend": { "region": "asia-east1" }
  }
}
```

`database.rules.json` — **overly permissive**:
```json
{ "rules": { ".read": "auth != null", ".write": "auth != null" } }
```
Any authenticated user can read or overwrite any path, including other users'
subscriptions. See [data-model.md](./data-model.md) for the implications.

`.firebaserc`:
```json
{ "projects": { "default": "animephile-a28c7" } }
```

`jsconfig.json` — sets `@/*` path alias to `./src/*`.

## Environment & secrets

There is **no `.env`, `.env.local`, or `.env.example`**. All credentials are
hardcoded in source:

- Firebase web config — `src/pages/index.js:21-29`. Public-by-design for
  client SDK use, but the API key is unrestricted in Firebase Console.
- **Gmail SMTP app password** — `src/pages/api/sendEmail.js:7`. This is a
  committed secret. Rotate it.
- **Admin allow-list** — three Gmail addresses literal-coded at
  `src/pages/index.js:50` and `:83` (duplicated).

## Post-redesign tree (R1–R5)

```
src/
├── lib/
│   ├── firebase.js
│   ├── mongo.js
│   ├── jikan.js                ← + getAnimeEpisodesById, getAnimeCharactersById
│   ├── jikan-cache.js
│   ├── AuthContext.js
│   ├── useSubscriptions.js
│   ├── useNavCounts.js         ← NEW: subs + unread counts for TopNav badges
│   ├── notifications.js
│   ├── email.js
│   ├── email-templates.js
│   ├── anime-utils.js          ← + getPosterUrl
│   ├── anime-time.js           ← NEW: nextBroadcast, diffParts, pad2 (countdown)
│   └── db/collections.js       ← + getAnimeEpisodes, getAnimeCharacters
├── components/
│   ├── loginpage.js            ← Inkwell login (manga collage)
│   ├── ui/                     ← NEW: design-system atoms
│   │   ├── Logo.jsx
│   │   ├── Avatar.jsx          ← + initialsFrom helper
│   │   ├── SearchBar.jsx       ← form, routes to /search
│   │   ├── SectionHeader.jsx
│   │   ├── Bubble.jsx
│   │   ├── Stamp.jsx
│   │   ├── PosterPlaceholder.jsx
│   │   └── TopNav.jsx          ← replaces old Navbar; nav with active state + counts
│   └── home/                   ← NEW: composed home sections
│       ├── Hero.jsx            ← greeting + bubble + 3-card featured strip
│       ├── TopRated.jsx
│       ├── BuzzToday.jsx       ← repurposed as latest manga (no news API)
│       └── HomeFooter.jsx
├── pages/
│   ├── index.js                ← composes Hero/TopRated/BuzzToday/Footer
│   ├── following.js            ← redirects → /profile
│   ├── profile.js              ← merged: subs table + prefs + danger zone + admin section
│   ├── inbox.js                ← NEW: notifications list + email preview
│   ├── search.js               ← NEW: text search + facet sidebar
│   ├── _app.js, _document.js   ← _document loads Google Fonts
│   └── api/
│       ├── anime/[malId].js
│       ├── anime/[malId]/episodes.js     ← NEW (24h TTL cache)
│       ├── anime/[malId]/characters.js   ← NEW (forever cache)
│       ├── browse/[type].js
│       ├── cron/notify.js                ← + writes type, animeTitle, bodyHtml, readAt
│       ├── notifications/index.js        ← NEW: list / countOnly
│       ├── notifications/[id].js         ← NEW: PATCH read state
│       ├── notifications/mark-all-read.js ← NEW
│       ├── search.js                     ← NEW
│       ├── sendEmail.js
│       ├── subscriptions/{index,[malId]}.js
│       └── users/me.js                   ← + notifyFinales, quietHours prefs
└── styles/
    └── globals.css             ← Inkwell variables + utility classes (single file)
```

Old per-page SCSS modules (`Home`, `Loginstyle`, `RecentCard`, `Following`,
`Profile`, `AnimeDetail`, `Checkbutton`) and the carousel components
(`Recent`, `Airingtoday`, `News`, `*card`, `applogo`, `check`, old `Navbar`)
were deleted in R5. `src/components/assets/` was deleted.

## New collections (R3, R4)

- `animeEpisodes` — `{ malId, episodes[], cachedAt }`. 24h TTL. Powers the
  detail page episode list.
- `animeCharacters` — `{ malId, characters[], cachedAt }`. Cached forever.
  Powers the detail page cast strip.

## Schema additions

- `users.preferences` gained `notifyFinales: bool` and
  `quietHours: { enabled, start, end }`. Backfilled on next login.
- `notifications` gained `type`, `animeTitle`, `bodyHtml`, `bodyText`,
  `readAt`. Old rows missing these fields are treated as
  `type='episode'` and unread. Cron now writes them on every send.
- `animes` text index expanded to `title + titleEnglish + titleJapanese +
  synopsis` with weights. Powers `/api/search`. Re-run `npm run db:setup`
  to apply. If a narrower text index already exists with the same name,
  drop it first (`db.animes.dropIndex('title_text')`) before re-running.
