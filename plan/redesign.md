# Animephile UI/UX redesign — "Inkwell"

Source of truth: the handoff bundle at `/tmp/animephile-design/test/`.
Read order from the bundle: `chats/chat1.md`, then `project/Animephile Redesign.html` and the imports under `project/` (`styles.css`, `atoms.jsx`, `screens/*.jsx`).

## What the design is

A manga-inspired editorial redesign covering 6 desktop screens. Off-white paper background (`#f4efe6`), deep ink black (`#0e0e0e`), one signature accent — vermilion red (`#d83a2c`). Halftone dot fields, diagonal stripe placeholders, hard ink rules, hanko stamps, and a hard-edged drop shadow (`6px 6px 0 var(--ink)`). Type pairs `Anton` (display) + `Inter Tight` (body) + `Noto Serif JP` (Japanese accents) + `JetBrains Mono` (idx labels).

Screens delivered:

| # | Design screen      | Maps to                                              |
|---|--------------------|------------------------------------------------------|
| 1 | Login              | `src/components/loginpage.js`                         |
| 2 | Home / Discover    | `src/pages/index.js` + section components             |
| 3 | Anime Detail       | `src/pages/anime/[malId].js`                          |
| 4 | Search Results     | NEW: `src/pages/search.js`                            |
| 5 | Profile / My Subs  | MERGE `src/pages/profile.js` + `src/pages/following.js` |
| 6 | Notifications Inbox| NEW: `src/pages/inbox.js`                             |

## Phasing

Treating the redesign as 5 phases. Each ends with a working build. Stop-points marked so we can ship visible progress incrementally instead of one giant PR.

### Phase R1 — Design system foundation (no visible page changes)

- **Fonts**: add `<link>` tags for Anton / Inter Tight / Noto Serif JP / JetBrains Mono in `src/pages/_document.js` (preconnect + stylesheet).
- **Globals**: rewrite `src/styles/globals.css` to define CSS variables (`--paper`, `--paper-2`, `--paper-3`, `--ink`, `--ink-2`, `--muted`, `--vermilion`, `--vermilion-deep`, `--stamp`, `--highlight`) and the **global utility classes** the design uses everywhere: `.ink-root`, `.display`, `.jp`, `.mono`, `.idx`, `.paper-bg`, `.paper-bg-warm`, `.halftone`, `.halftone-fade`, `.halftone-red`, `.stripes`, `.stripes-loose`, `.stripes-red`, `.rule`, `.rule-2`, `.rule-b`, `.rule-t`, `.scan-rule`, `.btn`, `.btn-primary`, `.btn-ghost`, `.chip`, `.chip-ink`, `.chip-red`, `.bubble`, `.stamp`, `.poster`, `.ep-badge`, `.shadow-hard`, `.shadow-hard-sm`, `.rotate-n2`, `.rotate-2`. Lifted ~1:1 from `project/styles.css`.
  - Why globals (not modules): the design's atoms reuse these dozens of times across screens; CSS Modules' name-mangling would force every component to import them. Globals match the design's intent and keep components readable.
- **Atoms** under `src/components/ui/`:
  - `Logo.jsx` — `愛` stamp + ANIMEPHILE display + tagline.
  - `Avatar.jsx` — initials in a vermilion circle with hard ink border.
  - `SearchBar.jsx` — controlled input with magnifier icon + ⌘K hint.
  - `SectionHeader.jsx` — big red `idx` numeral + kicker + title + JP + action.
  - `Bubble.jsx`, `Stamp.jsx`, `Chip.jsx`, `Btn.jsx`, `EpBadge.jsx` — small primitives.
  - `PosterPlaceholder.jsx` — fallback for missing cover art (kept from design; falls back when `imageUrl` is null).
  - `TopNav.jsx` — replaces `src/components/Navbar.jsx`. Items: Discover (`/`), My Subs (`/profile`, count), Inbox (`/inbox`, unread count), Search (`/search`). Right side: SearchBar + Avatar + name + "VIEW PROFILE →".
  - Counts come from `useAuth` + a new tiny `useNavCounts()` hook that fetches `/api/subscriptions` length and `/api/notifications?unread=1` count once and caches in context. Fail-open: render without count if either errors.
