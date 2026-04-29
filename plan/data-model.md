# Data Model

Animephile uses **Firebase Realtime Database** (not Firestore). The instance
lives at:

```
https://animephile-a28c7-default-rtdb.asia-southeast1.firebasedatabase.app
```

There are exactly two top-level paths.

## `users/{animeTitle}/{pushId}`

The fan-out table that the cron uses to find recipients.

```
users/
  Attack on Titan/
    -Na0dP2oM0z: { email: "alice@example.com" }
    -Na0dP2oM1z: { email: "bob@example.com"   }
  Naruto Shippuden/
    -Na0dP2oM2z: { email: "alice@example.com" }
```

- **Key:** the anime's title string as returned by Jikan when the user
  clicked Follow.
- **Value:** an auto-generated push ID containing `{ email: <subscriber> }`.
- Written by `appendData` (`src/pages/index.js:103-109`).
- Read by `sendUpdate` (`src/pages/index.js:217-238`) — pulls the entire
  subtree to do the cron fan-out.

## `uid/{firebaseUid}/{pushId}`

The inverse view.

```
uid/
  AIz9sD8fG0lK/
    -Na0dP2oM0z: { title: "Attack on Titan" }
    -Na0dP2oM1z: { title: "Naruto Shippuden" }
```

- **Key:** Firebase Auth UID.
- **Value:** push ID with `{ title: <animeTitle> }`.
- Written by `appendDataEmail` (`src/pages/index.js:110-116`).
- **Currently never read.** Likely intended to back a "my following"
  page that was started and abandoned (see commented `/following` link
  in `Navbar.jsx`).

## What the schema is missing

- **No `animes/{mal_id}` collection.** Title strings are the only thing
  tying a subscription to a piece of media. Jikan's stable `mal_id`
  is never persisted.
- **No timestamps.** Subscriptions can't be sorted by date. No way to
  audit "when did Bob subscribe?"
- **No notification state.** Nowhere is `lastNotifiedEpisode`,
  `lastNotifiedAt`, or `episodeNumber` recorded. This is why the cron
  is non-idempotent — clicking the button twice in a day double-emails.
- **No unsubscribe path data.** No soft-delete flag, no deletion
  endpoint, no unsubscribe token in emails.
- **No `admins/` collection.** Admin status is hardcoded in JS instead.
- **No user profile collection.** `displayName` and `photoURL` are read
  from the live Firebase Auth user object, never persisted.

## Security rules

`database.rules.json`:
```json
{ "rules": { ".read": "auth != null", ".write": "auth != null" } }
```

Implications:

- Any logged-in Animephile user can read **every other user's email
  address** by reading `users/`. This is a privacy leak.
- Any logged-in user can write under any anime title — including
  injecting other users' emails into subscription lists, deleting
  others' subscriptions, or planting fake subscriptions to spam them.
- A malicious user could overwrite the entire `users/` tree.

A reasonable hardening pass would scope writes to the user's own
records:

```jsonc
{
  "rules": {
    "uid": {
      "$uid": {
        ".read":  "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    },
    "users": {
      "$title": {
        "$pushId": {
          ".write": "!data.exists() && newData.child('email').val() === auth.token.email"
        }
      }
    }
  }
}
```

…but the cron currently reads the whole `users/` tree from the admin's
browser, which assumes broad read rights. Tightening rules requires
moving the cron server-side first.
