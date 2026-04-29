# Animephile — Implementation Plan & Context

This folder is the working notebook for understanding how Animephile is currently
built. It documents *what exists today* in the codebase, not aspirational design.

## What Animephile is

A Next.js + Firebase web app where anime fans can:

1. Log in with Google.
2. Browse top-rated anime, today's airing schedule, and a manga/news feed
   (all sourced from the public Jikan API v4).
3. Click "Follow" on an anime to subscribe to email notifications.
4. Receive an email when a new episode of a subscribed anime airs — sent via
   a **cron-style endpoint that an admin currently triggers manually** by
   pressing a "Check Updates" button on the home page.

Live (per README): https://animephile.vercel.app/

## Documents in this folder

| File | What it covers |
|---|---|
| [architecture.md](./architecture.md) | Tech stack, dependencies, directory layout, route map, config files, hosting setup. |
| [auth-and-browsing.md](./auth-and-browsing.md) | Google login flow, admin gating, how the three browse sections fetch and render anime. |
| [subscriptions.md](./subscriptions.md) | "Follow" button → RTDB write path, dedupe logic, dual-table redundancy. |
| [cron-and-emails.md](./cron-and-emails.md) | The notification pipeline: button → Jikan schedule → RTDB scan → Nodemailer. This is the most important doc. |
| [data-model.md](./data-model.md) | Firebase Realtime Database schema, security rules, what's missing (timestamps, episode tracking). |
| [gaps-and-issues.md](./gaps-and-issues.md) | Known bugs, security holes, dead code, and things the README claims that the code doesn't actually do. |

## Quick orientation for future work

- All app logic for auth, follow, and the cron-trigger UI lives in a single
  277-line file: `src/pages/index.js`. Splitting it is a reasonable first
  refactor target.
- The "cron" is **not** a cron. It's a button in `src/pages/components/check.js`
  that an admin clicks. There is no scheduled trigger anywhere in the project.
  Converting this to Vercel Cron or a Firebase scheduled function is the
  obvious productionization step.
- Admin status is hardcoded to three Gmail addresses in `index.js` (lines 50
  and 83 — duplicated). There is no admin table.
- Gmail SMTP credentials are committed in plaintext at
  `src/pages/api/sendEmail.js:7`. Rotate before doing anything else.
- The emails sent today have a **subject only, no body** — recipients get
  blank messages.
