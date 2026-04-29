# Subscriptions ("Follow" feature)

## Trigger

Each anime card (`Recentcard.jsx`, `AiringCard.js`) renders a Follow button
that calls the `savemyfollow` prop with the anime's **title string**. That
prop traces back to `savemyfollow(title)` in `src/pages/index.js:165-171`.

```js
function savemyfollow(title) {
  if (searchData(auth.currentUser.email, title)) {
    console.log("data added")
  } else {
    console.log("email already present")
  }
}
```

The `if/else` here is misleading — `searchData` returns nothing
synchronously (it's async fire-and-forget Promises), so the message is
not actually meaningful. Both branches just log.

## Storage — two parallel RTDB writes

`searchData(email, title)` (index.js:118-163) does two independent reads,
each followed by an append-if-missing write. Both run in parallel; there's
no transaction or atomicity.

### Write 1 — `users/{title}` (index.js:103-109)

```js
function appendData(email, title) {
  const postListRef = ref(DB, 'users/' + title);
  const newPostRef = push(postListRef);
  set(newPostRef, { "email": email });
}
```

Resulting shape:
```
users/
  Attack on Titan/
    -Na0dP2oM0z: { email: "alice@example.com" }
    -Na0dP2oM1z: { email: "bob@example.com"   }
```

This is the table the cron uses to fan out emails (one record per
subscriber per anime).

### Write 2 — `uid/{uid}` (index.js:110-116)

```js
function appendDataEmail(email, title) {
  const postListRef = ref(DB, 'uid/' + uid);
  const newPostRef = push(postListRef);
  set(newPostRef, { "title": title });
}
```

Resulting shape:
```
uid/
  AIz9sD8fG0lK/
    -Na0dP2oM0z: { title: "Attack on Titan" }
    -Na0dP2oM1z: { title: "Naruto Shippuden" }
```

This table is the inverse view, presumably to back a future "my
subscriptions" page (see the commented-out `/following` link in
`Navbar.jsx`). **Nothing currently reads it.**

## Dedupe logic

Before writing, `searchData` reads the existing path:

- For `users/{title}`: iterates push-ID children and bails early if any
  child has matching `email`.
- For `uid/{uid}`: iterates and bails if any child has matching `title`.

Returning `false` from inside the snapshot callback does **not** propagate
to `savemyfollow` — those returns escape only the `forEach` of object
keys. The outer function still resolves, and `appendData` is called from
inside the `then`, not based on the `false` return. So if you click
Follow twice rapidly, dedupe works because the second call sees the
first write. But the boolean-return idea in the code is broken.

## Known issues with this design

- **Title as primary key.** Anime titles are not stable identifiers —
  Jikan uses the romaji title, but variations exist (English, Japanese).
  A user who follows the same anime via two different cards (e.g.
  `Recent` carousel uses one title field, `Airingtoday` may use another)
  could double-subscribe.
- **No timestamp on subscription rows.** Can't sort, audit, or expire.
- **No unfollow path.** Users have no way to remove a subscription.
- **Two tables that can drift.** If one write succeeds and the other
  fails, `users/` and `uid/` get out of sync. Should be a single source
  of truth (or written via a multi-path RTDB `update()`).
- **No client-side validation** that the title is non-empty or that
  the user is the one whose email is being written.
- **RTDB rules don't enforce ownership.** Per `database.rules.json`, any
  authed user can write any other user's email under any anime title.
