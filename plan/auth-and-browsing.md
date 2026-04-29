# Authentication & Browsing

## Auth flow

All auth state lives in `src/pages/index.js`. There is no auth context,
provider, or custom hook — `useState` + `onAuthStateChanged` directly
in the page component.

### State variables (index.js:13-19)

| State | Type | Meaning |
|---|---|---|
| `islogedin` | number | `1` = logged out (show `<Login>`), `0` = logged in. |
| `username` | string | Display name from Google profile. |
| `prourl` | string | Avatar URL from Google profile. |
| `propemail` | string | User's email. |
| `uid` | string | Firebase Auth UID. |
| `isimp` | bool | "Is important" — the admin flag. Controls visibility of `<Check>`. |

### Login (index.js:42-67)

`logmein()` calls `signInWithPopup(auth, new GoogleAuthProvider())`. On
success it copies `displayName`, `photoURL`, and email into state, and runs
the admin check (see below).

### Admin gating (index.js:50, 83)

```js
if (user.email === 'pratham111ingole@gmail.com'
 || user.email === 'shubhamhippargi@gmail.com'
 || user.email === 'hiteshjainhd@gmail.com') {
  setisImp(true);
}
```

This same three-email check is duplicated inside `onAuthStateChanged` so it
re-applies on session restore. There is no `admins` collection in RTDB; to
add an admin you edit source.

When `isimp` is true the render tree includes `<Check sendUpdate={sendUpdate}/>`
(the cron trigger button). Otherwise that component is omitted. Everything
else is identical for both groups.

### Logout (index.js:69-78)

`logmeout()` calls `signOut(auth)` and resets `setisImp(false)`. It does
**not** explicitly reset `islogedin`; that flips via `onAuthStateChanged`
(index.js:80-98) when Firebase reports no user.

### Quirk: `onAuthStateChanged` is registered inside the render body

Line 80 calls `onAuthStateChanged(auth, ...)` directly in the function
component body, not inside a `useEffect`. This means a fresh listener is
attached on every render, which leaks subscriptions. A future cleanup
should move it to `useEffect(() => onAuthStateChanged(...), [])`.

## Browsing — three sections, all from Jikan

The home page renders three carousels stacked vertically. Each component
fetches its own data on mount.

### Recent (top anime) — `src/pages/components/Recent.js`

```
GET https://api.jikan.moe/v4/top/anime
```
Renders `response.data` through `<Recentcard>`, which shows the cover image,
title, first 100 chars of synopsis, trailer link, score, and a **Follow**
button that calls the `savemyfollow` prop.

### Airing Today — `src/pages/components/Airingtoday.js`

```js
const day = ['sunday','monday',...,'saturday'][new Date().getDay()];
fetch(`https://api.jikan.moe/v4/schedules/${day}`)
```
Same card pattern; `<AiringCard>` shows broadcast time and current episode
count. Critically, the `check.js` cron-trigger uses **the exact same Jikan
endpoint** to decide whose subscriptions to fire — see
[cron-and-emails.md](./cron-and-emails.md).

### News (manga feed) — `src/pages/components/News.jsx`

```
GET https://api.jikan.moe/v4/manga
```
Loaded with a 2-second `setTimeout` delay (presumably to spread out Jikan
rate limits). Each card shows up to 500 chars of synopsis.

### Why this matters

There is **no anime detail page, no search, no filtering**. The "Follow"
button passes the anime *title* (a string) up to `savemyfollow(title)`,
which is what the subscription record is keyed on. That coupling — title
as primary key — is the source of several issues documented in
[data-model.md](./data-model.md) and [gaps-and-issues.md](./gaps-and-issues.md).
