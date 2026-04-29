# Gaps & Known Issues

A flat list of everything I noticed reading the code, grouped by severity.
This is meant as a working punch list — not a critique. The app demonstrably
works for its happy path; these are the edges.

## Security — fix first

1. **Gmail app password committed.** `src/pages/api/sendEmail.js:7` has
   `pass: 'kpappwgawkrrmbwp'` in plaintext. Rotate the credential, then
   move it to `process.env.SMTP_PASS`.
2. **`/api/sendEmail` is an open relay.** No auth, no rate limit, no
   recipient allow-list. Anyone on the internet can send arbitrary mail
   from `animephileupdates@gmail.com`.
3. **RTDB rules allow anyone to read every email address** in `users/`
   and to overwrite anyone's subscriptions. See [data-model.md](./data-model.md).
4. **Hardcoded admin list** at `index.js:50` and `:83` (duplicated).
   Three Gmail addresses are the entire access-control model.
5. Firebase web API key is unrestricted (acceptable for client config,
   but should at least be domain-restricted in Firebase Console).

## Correctness — bugs visible in the current behavior

6. **Emails have no body.** `mailOptions` in `sendEmail.js` only sets
   `from`, `to`, `subject`. Recipients see a blank message.
7. **Cron is not idempotent.** Each click of "Check Updates" re-fans
   emails for every airing-today match. No `lastNotifiedAt` field exists.
8. **Cron is not actually a cron.** No scheduler — only the manual button.
   The README implies automatic notifications, which is misleading.
9. **Title-string equality is fragile.** `sendUpdate` matches RTDB keys
   to today's Jikan titles by exact string equality. Any title-format
   drift silently drops users from the notification.
10. **`onAuthStateChanged` is registered in render body** (`index.js:80`),
    leaking listeners. Move into `useEffect`.
11. **`searchData` returns are dead.** The dedupe function returns from
    inside Promise callbacks; the boolean never reaches `savemyfollow`,
    so the "added vs already present" log is meaningless. The dedupe
    *does* still work because the write only happens inside the promise.
12. **No unfollow.** Users can subscribe but cannot unsubscribe.
13. **No "my subscriptions" view.** `uid/` is written but never read.
14. **Anime detail page doesn't exist.** No `/anime/[id]` route.
15. **Search doesn't exist.** `pages/api/getSearch.js` is hardcoded to
    "naruto" and isn't called from anywhere.

## Code quality — friction for future work

16. **`src/pages/index.js` is 277 lines** mixing auth, RTDB writes,
    cron orchestration, and JSX. Splitting into an `AuthProvider`,
    a `useSubscriptions` hook, and a `useCronTrigger` hook would help.
17. **Next.js canary version** (`13.4.20-canary.2`) — pin to stable.
18. **Two unused deps in package.json**: `emailjs`, `fs`. Remove.
19. **Dead API routes**: `pages/api/getSearch.js`, `pages/api/hello.js`,
    empty `pages/api/logos/` directory.
20. **Misspelled directory** `src/pages/components/assests/` (should be
    `assets`). Renaming requires updating import paths.
21. **`displayname` vs `displayName`** — prop casing inconsistent across
    components.
22. **Comments and `console.log` debug noise** scattered throughout
    (`index.js`, `check.js`, components). Strip before any production
    deploy.
23. **Mixed module styles** — some components are `.js` and some are
    `.jsx`. Consistency is cheap.
24. **No tests.** Zero test files. No `jest.config`, no `vitest.config`.
25. **Firebase initialized inside the page component** (`index.js:30-33`)
    — runs on every render. Should be a module-level singleton.

## Documentation drift

26. README claims "user receives an email update **every time a new
    episode is released**." The implementation only sends when an admin
    manually clicks a button, and only matches on broadcast-day, not on
    actual new-episode availability.
27. `firebase.json` configures Firebase Hosting in `asia-east1` but the
    app deploys to Vercel. One of the two should be removed to avoid
    confusion.
28. There is an empty `plant/` directory at the repo root — likely a
    typo for `plan/`. Worth deleting now that this `plan/` folder
    exists. (Mentioning here rather than deleting it without asking.)

## Suggested next-step ordering

If picking these up in priority order, I'd do:

1. Rotate the Gmail password & move to env var (#1).
2. Lock down `/api/sendEmail` with a shared-secret header (#2).
3. Add an HTML body to the email and an episode link (#6).
4. Move cron from button → Vercel Cron, server-side (#7, #8).
5. Track `lastNotifiedEpisode` per subscription to make it idempotent (#7).
6. Tighten RTDB rules once cron is server-side (#3).
7. Build the "my subscriptions" page on top of the existing `uid/` data
   and add unfollow (#12, #13).
8. Then start refactoring the 277-line `index.js` (#16).
