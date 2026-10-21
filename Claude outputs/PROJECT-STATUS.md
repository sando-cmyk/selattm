# selattm.com — Project Status

*Last updated: 3 September 2026. Written as a handoff so a new chat can pick up without re-explaining the project. Read this file first, then `COMMANDS-REFERENCE.md` for how-to commands and `MANUAL-CHANGES-LOG.md` for the history of console-only (non-code) changes.*

## What this project is

selattm.com is Sela Civil Advisory's TTM (Temporary Traffic Management) training platform — a static site hosted on Firebase Hosting, with Firestore (region `australia-southeast1`) for data, Firebase Auth for logins, and the `firestore-stripe-payments` Firebase Extension handling checkout and payments. Courses live under `public/courses/<course-folder>/`, each with its own `course-manifest.json`; `build-all.js` scans those manifests and writes `public/data/courses.json`, which the storefront and learner dashboard read from. The catalog's source of truth for a full re-sync is `courses-import.json`, pushed to Firestore via `node scripts/sync-courses.js`.

Sela is acquiring the assets of Roading Industry Support Services Ltd (RISS.co.nz) — TTM training/accreditation, H&S assurance, and the SOST.co.nz safety-deployment platform. Craig Sanders (craig@selacivil.co.nz) runs governance/commercial; Joseph Rosendaal (joseph@selacivil.co.nz) runs technical roading delivery and does hands-on course testing.

## Current state (as of this handoff)

Git is clean and pushed — `origin/main` is at commit `afef3c7`, which bundles two pieces of work: the live-breaking import-path fix (below) and today's TTM Roles course replacement. Nothing is staged or pending in git.

**Still to be done by Craig, from his own PowerShell** (the assistant cannot reach the network or run these):

- `node scripts/sync-courses.js` — pushes the updated `courses-import.json` catalog to Firestore
- `firebase deploy --only hosting` — publishes the code changes live
- Ask Joseph to re-test these courses after the deploy and confirm they actually start and complete: NZGTTM Essentials, TTM Engineering Essentials, the new TTM Roles & Responsibilities course, and ideally PTS-01 as a control. This matters because the last deploy fixed a bug that had silently broken three courses — a quiet console isn't proof it's fixed, an actual run-through is.

**Still open, longer-term, needs Craig's own action in a console:**

- `www.selattm.com` does not resolve at all (confirmed by direct testing) — only the bare `selattm.com` works. Fix is Firebase Console → Hosting → Add custom domain → `www.selattm.com`, plus the DNS record it asks for at the domain registrar. Logged in `MANUAL-CHANGES-LOG.md`.

## What's been done recently (most recent first)

**TTM Roles & Responsibilities course replacement.** Joseph had re-recorded this course as a new video-based version, initially extracted into a new `nzgttm-roles-responsibilities` folder. Craig confirmed: use the new content, real Stripe price `price_1UBSfH0flJvw3UeN8pTPATze` ($55 + GST), no one had purchased the old course so no need to preserve old customer access, but keep the same catalog listing details (id `ttm-roles-01`, code `TTM-ROLES-01`, title, description) so it reads as an update rather than a new course. Done: updated `courses-import.json` and the new course's own manifest with the new price and a `legacyStripePriceIds` entry for the old price as a safety net; repointed `launchPath` to `/courses/nzgttm-roles-responsibilities/` everywhere it's referenced (`courses-import.json`, the manifest, `public/learner.html`); deleted the old `public/courses/ttm-roles-responsibilities/` folder entirely (confirmed via repo-wide grep that nothing still references it); regenerated `public/data/courses.json` with `node build-all.js`.

