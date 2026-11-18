# NZGTTM-TLD-01 — TMP Layouts and Dimensions

Built 18 Nov 2026 with the same generator as RA-01 and VRU-01. Status: **slides built, not narrated, not on sale**.

- 28 slides in 6 modules (M1 1–4, M2 5–9, M3 10–14, M4 15–20, M5 21–24, M6 25–28), 6 knowledge checks (26 questions), final assessment drawing 15 from a bank of 30 (≥2 per module, answers shuffled).
- Every slide has an animated plan-view diagram (`img/scenes/`). Activities: 4 reaction-time, 9 pick a speed, 14 size the zone, 20 tapers on curves, 24 which method, 26 find the five errors, 27 capstone (80 km/h lane closure).
- Same features as RA-01/VRU: Next locked until each slide is read (reading timer until narration is added), modules unlock in order, results to admin via complete.html.
- Catalog: `nzgttm-tld-01`, $175, `visibility: private`, no Stripe price — hidden from the store; admins can grant it to test.

## Narration
Scripts: `TLD-Module-1…6-narration-scripts.txt` (about 3,600 words, ~26 min). Record slideN.m4a per slide; slide 1 can be a welcome video (welcome.mp4). Send them to Claude to convert and wire in (same as VRU).

## Numbers
From NZGTTM *Basis of dimensions*. Where slides show calculated values (stopping distances, lateral zones, sign spacing) they say so and tell learners to use the rounded NZGTTM table values. Worth a check against the current NZGTTM table before narration.

## To put it on sale (Craig)
Create a $175 NZD price in Stripe, set `stripePriceId`, remove `"visibility": "private"` in both `courses-import.json` and the course manifest, add a store card if wanted, then `node build-all.js`, `node scripts/sync-courses.js`, `firebase deploy --only hosting`.
