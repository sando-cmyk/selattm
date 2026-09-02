# Manual Changes Log — Stripe & Firebase Consoles

This file exists because most of what breaks on selattm.com doesn't come from
code — it comes from a click made directly in the Stripe Dashboard or the
Firebase Console that git never sees. Code changes are already recorded by
git history (`git log`). This file is the record for everything else, so
that six months from now, when something looks wrong, there's a paper trail
of *what changed outside of git, when, and why* — not just a guess.

**Rule of thumb: if you clicked something in Stripe or Firebase's own website
(not in VS Code, not a `firebase deploy`), add an entry below before you
forget what you did.** Takes 30 seconds. Newest entries at the top.

Template for a new entry:

```
## YYYY-MM-DD — [Stripe|Firebase] — short title
Who: Craig / Joseph / Claude (with Craig or Joseph's approval)
What: exactly what was clicked/changed, and where in the console
Why: the problem it was fixing, or the reason for the change
```

---

## 2026-08-27 — Firebase — Custom domain gap identified, not yet fixed
Who: Claude (investigation only, no change made)
What: Confirmed `https://www.selattm.com` and `http://www.selattm.com` do not
resolve/connect at all, while the bare `selattm.com` (both http and https)
works correctly. This means Firebase's Hosting → "Add custom domain" has
never had the `www` variant added and verified — only the apex domain.
Why: A customer clicked a link to selattm.com's "www" form and it failed to
connect. The site's own outbound email template was fixed to point at the
working bare domain in the meantime (see git history).
**Still open**: go to Firebase Console → Hosting → Add custom domain →
`www.selattm.com`, and add the DNS record it asks for at your domain
registrar (usually a CNAME to the apex, set up to redirect). Until this is
done, anyone who types "www.selattm.com" gets a dead page.

## 2026-08-27 — Firebase — Admins added via script (not console UI)
Who: Craig, running `node scripts/add-admins.js craig@selacivil.co.nz
joseph@selacivil.co.nz` from his own PowerShell (using the service account
key, which never leaves his machine)
What: Added both emails to the `admins` Firestore collection so admin.html
recognises them as administrators.
Why: The `admins` collection is deliberately locked so it can't be written
from the browser (a compromised or buggy page can't grant itself admin
rights) — the only way in is a privileged script run with the service
account, not a console click. Logging it here anyway since it's the same
kind of "outside of git" change this file exists to track.

## 2026-08-27 — Stripe — NZ GST tax registration added
Who: Craig, in Stripe Dashboard → Settings → Tax → Registrations
What: Added a New Zealand GST registration.
Why: Checkout was calculating $0 GST despite `automatic_tax: true` being
correctly configured in code. Turned out "Include tax in prices" (a
per-price setting) is a different thing from having an actual tax
registration on file — without the registration, Stripe Tax has no
jurisdiction to calculate against, so it silently charges no tax at all.
Adding the NZ registration fixed it immediately — confirmed via a real
checkout: $495 + GST (15%, $74.25) = $569.25.

## 2026-08-2x — Stripe — Old NZGTTM Essentials price archived
Who: Craig, in Stripe Dashboard → Products → NZGTTM Essentials
What: Archived price `price_1U7sbz0flJvw3UeNHWAZ6T4N` while adjusting the
product's tax setup, and a new price `price_1UAIlw0flJvw3UeN3y87d1fd` was
created to replace it (prices in Stripe can't be edited once created, only
archived and replaced).
Why: Was trying to fix GST not applying (see above) by changing the price's
tax behaviour — didn't realise archiving breaks any checkout still pointed
at the old price ID until real customers started hitting "price is
inactive" errors.
Follow-up (in code, see git history): the site now grandfathers anyone who
already paid under the old archived price ID, so switching prices like this
again in future won't lock out existing customers.

---

*(Add new entries above this line, newest at the top.)*
