# selattm Project — Setup Check

*Generated 27 September 2026 at the start of this Claude Project, so Craig can compare it against the original chat and confirm nothing was lost or misread in the handover.*

---

## 1. Files this project can see

These are the project knowledge files, confirmed on disk at `/mnt/project/`:

| # | File | Lines | Size | What it's for |
|---|---|---|---|---|
| 1 | `PROJECT-STATUS.md` | 55 | 12.7 KB | Authoritative current state. **Last updated 4 September 2026.** |
| 2 | `COURSE-BUILD-SPEC.md` | 76 | 8.6 KB | Required structure for any new/migrated course (shared kit). |
| 3 | `COMMANDS-REFERENCE.md` | 78 | 6.0 KB | Plain-English command guide (node scripts, firebase deploy, git). |
| 4 | `MANUAL-CHANGES-LOG.md` | 78 | 4.2 KB | Console-only changes in Stripe/Firebase that git doesn't see. |
| 5 | `SELATTM-Session-Summary.md` | 67 | 11.9 KB | Plain-English record of the previous (non-Project) conversation. |
| 6 | `FIRESTORE-LOCKDOWN-PLAN_1.md` | 345 | 23.5 KB | Earlier security planning doc (older). |
| 7 | `GO-LIVE-PUNCH-LIST.md` | 158 | 10.1 KB | Earlier go-live planning doc (older). |

No files are uploaded to this chat itself (`/mnt/user-data/uploads` is empty).

**Compare against the original chat:** were there any other files you meant to attach? Seven are here.

---

## 2. Things that don't quite match — worth checking

1. **File name mismatch.** The project instructions refer to `FIRESTORE-LOCKDOWN-PLAN.md`, but the attached file is `FIRESTORE-LOCKDOWN-PLAN_1.md`. The `_1` usually means a duplicate was uploaded. Harmless, but worth confirming it's the latest version.

2. **No desktop bridge in this session.** The instructions say Claude can read/edit the repo on your Windows machine via the desktop bridge. **I don't currently have that tool available** in this chat. What I *do* have: the seven read-only files above, a scratch Linux sandbox, Microsoft 365 (Outlook/SharePoint/Teams), Claude in Chrome, and web search. So right now I can't see or edit the actual repo, stage files, or write `.git-commit-msg.txt`. If you expected the bridge, it likely needs to be connected from the Claude Desktop app for this project.

3. **Company documents not attached.** The organisation instructions mention a Certificate of Incorporation, Company Extract, Business Plan, General Service Agreement, Leadership Summary, and Company Details Form as source-of-truth. **None of these are in this project.** Only needed for company/commercial work, not site work — but add them if you want them here.

4. **Status may be stale.** `PROJECT-STATUS.md` was last updated 4 Sept 2026; today is 27 Sept. Anything done in the ~3 weeks since isn't recorded.

5. **Older planning docs are partly superseded.** For example, `GO-LIVE-PUNCH-LIST.md` says only ASHTAS-01 has real content and nothing records results — `PROJECT-STATUS.md` shows five live courses and a working Results & Certificates system. I'll treat the two planning docs as history and check `PROJECT-STATUS.md` before assuming any of their items are outstanding (as your instructions say).

---

## 3. My understanding of current state (from the files)

**The platform:** selattm.com — Firebase Hosting, Firestore (`australia-southeast1`), Firebase Auth, `firestore-stripe-payments` extension. Firebase project `selattm-ba765`.

**People:** Craig Sanders (governance/commercial) and Joseph Rosendaal (technical roading/course delivery, hands-on testing). Both are admins via the `admins` collection (added by script, 27 Aug).

**Five live courses, five different architectures:**

| Course | Architecture | Status per files |
|---|---|---|
| PTS-01 (Portable Traffic Signals) | Legacy multi-page | Migrated onto shared course kit (38 files). Completion-save bug fixed. |
| ASHTAS-01 | Real SCORM package (Moodle) | Header/footer via `ashtas-header.js` (62 pages). Not on Firestore results by design. |
| NZGTTM Essentials | Single-page app | Mobile already fine. Firebase import path bug fixed. |
| TTM Engineering Essentials | Narrated slide deck | Mobile CSS fix added. Import path bug fixed. |
| TTM Roles & Responsibilities | New video-based version | Replaced old course; folder `nzgttm-roles-responsibilities`, price `price_1UBSfH0flJvw3UeN8pTPATze` ($55 + GST). |

**Last recorded to-do for Craig (as of 4 Sept):**
1. `git add` the changed files
2. `git commit -F .git-commit-msg.txt`
3. `git push`
4. `firebase deploy --only hosting`
5. Spot-check on a phone: PTS-01, ASHTAS-01, TTM Engineering Essentials; confirm PTS-01 completion still records to Firestore.
6. Confirm the import-path fix for the three SPA courses is live and working.
7. Confirm the Stripe payout bank account correction is completed and verified.

*Note: the Session Summary says the course work was "confirmed committed and pushed", while PROJECT-STATUS says "not committed yet". Worth confirming which is true — and whether the deploy has happened.*

**Open items from the console log:**
- `www.selattm.com` still not added as a custom domain in Firebase Hosting (only the bare domain works).
- Known risk: `store.html` doesn't filter by `status`, so a draft course with a placeholder price could be purchasable if synced.

**Working rules I'll follow:**
- Never run `git commit` or set a git identity. Stage changes, write the message to `.git-commit-msg.txt`, Craig commits/pushes/deploys.
- Check `PROJECT-STATUS.md` first before assuming state.
- New courses must follow `COURSE-BUILD-SPEC.md`.
- Always verify `firebase-init.js` relative import depth, and confirm with a live console check, not just `node --check`.
- Console-side changes get an entry in `MANUAL-CHANGES-LOG.md`.

---

## 4. Quick checklist for you

- [ ] Seven files listed above match what you meant to attach
- [ ] `FIRESTORE-LOCKDOWN-PLAN_1.md` is the latest version
- [ ] Decide whether the desktop bridge should be connected for this project
- [ ] Decide whether to add the company documents
- [ ] Confirm whether the 4 Sept commit/push/deploy has happened
- [ ] Tell me anything done since 4 Sept so PROJECT-STATUS can be updated