- **Replace** `src/components/Navbar.jsx` with a re-export of `TopNav` so existing imports keep working during phased rollout. Delete `Navbar.jsx` outright after all callers are migrated (Phase R5 cleanup).

**Stop-point**: build passes, lint clean, no visible UI change yet beyond the new nav. Commit.

### Phase R2 — Login + Home

- **Login** (`src/components/loginpage.js`):
  - Two-pane manga-collage layout matching `screens/login.jsx`: left pitch column with the giant "NEVER MISS AN EPISODE" Anton headline (vermilion "EPISODE" with the wavy underline SVG), Google sign-in button only (no "Browse as guest"), idx-strip benefits row. Right pane has rotated poster placeholders, a mocked notification card, a speech bubble quote, and an `推し APPROVED` hanko stamp.
- **Home** (`src/pages/index.js` + new section components under `src/components/home/`):
  - **Hero** — `HEY {firstName}, N EPS DROP TODAY` headline. `N` = count of subscriptions whose anime appears in today's `/api/browse/today` payload, computed client-side. Beside it, the speech bubble showing follow count + unread inbox count.
  - **Featured strip** — top 3 airing today crossed with subscriptions (or top 3 from today if user has no subs intersecting today). Card layout from `screens/home.jsx`: 140×200 poster on the left, AIRING TODAY chip + ep badge + title + broadcast time + Following/Trailer buttons.
  - **Top Rated** (idx 02) — featured #1 panel (200×280 poster + score 9.10/10 + synopsis + + FOLLOW button) + ranks 02–05 list rows. Sourced from `/api/browse/top`.
  - **Buzz Today** (idx 03) — design shows news cards (INTERVIEW / TRAILER / OP-ED / NEWS). We don't have a news API. Repurpose the slot as a 4-up of latest top manga from `/api/browse/manga` (we already cache it). Tags become `MANGA · NEW`, `MANGA · ONGOING`, etc. derived from each item's `status`.
  - **Footer** — scan-rule + ANIMEPHILE / 愛フィル + tagline.
  - Drop the existing `<Recent/>` and `<Airingtoday/>` auto-scroll carousels — the new layout is grid-based. Keep `Newscard.jsx` as a reference but unused; delete in R5.

**Stop-point**: home + login look like the design. Commit.

### Phase R3 — Detail page