**Critical live bug fix (assistant's own mistake, caught and fixed).** While wiring up results-recording for three courses, a relative import path to `public/js/firebase-init.js` was written one directory level too shallow, because the working example (PTS-01) had its file at a different folder depth. This silently broke the *entire* module for NZGTTM Essentials, TTM Engineering Essentials, and the old TTM Roles course — not just results-recording, the whole course failed to start — because the browser couldn't load the JS module at all. Caught by directly inspecting the live production site's console errors and network requests, not just trusting a bug report at face value (Joseph had only reported the Roles course; the other two were also broken and hadn't been noticed yet). Fixed in all three files plus a fourth (the new Roles course, which had copied the same mistake), each re-verified with `node --check`. **This is the fix Craig still needs to confirm is actually live and working**, per the to-do list above.

**Course Results & Certificates system**, built for PTS-01 first, then rolled out to NZGTTM Essentials, TTM Engineering Essentials, and TTM Roles & Responsibilities (deliberately *not* ASHTAS-01, whose real assessment happens in an external Moodle LMS). Genuine quiz/course completions write to a `submissions` Firestore collection; `admin.html` has a "Course Results & Certificates" panel where an admin can see results and issue a branded PDF certificate on demand (built client-side with jsPDF), capturing the learner's full name into a new `learner_profiles/{email}` collection the first time so it's remembered for next time.

**Admin workflow improvements.** Granting a learner access to a course now auto-drafts a "how to log in" email (a `mailto:` link that opens in the admin's own mail client — never auto-sent) with correct instructions and the working `selattm.com` link (an earlier version wrongly pointed at the broken `www.selattm.com`). Each row in the grants table also has a "Draft Email" button to re-send that same email later.

**Recovered an accidentally-overwritten live course.** A new course package meant for a new folder was instead extracted directly into the live `ttm-roles-responsibilities` folder, overwriting it. Recovered the original via `git checkout HEAD -- public/courses/ttm-roles-responsibilities`, and relocated the genuinely-new course into its own properly-named folder — this is the course later formally adopted as the TTM Roles replacement above.

**OneDrive Files-On-Demand issue diagnosed.** A course's files were unreadable from the device bridge because OneDrive had converted them back to cloud-only placeholders (not caught by the usual `cloudOnly` detection). Fixed by Craig setting the whole project folder to "Always keep on this device" in File Explorer.

**Git checkpointing set up.** The assistant's sandboxed environment has no git identity configured and must never set one — so the pattern going forward is: the assistant stages changes and writes the commit message to `.git-commit-msg.txt`, and Craig runs `git commit -F .git-commit-msg.txt` and `git push` himself from his own already-configured PowerShell. Documented in `COMMANDS-REFERENCE.md`. `MANUAL-CHANGES-LOG.md` was also set up as a running log of anything changed by clicking directly in the Stripe or Firebase console (not through code), since git never sees those.

## How this codebase works (useful context for a new chat)

Courses aren't all built the same way — there are five different "course engine" architectures coexisting: legacy SCORM-style (PTS-01, ASHTAS-01), a single-page-app style (NZGTTM Essentials), a narrated-slide-deck style (TTM Engineering Essentials), a modules-with-end-quiz style (the old TTM Roles course), and a newer video-based style using dynamic imports (the new TTM Roles course). When adding results-recording or any Firebase import to a course, the relative path back to `public/js/firebase-init.js` must exactly match that file's real folder depth under `public/` — this is what caused the critical bug above, and is worth double-checking every time (`node --check` after any such edit catches syntax errors but not a wrong-but-valid path, so a live console/network check is the only real proof).

`build-all.js` preserves each course manifest's `status` field as-is; note that `store.html` does not currently filter by `status`, so a "draft" course with a placeholder Stripe price would still be purchasable if it got synced live — worth keeping in mind before running `sync-courses.js` after adding a new course.

## How to add a new course (documented in full in COMMANDS-REFERENCE.md)

Short version: create the course folder under `public/courses/` with its own `course-manifest.json`, wire up results-recording (with the correct firebase-init import path — see above) if it needs a certificate, add it to `courses-import.json`, run `node build-all.js`, then `node scripts/sync-courses.js` and `firebase deploy --only hosting` from Craig's PowerShell.
