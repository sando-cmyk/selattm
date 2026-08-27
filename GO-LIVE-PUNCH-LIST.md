# Go-Live Punch List

**Prepared for:** Craig
**Project:** SELA TTM (selattm-ba765)
**Checked against:** the live site + current working files, just now

Not the full rebuild — just what it takes to take one real payment for the one real course, today, with nothing further built after this.

## Bottom line

**Not sellable yet — but for a different reason than last time.** The Firestore rules fix from the last plan is already in your working files, which is real progress. But the site's changed since then, and two new problems now block revenue entirely: the "Enroll & Launch" button is wired to a function that doesn't exist, so **checkout does nothing when clicked** — no error, it just sits there. And separately, the learner area no longer checks whether anyone paid before handing out the course link, so **even once checkout is fixed, nothing stops a visitor from getting the course for free** by going straight to the learner page.

Both are small, specific fixes — not a rebuild. Laid out below in the order to do them in.

---

## 1. Checkout is wired to a function that doesn't exist

**Blocks every sale** · `public/store.html` + `public/js/stripe-service.js`

Clicking "Enroll & Launch" on the live store page runs this:

```js
// public/store.html (current)
const stripeMod = await import("./js/stripe-service.js");
if (stripeMod && stripeMod.createCheckoutSession) {
  await stripeMod.createCheckoutSession(courseId);
}
```

`stripe-service.js` doesn't export a function called `createCheckoutSession` — it exports one called `initiateCheckout`. So that `if` is always false, nothing runs, and nothing throws either — the button just says "Connecting..." forever with no error, which is worse than a crash because there's nothing in the console pointing at why. **This is the reason no payment can currently complete, full stop.**

Two things need to change together — the function name, *and* what gets passed to it. `initiateCheckout` expects a real Stripe Price ID (looks like `price_1AbC...`), not the course's own id like `"ashtas-01"`. That price ID has to come from somewhere real first:

1. In the Stripe Dashboard (or via the Firestore-Stripe extension's product sync, if that's already set up), confirm there's a real Product + Price for ASHTAS-01 at $250 NZD. Copy its Price ID.
2. Add that Price ID as a field on the course's Firestore document — e.g. `stripePriceId: "price_1AbC..."` — right next to the other fields when you add the course by hand.
3. Update `store.html` to read and use that field instead of the course id:

```js
// public/store.html — two spots

// where the Firestore-rendered cards are built:
// BEFORE:
// <button class="btn-enroll" data-id="${docSnap.id}" data-title="${title}">
// AFTER:
// <button class="btn-enroll" data-id="${docSnap.id}" data-price-id="${course.stripePriceId || ''}" data-title="${title}">

// in the click handler:
// BEFORE:
const courseId = e.currentTarget.dataset.id;
const courseTitle = e.currentTarget.dataset.title;
try {
  button.disabled = true;
  button.textContent = "Connecting...";
  const stripeMod = await import("./js/stripe-service.js");
  if (stripeMod && stripeMod.createCheckoutSession) {
    await stripeMod.createCheckoutSession(courseId);
  }
}

// AFTER:
const priceId = e.currentTarget.dataset.priceId;
const courseTitle = e.currentTarget.dataset.title;
if (!priceId) {
  alert(courseTitle + " isn't available for purchase yet (no price configured).");
  return;
}
try {
  button.disabled = true;
  button.textContent = "Connecting...";
  const stripeMod = await import("./js/stripe-service.js");
  await stripeMod.initiateCheckout(priceId, (msg) => { button.textContent = msg; });
}
```

The three hardcoded fallback cards at the top of `store.html` (the ones that render instantly before Firestore loads) should either get a real `data-price-id` too, or — simpler — just delete the TTM-01 and TTM-02 fallback cards entirely per the "worth knowing" section below, and only keep ASHTAS-01's, with its real price id filled in.

---

## 2. Nobody has to pay — the learner page hands out every course to everyone

**Makes checkout pointless even once fixed** · `public/learner.html`

This one's more serious than it looks. The current `learner.html` doesn't check who's signed in, and doesn't check whether they've paid — it just lists every course document in Firestore and gives everyone a live "Launch Module" link straight into the course content:

```js
// public/learner.html (current) — no gate at all
onAuthStateChanged(auth, (user) => {
  loadLearnerModules(user);  // runs even when user is null -- no login required
});

// loadLearnerModules() renders every course from Firestore/JSON/fallback
// with a working "Launch Module" link -- no purchase check anywhere
```