- `src/pages/anime/[malId].js` rewrite to match `screens/detail.jsx`:
  - Breadcrumb strip (DISCOVER / GENRE / TITLE).
  - Three-column hero: poster (320×460) + title/meta column + countdown panel (right).
  - Title block: 88-px Anton title, JP subtitle in Noto Serif JP, chips (status / studio / eps / rating / language), synopsis paragraph, and the 4-up stats grid (SCORE · RANK · FOLLOWERS · AIRS).
  - **Countdown** to next episode: compute from `broadcast.day` + `broadcast.time` + `broadcast.timezone` (Jikan returns these). Tick once per second client-side. Below countdown: "EPISODE N · title · date · localized time" + bubble "We'll email {email} the moment it drops."
  - **Episodes list** (idx 01) — design shows a 2-column grid with upcoming + 5 aired. Jikan has `/anime/{id}/episodes` (paginated). Add a server endpoint **`GET /api/anime/[malId]/episodes`** that does read-through cache to a new `animeEpisodes` collection (or stores under the existing `animes` doc as `episodes: [...]`, capped at last 24 for sanity). We display the most recent 6.
  - **Cast & staff strip** (idx 02) — Jikan has `/anime/{id}/characters`. Add **`GET /api/anime/[malId]/characters`** with the same read-through pattern; show first 6. If the call fails, hide the section (don't break the page).
- New SCSS: `src/styles/AnimeDetail.module.scss` rewritten. Follow utility classes are global, so the module just owns layout (grid columns, gaps).

**Stop-point**: detail page matches design. Commit.

### Phase R4 — Profile (merged) + Search + Inbox

This phase ships three pages because the data wiring overlaps.

#### R4a — Merge `/profile` and `/following` into one page

The design's "Profile / My Subscriptions" screen is one page. Today these are split. Merge into `src/pages/profile.js`; redirect `/following` → `/profile` via `src/pages/following.js` doing `router.replace('/profile')`.

- Masthead: 160-px vermilion avatar circle (initials, e.g. `PI`) with a `会員` hanko stamp; name in 64-px Anton; JP transliteration + email; chips (joined date, POWER USER if `stats.emailsSent > 100`, subscription count). Right-side stats grid (3×2): FOLLOWED / EMAILS SENT / AIRING NOW / COMPLETED / HIATUS / GENRES, computed client-side from the subscriptions list + user stats.
- Filter / control bar: ALL / AIRING / COMPLETE / HIATUS chips; SORT button; bulk action buttons (PAUSE NOTIFS, UNFOLLOW SELECTED). First pass: filter + sort work; bulk actions stub to `console.warn('TODO')` and we wire them in a follow-up.
- Subscriptions table: 7-column grid matching the design (checkbox, poster, title block, status, next ep, notif chip, actions). Per-row Edit / Remove. Row striping alternates `--paper` / `--paper-2`. Remove → existing `DELETE /api/subscriptions/[malId]`. Edit is a stub (popover later).
- Notification preferences card (left): map design toggles to existing prefs:
  - "Email when a new episode airs" → `!muted`
  - "Send a weekly digest on Sunday" → `digestFrequency === 'weekly'`
  - "Notify me about season finales" → NEW pref `notifyFinales: bool`. Add to `users` schema with default `true`. (Backwards compatible — the existing `$setOnInsert` defaults need updating.)
  - "Quiet hours" → NEW pref `quietHours: { start, end, enabled }`. Add to schema with default `{ enabled: false, start: '22:00', end: '08:00' }`.
- Danger Zone card (right): EXPORT MY DATA, UNFOLLOW EVERYTHING, DELETE ACCOUNT. First pass: only EXPORT works (downloads JSON of subs + user); the others stub with a confirm dialog + `console.warn`.
- **Admin section** (admin-only, gated by `isAdmin`): below the danger zone, render a "ADMIN — TRIGGER NOTIFY" card hosting the existing `check.js` "send today's emails" button. Same behavior as today, just relocated from the home page.
- Old `src/styles/Profile.module.scss` and `src/styles/Following.module.scss` get rewritten or deleted in favor of new module(s).

#### R4b — Inbox (new page)

- New endpoint **`GET /api/notifications?firebaseUid={uid}&type={tab}&unreadOnly={bool}`**: returns the user's notifications joined ($lookup) with `animes` for poster + title. The cron already inserts into the `notifications` collection.
- New endpoint **`PATCH /api/notifications/[id]`** with `{ readAt: Date }` for "mark read"; **`POST /api/notifications/mark-all-read`** for the bulk action. Add `readAt: Date|null` to the `notifications` schema (back-compat: missing field = unread).
- Add `type` field to notification docs the cron writes: `"episode" | "finale" | "digest" | "news"`. Cron currently writes only `"episode"` (single source). Default unknown → `"episode"`.
- New page `src/pages/inbox.js` matching `screens/inbox.jsx`:
  - Hero: `INBOX N NEW`, MARK ALL READ / FILTER / EMAIL SETTINGS buttons.
  - Tabs: ALL / NEW EPISODES / FINALES / WEEKLY DIGEST / PRODUCT NEWS with counts.
  - Two-column body: left = notification list rows (red unread strip, poster, type chip, title, body, when, ep badge); right = email preview pane.
  - Email preview pane: render the **currently selected** notification's saved body as the design preview. Cleanest path: store the email's HTML body alongside the notification record going forward (cron change). For old rows, render a basic preview from stored `subject` + `animeTitle`. Keep this simple — full styled preview is not blocking.

#### R4c — Search (new page)

User said: "we don't search the jikan api, we search what we have list of animes". So search runs against our `animes` collection.

- Add a Mongo text index on `animes`: `{ title: 'text', titleEnglish: 'text', titleJapanese: 'text', synopsis: 'text' }`. Update `scripts/db-setup.mjs` to create it (idempotent).
- New endpoint **`GET /api/search?q=...&genre=&status=&studio=&minScore=`**: text-search the `animes` collection, support the design's facet filters. Returns `{ results, total, took }`. If `q` is empty, return paginated browse by recent/popular.
- New page `src/pages/search.js` matching `screens/search.jsx`: query header + active-filter chips + sidebar facets + result rows with highlighted matches (`<span class="highlight">`).
- **Caveat**: our `animes` cache only holds anime users have actually visited or subscribed to. So search results will be sparse early on. That's fine — it grows as the app is used. Document this in `plan/architecture.md`.

**Stop-point**: all 6 design screens have a working live page. Commit.

### Phase R5 — Cleanup

- Delete now-unused: `src/components/Recent.js`, `Airingtoday.js`, `News.jsx`, `Newscard.jsx`, `Recentcard.jsx`, `AiringCard.js`, `applogo.js`, old `Loginstyle.module.css`, old `RecentCard.module.scss`. `check.js` is **kept** but its only caller is `/profile` Admin section now (not the home page).
- Update `plan/architecture.md` to describe the "Inkwell" system. Update `plan/todo.md` to close redesign items.
- **Out of scope**: email template redesign. Split to a separate design pass later.

**Stop-point**: tree is clean. Commit.

## File map (delta)

```
ADD     src/components/ui/{Logo,Avatar,SearchBar,SectionHeader,Bubble,Stamp,Chip,Btn,EpBadge,PosterPlaceholder,TopNav}.jsx
ADD     src/components/home/{Hero,FeaturedStrip,TopRated,BuzzToday}.jsx
ADD     src/pages/inbox.js
ADD     src/pages/search.js
ADD     src/pages/api/notifications/index.js
ADD     src/pages/api/notifications/[id].js
ADD     src/pages/api/notifications/mark-all-read.js
ADD     src/pages/api/anime/[malId]/episodes.js
ADD     src/pages/api/anime/[malId]/characters.js
ADD     src/pages/api/search.js
ADD     src/lib/useNavCounts.js
ADD     src/styles/(per-page modules; mostly layout-only since utilities are global)

REWRITE src/styles/globals.css                  (Inkwell variables + utilities)
REWRITE src/pages/_document.js                  (Google Fonts <link>)
REWRITE src/pages/index.js                      (new home composition)
REWRITE src/pages/anime/[malId].js              (new detail layout + countdown + episodes/cast)
REWRITE src/pages/profile.js                    (merged profile + subs)
REWRITE src/components/loginpage.js             (new login layout)
REWRITE src/lib/email-templates.js              (Inkwell email)  [R5]

EDIT    src/pages/following.js                  → redirect to /profile
EDIT    scripts/db-setup.mjs                    (text index + new fields + new collections if any)
EDIT    src/pages/api/users/me.js               (new prefs: notifyFinales, quietHours)
EDIT    src/pages/api/cron/notify.js            (write `type` and `bodyHtml` to notifications)

DELETE (R5)  src/components/{Navbar.jsx,Recent.js,Airingtoday.js,News.jsx,Newscard.jsx,Recentcard.jsx,AiringCard.js,applogo.js}
DELETE (R5)  src/styles/{Loginstyle.module.css,RecentCard.module.scss,Following.module.scss}
```

## Confirmed decisions

1. ✅ Merge `/profile` + `/following`. `/following` redirects.
2. ✅ Drop "Browse as guest" button entirely (don't render it).
3. ✅ Buzz Today → repurpose as latest manga.
4. ✅ Add `notifyFinales` + `quietHours` prefs (UI + schema). Cron honoring them is a follow-up.
5. ✅ Search runs over our `animes` cache only.
6. ❌ Email template redesign is **out of scope** — split to a later design pass. R5 cleanup only.
7. ✅ `check.js` admin trigger moves to a "ADMIN" section on `/profile` (admin-only).

## Out of scope (for this redesign)

- Mobile / responsive — design is desktop-only. Will set a min-width and let it scroll horizontally below.
- Tweaks panel / variants — user explicitly skipped.
- Watchlist (separate from subscriptions) — design hints at it on the detail page button. Punted; the button will be hidden.
- Real news/buzz API.
- Actual real cover art — we already use Jikan `imageUrl`; PosterPlaceholder is a fallback for nulls.
