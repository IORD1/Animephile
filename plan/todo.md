# Animephile Renovation — Goals

Short list of what we're rebuilding and why. Ordered roughly by priority,
with dependencies noted. Detailed context for each item lives in the
sibling docs (`architecture.md`, `cron-and-emails.md`, `data-model.md`,
`gaps-and-issues.md`).

## 🔒 Security (do first — cheap, high impact)

- [ ] **Rotate the leaked Gmail SMTP password** and move it to `process.env.SMTP_PASS`.
      Currently committed in plaintext at `src/pages/api/sendEmail.js:7`.
- [ ] **Lock down `/api/sendEmail`.** Today it's an open relay — no auth,
      no rate limit. Either require a shared-secret header or fold the
      Nodemailer call into the cron route and delete the public endpoint.

## 🗄️ Database migration (foundation for almost everything below)

- [ ] **Migrate off Firebase Realtime Database.** RTDB is overkill and the
      current schema (title-keyed, no timestamps, no profile rows) is a
      dead end. **Recommendation: Postgres** (via Supabase or Neon /
      Vercel Postgres) — relational fits the model and gives free
      full-text search for goal #search. MongoDB Atlas is a fine
      alternative but we'd end up reinventing joins. Decide before
      anything else schema-shaped lands.
- [ ] **Cache Jikan API responses in our DB.** Jikan rate-limits aggressively
      and is slow — caching `/top/anime`, `/schedules/{day}`, `/manga`,
      and per-anime detail removes a hard external dependency from
      every page load. Add a refresh job (daily for top, hourly for
      schedules). *Blocked on: DB migration.*

## 👤 User data model

- [ ] **Persist a real user profile per signup.** Today `displayName` and
      email come live from Firebase Auth and nothing else is stored.
      Schema should include: `created_at` (joined date), saved-anime
      list, `emails_sent_count`, `last_notified_at`, preferences
      (`muted: bool`, `preferred_notification_time`, `digest_frequency`),
      and any other per-user state we need. *Blocked on: DB migration.*
- [ ] **Replace hardcoded admin allow-list with an `admins` table.**
      Currently three Gmail addresses are literal-coded at
      `src/pages/index.js:50` and `:83`. *Blocked on: DB migration.*

## 🔔 Notification pipeline

- [ ] **Real scheduled cron, not a button.** Today only an admin clicking
      "Check Updates" triggers email fan-out. Move the orchestration
      into `pages/api/cron.js` and schedule it via Vercel Cron. Keep
      the admin button as an optional manual override.
- [ ] **Make the cron idempotent.** Track `last_notified_episode_id` per
      subscription so reruns and double-clicks don't re-spam.
      *Blocked on: user-profile schema.*
- [ ] **Switch subscription primary key from title string to Jikan
      `mal_id`.** Title-string equality silently drops users when Jikan
      returns alternate spellings. *Blocked on: DB migration.*
- [ ] **Beautify email content.** Today emails ship with a subject and
      empty body. Need an HTML template (anime art, episode number,
      air time, watch link, unsubscribe link) and a plain-text fallback.

## ✨ Features

- [ ] **"My Subscriptions" page with unfollow.** The inverse-view data
      already exists in `uid/{uid}` but isn't read anywhere; a commented
      `/following` link in `Navbar.jsx` shows this was started.
      Add a list view + an unfollow button.
- [ ] **Better search, backed by our own data.** Don't proxy Jikan — index
      our cached anime catalog and search there. Postgres `tsvector` or
      a dedicated index handles fuzzy/multi-language match cleanly.
      *Blocked on: Jikan caching.*

## 🧹 Code health

- [ ] **Tighten DB security/access rules** once we're off RTDB. Whatever
      DB we land on, scope writes to the row owner. *Blocked on: cron
      moves server-side AND DB migration.*
- [ ] **Refactor `src/pages/index.js`.** 277 lines mixing Firebase init,
      auth state, RTDB writes, and cron orchestration. Split into a
      Firebase singleton, an `AuthProvider`, and a `useSubscriptions`
      hook. Move `onAuthStateChanged` into a `useEffect` (today it's
      registered in render body, leaking listeners).
- [ ] **Clean up dead code, pin a stable Next.js.** Remove
      `pages/api/getSearch.js` (hardcoded "naruto"), `pages/api/hello.js`,
      empty `pages/api/logos/`, unused deps (`emailjs`, `fs`).
      Bump off `13.4.20-canary.2`. Rename misspelled
      `src/pages/components/assests/` → `assets/`. Delete empty
      `plant/` directory at repo root if confirmed as a typo.
- [ ] **Update README** to describe what the app actually does, plus
      setup, env vars, and deploy. Currently claims fully-automatic
      email-on-new-episode, which won't be true until the cron task ships.

## 🎨 UI redesign — DONE (Inkwell)

The "Inkwell" manga-editorial redesign shipped across phases R1–R5 (see
`plan/redesign.md`). All 6 screens replaced: Login, Home/Discover,
Anime Detail (with countdown + episode list + cast strip), Profile (merged
with the old `/following`), Inbox (new), Search (new). Old dark-themed
SCSS modules and unused carousel components were deleted in R5.

Deferred / follow-up:
- Email template redesign — out of scope per user; split to a separate
  design pass. `src/lib/email-templates.js` still uses the previous
  dark-theme HTML.
- Bulk actions on `/profile` (Pause notifs, Unfollow selected,
  Unfollow everything, Delete account) — UI is wired, handlers stub
  with `alert()` until real flows land.
- Cron honoring `notifyFinales` and `quietHours` — schema + UI exist,
  but the cron currently sends regardless. Hobby-tier cron is daily so
  quietHours can't be honored exactly anyway; revisit on Pro.
- Search studio facet — sidebar shows facets for genre + status only.
  Studio filtering needs the `rawJikan.studios` projection lifted.

## 🐛 UI polish — reported 2026-04-29

- [ ] **Hover state hides button text.** Buttons (most visibly the Follow
      button) flip background to black on hover, but the text is also
      black so it disappears. Either invert text to paper on hover, or
      change the hover background.
- [ ] **Whole card should be clickable.** On home cards (Top Rated, Buzz
      Today, etc.), only the poster image navigates. Clicking the card
      body / title / metadata does nothing. Make the entire card act as
      the link — same destination as clicking the image.
- [ ] **`Cmd/Ctrl-K` is hijacked by the browser.** We advertise the
      shortcut inside the search bar placeholder, but it currently
      opens Chrome's address bar instead of focusing our search.
      Bind a global `keydown` listener that calls `preventDefault()`
      and focuses the search input (or routes to `/search`).
- [ ] **Danger-zone callout arrow points the wrong way.** In `/profile`
      account section, the "these actions can't be undone" warning box
      has a corner arrow pointing down; it should point up (toward the
      buttons it's annotating).
- [ ] **Remove "Delete my account" button.** Keep the danger-zone warning
      so it now annotates the "Unfollow all" button only. Drop the
      delete-account action and any wiring around it.
- [ ] **Login page underline gap.** On the login page, the SVG underline
      under the "NEVER MISS AN EPISODE" headline sits too far below the
      red `EPISODE` word. Tighten the vertical gap between the red
      text and the underline stroke.