Anyone who finds `/learner.html` — no account, no payment — gets a working link into the course. Worth being direct about the ceiling here: even after this is fixed, the course content itself is a plain static file on Firebase Hosting (`/courses/ashtas-01/index.html`), and static files aren't secret — someone who already has that exact URL could still open it directly. Properly locking that down needs a real access check on the file itself (a Cloud Function or Storage rule), which is genuine further development and not worth doing for an interim revenue push. What *is* worth fixing now is making sure the **normal path** — the one every real customer actually takes — requires signing in and paying first. That closes it for everyone except someone who deliberately goes hunting for a bare URL, which is a reasonable risk to accept for now.

```js
// public/learner.html — replace the auth/load section
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) {
    window.location.replace("login.html");
    return;
  }

  // Only courses this person has actually paid for
  const paidSnap = await getDocs(
    query(collection(db, "customers", user.uid, "payments"), where("status", "==", "succeeded"))
  );
  const paidCourseIds = new Set();
  paidSnap.forEach(d => { const p = d.data(); if (p.courseId) paidCourseIds.add(p.courseId); });

  loadLearnerModules(user, paidCourseIds);
});

// in loadLearnerModules(), after fetching the full course list:
const owned = live.filter(c => paidCourseIds.has(c.id));
renderModules(owned);  // only what they paid for, not the whole catalog
```

This assumes the Stripe extension writes a `courseId` field onto the payment record it creates — worth a quick check the first time a real purchase completes (see the test checklist below). If it doesn't come through automatically, the price-to-course mapping can be looked up from the `price` field on the payment instead — flag it back to me if the first test purchase doesn't show up correctly and I'll adjust this.

---

## Confirm these before taking real money

Not code — things to check are actually true, since I can't see your Firebase or Stripe dashboards from here:

| Check | Where |
|---|---|
| The rules file in your working folder is actually the one live on Firestore — editing the local file alone changes nothing until it's deployed. | Firebase Console → Firestore Database → Rules tab — check the "last published" timestamp |
| Your own UID has a document in the `admins` collection (from the last plan) — without it, you can't add courses through the admin panel, though adding them by hand in the Console works regardless. | Firebase Console → Firestore Database → `admins` collection |
| The Stripe extension is installed and **Active**, with real (not placeholder) Stripe API keys attached, and you're clear on whether it's in Stripe test mode or live mode. | Firebase Console → Extensions |
| A real Product + Price exists in Stripe for ASHTAS-01 at the price you want to charge. | Stripe Dashboard → Products |

---

## Worth knowing, not worth fixing today

- **Only ASHTAS-01 has real course content.** TTM-01 and TTM-02's launch links both point at the ASHTAS-01 files. Don't add those two to the catalog until there's real content behind them — selling a course you can't deliver is a refund and a complaint waiting to happen. When you add courses by hand, just add the one that's real.
- **Nothing records who passed or failed.** The ASHTAS-01 package is a self-contained SCORM course with its own local completion screen — it was never wired up to write a result anywhere, and the earlier code that used to do that (`app.js`) has since been deleted. So right now a completed course produces no certificate and no record in Firestore. For an interim batch of sales, the low-effort workaround is manual: ask the learner to screenshot their completion screen and email it, and issue a certificate by hand. Building real completion tracking is a fair chunk of work — save it for the ground-up rebuild.
- **New sign-ups don't get a profile document created anymore.** Registering just makes the login account; nothing saves their name or employer anywhere. Doesn't block a sale, but means you won't have that info later unless you collect it separately (e.g. at checkout, or ask for it when you manually issue their certificate).

---

## Test before announcing it's live

- [ ] Buy the course yourself, real card, real browser, incognito window (so you're not accidentally already signed in as an existing account).
- [ ] Confirm you land back on `learner.html` after payment and the course you just bought is the *only* one listed.
- [ ] Open a second, fully separate browser (or ask someone else to try), sign up fresh, and confirm `learner.html` shows nothing until they pay.
- [ ] Click "Launch Module" and confirm the actual SCORM course opens and plays through to the completion screen.
- [ ] Check the payment actually shows up in your Stripe Dashboard, correctly priced, correctly in live (not test) mode if that's what you intend.

---

*SELA TTM — go-live check · selattm-ba765*
