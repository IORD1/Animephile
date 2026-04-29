# The "Cron" + Email Notification Pipeline

> This is the part the user specifically flagged. It's currently
> **manually triggered**, runs **entirely in the admin's browser**, and
> sends **emails with no body content**. Productionizing this is the
> highest-leverage change in the codebase.

## End-to-end flow

```
[Admin clicks "Check Updates"] in src/pages/components/check.js
        │
        ▼
GET https://api.jikan.moe/v4/schedules/{today}
        │
        ▼  collect titles airing today → titlearray[]
        │
sendUpdate(titlearray)        in src/pages/index.js:217-238
        │
        ▼  read RTDB users/* (every subscription)
        │  intersect with titlearray
        │
sendEmail(matches, allUsers)  in src/pages/index.js:193-213
        │
        ▼  for each match, for each subscriber email…
        │
sendEmailToUser(email, title) in src/pages/index.js:174-190
        │
        ▼  POST /api/sendEmail  { recipientEmail, subject: title }
        │
src/pages/api/sendEmail.js
        │
        ▼  Nodemailer → Gmail SMTP → recipient
        ▼  (subject only; no text/html body)
```

## Step 1 — the trigger button

`src/pages/components/check.js`:

```js
const getShedule = async () => {
  const day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const response = await fetch(`https://api.jikan.moe/v4/schedules/${day}`).then(r => r.json());
  setSchedule(response.data);
  for (let i in response.data) {
    titlearray.push(response.data[i].title);
  }
  sendRequest(titlearray);   // = props.sendUpdate
}
```

Visibility: `<Check>` is only rendered when `isimp === true`, i.e. for
the three hardcoded admin emails (see [auth-and-browsing.md](./auth-and-browsing.md)).

`titlearray` is collected with `for...in` over an array, which is wrong
JavaScript style but happens to work because `i` becomes the numeric
indices.

## Step 2 — `sendUpdate` (index.js:217-238)

```js
function sendUpdate(list) {                       // list = today's airing titles
  let toSendUpdateList = [];
  get(child(dbRef, 'users/')).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();                // entire users/ subtree
      entireDb = data;                            // captured into module-scope var
      for (const key in data) {                   // key = anime title
        for (let a in list) {
          if (list[a] === key) toSendUpdateList.push(key);
        }
      }
    }
    sendEmail(toSendUpdateList, entireDb);
  });
}
```

Behavior:

- Pulls **every subscription record in the database** into the admin's
  browser. Doesn't scale.
- Intersects RTDB anime titles with today's Jikan titles by **exact string
  equality**. Any title-format drift (English vs romaji vs alternate
  spelling) breaks the match.
- `entireDb` is a module-scope `let` declared on line 215 — passing state
  through a closure-captured outer variable is fragile but currently works.

## Step 3 — `sendEmail` (index.js:193-213)

```js
function sendEmail(list, database) {
  for (let a in list) {
    for (const name in database) {
      if (name === list[a]) {
        for (const timestamp in database[name]) {            // push-ID
          for (const emails in database[name][timestamp]) {  // (one key: "email")
            const email = database[name][timestamp].email;
            sendEmailToUser(email, name);                    // subject = anime title
          }
        }
      }
    }
  }
}
```

Notes:

- The innermost loop iterates the keys of `{ email: "..." }` — so it runs
  exactly once per record. The loop variable `emails` is unused. This is
  fine but wasteful.
- O(list × database) intersection done a second time even though
  `sendUpdate` already filtered the list. Could be O(list).
- **No deduplication across animes.** If a user is subscribed to three
  anime that all aired today, they get three separate emails — one per
  anime — not one digest.
- **No idempotency.** If the admin clicks the button twice on the same
  day, every subscriber gets duplicate emails. There is no
  `lastNotifiedAt` field and no episode-version tracking.

## Step 4 — `sendEmailToUser` (index.js:174-190)

Plain `fetch('/api/sendEmail', { method: 'POST', body: { recipientEmail, subject } })`.
No retry, no error surfacing to UI, just `console.log`.

## Step 5 — the API route (src/pages/api/sendEmail.js)

```js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'animephileupdates@gmail.com',
    pass: 'kpappwgawkrrmbwp',                 // ← committed app password
  },
});

export default async function handler(req, res) {
  try {
    const { recipientEmail, subject } = req.body;
    const mailOptions = {
      from: 'animephileupdates@gmail.com',
      to: recipientEmail,
      subject: subject,
                                              // ← no `text` or `html` field
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
}
```

Issues, in order of severity:

1. **Committed Gmail app password.** Rotate immediately and move into an
   environment variable.
2. **Empty email body.** Subscribers receive a message with the anime
   title as subject and nothing in the body — no episode number, no
   link, no unsubscribe.
3. **No auth on the endpoint.** Anyone who can hit `/api/sendEmail` can
   send arbitrary email from `animephileupdates@gmail.com` to any
   recipient with any subject. This is a spam relay.
4. **No rate limiting.** A loop on the client side fires N concurrent
   POSTs; Gmail's daily send limits will eventually trip.
5. **No input validation** — `subject` and `recipientEmail` are accepted
   verbatim.

## What "new episode detection" actually does

It does **not** detect new episodes. It detects "this anime has any
broadcast slot today, per Jikan's daily schedule." It will fire emails:

- On a subscribed anime's *normal* weekly slot, even if no episode airs
  (e.g. recap weeks, hiatus filler).
- For every click of the button — there's no per-day or per-episode
  guard.

It will fail to fire emails:

- If the title string in RTDB doesn't byte-match the title returned by
  Jikan that day.
- If no admin clicks the button. There is **no schedule, no Vercel cron,
  no Firebase scheduled function** anywhere in this repo.

## Productionization sketch (for future work)

The minimal upgrade path that preserves the current shape:

1. Move the cron logic out of the browser into `pages/api/cron.js`
   (a Next.js API route).
2. Use **Vercel Cron** (`vercel.json`) to hit that route once a day, or
   Firebase Scheduled Functions if migrating off Vercel.
3. Track per-subscription state: `lastNotifiedEpisodeId` so reruns are
   idempotent.
4. Replace title-string keying with **Jikan `mal_id`** — it's stable.
5. Add an HTML email template with the episode title, episode number,
   air date, and an unsubscribe link.
6. Pull SMTP credentials from `process.env.SMTP_PASS` (and rotate the
   currently leaked password).
7. Protect `/api/sendEmail` with a shared secret header so only the
   cron route can call it (or just inline the Nodemailer call into
   the cron route).
