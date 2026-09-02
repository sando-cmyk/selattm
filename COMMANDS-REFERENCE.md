# Command Reference — selattm project

Plain-language notes on every command you'll actually run for this project,
and where each one comes from. Kept in the project folder so it's always
right here when you need it.

## Two different tools, same terminal window

**Node.js** is the program that runs JavaScript files directly. Any command
that starts with `node` is this — e.g. `node scripts/sync-courses.js`. These
particular scripts (`sync-courses.js`, `add-admins.js`, `build-all.js`) were
written specifically for this project — they're not something you'd find in
a general Node tutorial. Each one has a comment block at the top explaining
what it does.

**Firebase CLI** is Google's own command-line tool for managing this
project's Firebase services (Hosting, Firestore, Extensions). Any command
starting with `firebase` is this one. It's a real, documented product —
official reference: https://firebase.google.com/docs/cli

You don't need to learn either tool in general. You need to know what each
of the handful of commands below actually does, and that's it.

## The commands, in plain English

| Command | What it actually does | When to run it |
|---|---|---|
| `node build-all.js` | Scans every folder under `public/courses/`, reads each course's `course-manifest.json`, and rebuilds `public/data/courses.json` from them. Purely local -- doesn't touch the live site or Firestore. | After editing a course's `course-manifest.json` (e.g. changing its Stripe Price ID at the file level, not through the admin form). |
| `node scripts/sync-courses.js` | Pushes `courses-import.json` up to the live Firestore database, overwriting the `courses` collection with exactly what's in that file. This is what the live store page actually reads from. | After hand-editing `courses-import.json` (e.g. a price ID fix, or adding a `legacyStripePriceIds` entry). Not needed for changes made through the admin form's Save/Grant buttons -- those write to Firestore directly already. |
| `node scripts/add-admins.js <email> [email2...]` | Looks up each email's account and grants them access to `admin.html`. | Whenever someone new needs admin access. They must have signed up/logged in at selattm.com at least once first. |
| `firebase deploy --only hosting` | Publishes everything in the `public/` folder (all the `.html`, `.js`, `.css` files) to the live selattm.com site. | After editing any file under `public/` -- store.html, admin.html, learner.html, any `.js` file, etc. This is the one you'll run most often. |
| `firebase deploy --only firestore:rules` | Publishes `firestore.rules` -- the security rules that decide who's allowed to read/write what in the database. | Only after editing `firestore.rules` itself. Easy to forget since `firebase deploy --only hosting` never touches this file, even though they're both "firebase deploy" commands. |
| `firebase deploy` (no `--only`) | Publishes hosting **and** rules **and** everything else Firebase-related in this project, all at once. | A safe "deploy everything" option if you're ever unsure which of the two above you need -- costs nothing extra to run both. |

## A rule of thumb

If you edited a file inside `public/` → you need `firebase deploy --only hosting`.
If you edited `firestore.rules` → you need `firebase deploy --only firestore:rules`.
If you edited `courses-import.json` → you need `node scripts/sync-courses.js`.
Several of these often go together (edit a course file, sync it, then deploy the page that reads it) -- when in doubt, running all the relevant ones in sequence is harmless.

## Where to actually learn more, if you want to

- Node.js itself (general programming, not this project's specific scripts): https://nodejs.org/en/learn
- Firebase CLI, the full command list: https://firebase.google.com/docs/cli
- Firebase Hosting concepts: https://firebase.google.com/docs/hosting
- Firestore security rules (the `firestore.rules` file): https://firebase.google.com/docs/firestore/security/get-started

None of these will explain *this* project's scripts specifically -- for
those, the comment block at the top of each file, or asking me, is the real
manual.


## Git -- saving a version you can always go back to

Every file change we make together lives in this folder, but that alone
isn't a safety net -- if something gets broken, there's nothing to
compare against unless you've been checkpointing with git. Two commands
you'll actually use:

| Command | What it actually does | When to run it |
|---|---|---|
| `git add -A` then `git commit -m "describe what changed"` | Takes a snapshot of every file in the folder right now and saves it permanently in this project's history, on your own computer. | Any time we finish a chunk of work and it's tested/working -- not after every tiny edit, but definitely before moving on to the next thing. |
| `git push` | Sends your saved snapshots up to GitHub, so they exist somewhere other than just this one laptop. | Right after committing -- a commit that's never pushed is only safe until this computer has a problem. |
| `git log --oneline` | Lists every snapshot ever saved, newest first, one line each. | To see what's been saved and when. |
| `git status` | Shows what's changed since the last snapshot, and whether anything's waiting to be pushed. | Before committing, to see what you're about to save. |

**If something breaks and you need to go back:** don't guess or start
deleting files -- tell me (or run `git log --oneline` yourself to find the
last good snapshot) and we can restore the project to exactly how it was
at any previous commit. That's the entire point of doing this regularly.

**What committing does *not* cover:** anything clicked directly in the
Stripe Dashboard or Firebase Console (a price change, a tax setting, an
admin added by script, a domain added). Git only ever sees files in this
folder. Console-side changes belong in `MANUAL-CHANGES-LOG.md` instead --
see that file for the same "add an entry, 30 seconds" habit, just for the
things git can't see.
