# Firestore Lockdown Plan

**Prepared for:** Craig & the dev team
**Project:** SELA TTM (selattm-ba765)
**Status:** Ready to implement

Right now any signed-in visitor — not just admins — can rewrite the course catalog, read user profiles and workers' quiz results, and the admin console has no lock on its front door. This is the fix, in order, with the exact code for each step.

Short version: the app's Firestore security rules — the layer that decides who is allowed to read or write which data — are wide open. Anywhere the front-end checks "is this person an admin," it's reading a field the visitor themself can edit, which means the check can be switched on from the browser console. That one gap is the root cause behind almost everything below, including why the admin panel can't safely be trusted with course publishing yet.

Nine changes, ordered by how urgently they matter. 1–3 are the actual lock. 4 is what makes "admin adds a course" work at all right now — turns out it currently doesn't reach customers even when it succeeds. 5–8 are cleanup that will stop the next edit from breaking the wrong copy of a file. 9 is how to prove it all worked before calling it done.

## Contents

1. [Rewrite the Firestore security rules](#1-rewrite-the-firestore-security-rules) — **Critical**
2. [Create the admins collection](#2-create-the-admins-collection) — **Critical**
3. [Put a lock on admin.html itself](#3-put-a-lock-on-adminhtml-itself) — **Critical**
4. [Make the storefront actually read published courses](#4-make-the-storefront-actually-read-published-courses) — **High**
5. [Stop trusting users/{uid} for role checks](#5-stop-trusting-usersuid-for-role-checks) — **High**
6. [Fix the broken course-catalog files](#6-fix-the-broken-course-catalog-files) — **Medium**
7. [Pick one navigation system](#7-pick-one-navigation-system) — **Medium**
8. [Retire the dead files](#8-retire-the-dead-files) — **Medium**
9. [Prove it, then ship](#9-prove-it-then-ship) — **Verify**

## What's actually broken, at a glance

| Collection / page | Current rule | Real-world effect |
|---|---|---|
| `courses` | write: any signed-in user | Any registered account can overwrite the entire catalog — price, content, launch links. |
| `users/{uid}` | read/write: anyone, no login needed | Anyone can edit any profile — including setting their own `role: "admin"`. |
| `system_admins` | write: any signed-in user | Any account can add itself to the admin roster. Also unused by any code — dead weight. |
| `submissions` | read/write: anyone, no login needed | Every worker's quiz score, employer and signature image is world-readable. |
| `contact_inquiries` | no rule at all | Default-deny. The public contact form has been silently failing on every submit. |
| `admin.html` | no login check on the page | The ops console renders for anyone who finds the URL, logged in or not. |

**One decision worth confirming** before the dev starts: is the "admins collection, edited by hand in the Console" approach below the right level of ceremony for now, versus Firebase custom claims (see the box in §2)? The other open question from an earlier pass of this plan — whether enterprise managers should see raw quiz/submission data — is now settled: `submissions` stays admin-only, and employer-facing reporting is handled as a managed service rather than self-serve. That's reflected below and doesn't need any extra code beyond what's already in §1.

---

## 1. Rewrite the Firestore security rules

**Critical** · `firestore.rules`

This is the actual lock. Everything else in this document either depends on it or is cosmetic without it. Replace the whole file with the version below.

What changed and why, collection by collection:

- **New `admins` collection** — a document existing at `admins/{uid}` is what makes someone an admin. Nothing in the client app can create, edit, or delete these documents — only the Firebase Console (or a script run with elevated credentials) can. That's the whole fix: the on/off switch moved somewhere the visitor can't reach.
- **`courses` and `coupons`** — writes now require the caller's UID to have a document in `admins`. Reads stay public, since the storefront needs to be world-readable.
- **`users/{uid}`** — now owner-only, both read and write. No more open door.
- **`system_admins`** — removed. It was unused by any code path and duplicated what `admins` now does properly. See §8.
- **`submissions`** — a worker can create their own record and read only their own record; only admins can read everyone's. Confirmed: quiz/submission data stays admin-only, employer reporting is a managed service (see §5).
- **`contact_inquiries`** — added. It never had a rule, so the public contact form has been failing on every submission. This makes it work: anyone can submit, only admins can read the list.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // -- helpers --------------------------------------------------
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // -- admin roster ----------------------------------------------
    // A doc existing here is what makes a uid an admin. Never
    // writable from the client -- add/remove admins from the
    // Firebase Console only (see step 2 below).
    match /admins/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    // -- user profiles -----------------------------------------------
    // Owner only. Nobody, including other logged-in users, can read
    // or edit a profile that isn't their own.
    match /users/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;

      match /enrolled_courses/{courseId} {
        allow read, write: if isSignedIn() && request.auth.uid == uid;
      }
      match /enrollments/{courseId} {
        allow read, write: if isSignedIn() && request.auth.uid == uid;
      }
    }

    // -- catalog + promotions -- admin write, public read -----------
    match /courses/{courseId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /coupons/{code} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // -- billing (Stripe extension) -- owner only --------------------
    match /customers/{uid} {
      allow read, write: if isSignedIn() && request.auth.uid == uid;

      match /checkout_sessions/{sessionId} {
        allow read, write: if isSignedIn() && request.auth.uid == uid;
      }
      match /payments/{paymentId} {
        allow read: if isSignedIn() && request.auth.uid == uid;
      }
    }

    // -- quiz / assessment records ------------------------------------
    // A worker can log and read their own result. Only admins can
    // read the full set -- confirmed: quiz/submission data stays
    // admin-only, employer reporting is a managed service (see §5).
    match /submissions/{subId} {
      allow create: if isSignedIn() &&
        request.resource.data.userId == request.auth.uid;
      allow read: if isSignedIn() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }

    // -- public contact form -- previously had NO rule at all,
    // i.e. every submission has been silently rejected -----------
    match /contact_inquiries/{inquiryId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

> **Deploy note:** Rules deploy separately from the site. `firebase deploy --only firestore:rules` — a normal `firebase deploy` or `firebase deploy --only hosting` will **not** push this file. Easy to edit the file, deploy the site, and assume the rules are live when they aren't.

---

## 2. Create the admins collection

**Critical**

The rules above check for a document at `admins/{your-uid}`. It doesn't exist yet, so as soon as step 1 deploys, *nobody* can write courses — including you. This step fixes that, and it's pure Firebase Console clicking, no code, so Craig can do this part directly if he'd rather not wait on the dev:

1. Firebase Console → Firestore Database → find your own user document under `users` (the screenshot you sent shows it — `uid: MUzU8TiavXMJMzGh7psCpc2DM0q1`).
2. Click **Start collection**, name it exactly `admins`.
3. For the first document's ID, paste that same UID: `MUzU8TiavXMJMzGh7psCpc2DM0q1`. The document's ID *is* the whole check — it doesn't need any fields inside it, though adding `addedBy` and a timestamp for your own records is fine.
4. Save. Repeat for any other person who should have admin rights, one document per UID.

> **Why not just fields on users/{uid}?** That's exactly today's setup, and it's the vulnerability — a document the visitor can edit can't also be the thing that decides what they're allowed to edit. Nothing about `role: "admin"` or `isAdmin: true` on a `users` document should be trusted for authorization ever again, even after step 1 locks that document to owner-only — "owner" still means the visitor themself.

### Custom claims — the more bulletproof alternative

The `admins` collection above is the right amount of infrastructure for where this project is today: no server code to maintain, admin changes take effect instantly, and Craig can manage the roster himself from the Console. The more locked-down alternative is Firebase *custom claims* — a flag baked directly into the person's login token by a Cloud Function or an admin script, which even a compromised Firestore rule can't fake. It's worth moving to once there's a real back end for other reasons (e.g. sending certificates by email, syncing Stripe products) — standing one up just for this one flag isn't worth it yet. Worth revisiting if the platform scales past a handful of trusted admins.

---

## 3. Put a lock on admin.html itself

**Critical** · `public/js/admin-app.js`

Right now `admin.html` loads its dashboard for anyone who opens the URL — no login check, no role check. `enterprise.html` and `learner.html` already do this correctly; give `admin-app.js` the same pattern at the very top of the file, before anything else runs:

```js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) {
    document.body.innerHTML = '<div style="padding:4rem;text-align:center;font-family:sans-serif;">' +
      '<h2>Sign in required</h2><p>This console is restricted to administrators. <a href="login.html">Sign in</a>.</p></div>';
    return;
  }

  const snap = await getDoc(doc(db, "admins", user.uid));
  if (!snap.exists()) {
    document.body.innerHTML = '<div style="padding:4rem;text-align:center;font-family:sans-serif;">' +
      '<h2>Access restricted</h2><p>Your account does not have administrator access.</p></div>';
    return;
  }

  // only reached by a confirmed admin -- safe to boot the dashboard
  refreshAdminDashboard();
});
```

Because it now calls `refreshAdminDashboard()` itself once the check passes, remove the old unconditional `document.addEventListener("DOMContentLoaded", () => { refreshAdminDashboard(); ... })` call at the bottom of the file — keep the "Reload Cloud Data" button's own click handler, just drop the auto-run on load.

> **Belt and braces:** This is a UX gate, not the security boundary — that's the Firestore rules from step 1. Someone could still view the page's HTML and JS with the console open. That's fine: with step 1 deployed, any write they attempt fails server-side regardless of what the page shows them. This step just stops a non-admin from seeing the ops dashboard and its data at all.

---

## 4. Make the storefront actually read published courses

**High**

This is the one that matters most for what you actually asked for: once 1–3 are done, an admin can safely publish a course through the console. Right now that still wouldn't reach a customer. Traced it through — `store.html` has its own inline catalog script (not the separate `store-app.js` file, which isn't loaded by anything) and it only ever reads the static file `public/data/courses.json`, with a hardcoded fallback array if that fetch fails. It never queries Firestore. Same story in `learner.html`. So the `courses` collection the admin panel writes to is currently a dead end — nothing customer-facing looks at it.

The fix: make Firestore the source of truth, with the static JSON only as an offline/first-paint fallback.

```js
// public/store.html — replace the catalog-loading block

// BEFORE:
// 1. Render immediate fallback instantly (zero UI delay)
render(FALLBACK_COURSES);

// 2. Asynchronously attempt to load fresh JSON from data/courses.json
fetch("/data/courses.json", { cache: "no-cache" })
  .then(res => res.ok ? res.json() : Promise.reject())
  .then(data => { if (Array.isArray(data) && data.length > 0) render(data); })
  .catch(err => console.log("[Store] Running on active fallback catalog:", err.message));


// AFTER:
// 1. Render immediate fallback instantly (zero UI delay)
render(FALLBACK_COURSES);

// 2. Firestore is the source of truth -- this is what admin.html writes to
import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
  .then(({ getFirestore, collection, getDocs }) => {
    const db = getFirestore();
    return getDocs(collection(db, "courses"));
  })
  .then(snap => {
    if (!snap.empty) {
      const live = [];
      snap.forEach(d => live.push({ id: d.id, ...d.data() }));
      render(live);
      return;
    }
    // Firestore reachable but empty -- fall back to the static file
    return fetch("/data/courses.json", { cache: "no-cache" })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { if (Array.isArray(data) && data.length > 0) render(data); });
  })
  .catch(err => console.log("[Store] Firestore unreachable, static/local fallback stays up:", err.message));
```

Apply the same swap in `learner.html`'s catalog fetch (it currently does `fetch("data/courses.json")` directly — point it at Firestore first, same pattern). Once this is in, the loop actually closes: admin publishes a course in `admin.html` → it lands in `courses` → the store and learner hub both pick it up live, no redeploy needed.

---

## 5. Stop trusting users/{uid} for role checks

**High**

Three files currently decide "is this an admin / enterprise manager" by reading `role` or `isAdmin` off the visitor's own `users` document: `js/navigation.js`, `learner.html`, and `enterprise.html`. Step 1 makes that document owner-only, which stops *other* people from editing it — but the owner can still edit their own copy, so the field itself must stop being the source of truth. Swap each of these to check the `admins` collection from step 2 instead:

```js
// js/navigation.js — inside the onAuthStateChanged callback

// BEFORE:
let isAdmin = false;
try {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.exists() ? userDoc.data() : {};
  isAdmin = data.role === "admin" || data.isAdmin === true;
} catch (e) {}

// AFTER:
let isAdmin = false;
try {
  const adminDoc = await getDoc(doc(db, "admins", user.uid));
  isAdmin = adminDoc.exists();
} catch (e) {}
```

Same pattern in `learner.html` (the `isAdmin` line that decides which courses show in the learner's hub) and in `enterprise.html`'s `isAuthorised` check.

> **Open question:** `enterprise.html` currently also grants access to anyone with `role === "enterprise"` — company account managers, not just admins. That role has the exact same problem as `isAdmin` did: it lives on a self-editable document. A quick interim fix is to fold enterprise managers into the same `admins`-style pattern (e.g. an `enterprise_managers/{uid}` collection you seed by hand per company, same as step 2). This is now purely about the *seat-allocation* side of the portal ("assign training seats to my workforce") — quiz/submission visibility is settled below and isn't part of this question. Flagging rather than folding it into this plan, since it touches how you want to onboard corporate clients — worth a short conversation before the dev builds it.

### Employer compliance reporting — now a managed service, not a feature

Decided: enterprise managers won't get direct read access to `submissions`. Instead, when an employer wants a compliance report, someone at SELA pulls it from the admin console and sends it over — which, done right, reads as white-glove service rather than a missing feature, and it's the safer default while the platform is young. Nothing further needs building for this to work: admins already have full read access to `submissions` under §1's rules, and `admin-app.js` already has a table pattern (the inquiries panel) that a "generate report for &lt;employer&gt;" view could reuse later if this turns into a high-volume task worth speeding up.

> **Optional, later:** If report requests start arriving by phone or email and get hard to track, the natural next step is a small `report_requests` collection — an enterprise manager submits one via a form (create-only, same pattern as `contact_inquiries` in §1), it shows up in a queue in `admin.html` next to the existing inquiries panel, admin marks it fulfilled once the report's sent. Fifteen minutes of work once §1–3 are in, reusing patterns already in this plan. Not needed today — just flagging that the plumbing for "make it a task" is already half-built if you want it.

---

## 6. Fix the broken course-catalog files

**Medium**

Two problems in the static catalog files, independent of everything above:

- `public/data/courses.json` is malformed — it's an array containing one array (`[[ {...} ]]` instead of `[ {...} ]`), and only has one stale course in it. Anything reading it gets an inner array where it expects a course object, which is why fields render blank/zero on the pages that still use this file as a fallback.
- `public/courses/courses.json` — a second, different catalog file sitting next to the ASHTAS SCORM package — has actually invalid JSON in it (`"price": 450.00, shame: "NZD",` — an unquoted stray key). Nothing in the code currently reads this file, so it's silently broken and orphaned rather than causing visible errors, but it should either be fixed or deleted so nobody mistakes it for the real catalog later.

Recommend: delete `public/courses/courses.json` (it's dead, and its existence next to the real one is exactly the kind of file that gets edited by mistake), fix the nesting bug in `public/data/courses.json`, and once step 4 is live, treat that JSON file purely as a last-resort offline fallback — regenerate it occasionally from the Firestore catalog rather than hand-editing it.

---

## 7. Pick one navigation system

**Medium**

There are two separate header/nav implementations in the codebase: `js/navigation.js` (used by `index.html`, `about-us.html`, `store.html`, `contact.html`, `login.html`, `learner.html`, `admin.html`) and `js/site-layout.js` + `js/auth-context.js` (not currently wired into any live page — see step 8). The live one, `navigation.js`, already does the right thing — it only shows the "Admin" link when `isAdmin` is true. The dormant one shows an "Administration" tab to *every* visitor unconditionally, admin or not. Since it's not currently loaded anywhere it's not an active bug, but it's exactly the kind of leftover that causes confusion during a rebuild or a copy-paste into a new page. Keep `navigation.js` as the one nav system; remove the other per step 8.

---

## 8. Retire the dead files

**Medium**

Checked every HTML page's actual script tags against every file in `public/js/` and `public/app.js`. These files are still sitting in the deployed `public/` folder but aren't loaded by any current page — safe to delete, and worth doing so the next round of edits can't land in a file that doesn't run:

| File | What it was |
|---|---|
| `public/app.js` | An earlier, monolithic build of the whole site — compliance matrix, Moodle importer, cert generator, signature pad. Superseded by the current per-page modules. Its git history is where the anonymous-sign-in workaround came from (see note below). |
| `js/site-layout.js` | Alternate header/footer builder from an earlier design pass. See step 7. |
| `js/auth-context.js` | Modal-based sign-in flow that belonged to the `site-layout.js` build. |
| `js/enterprise-app.js` | Data layer for the compliance matrix; superseded by the inline script in `enterprise.html`, which doesn't reimplement this feature (and per §5, won't need to). |
| `js/player-app.js` | Course-player controller, not referenced by the current `/courses/ashtas-01/` package (which has its own local scripts). |
| `js/store-app.js` | A cleaner, already-Firestore-aware version of the storefront logic — ironically closer to correct than the inline script actually running in `store.html`. Worth diffing against step 4's change before deleting, in case it's easier to just wire this file in instead. |
| `js/learner-app.js` | Same situation as above, for the learner hub. |
| `js/certificate.js`, `js/moodle-parser.js` | Helpers used only by `app.js`. |

> **Worth knowing:** One commit in `app.js`'s history is literally titled *"fix: auto-authenticate anonymously to authorize Firestore writes."* That's a real trace of someone hitting a Firestore permission error and working around it with an anonymous sign-in rather than fixing the rule — which is a big part of how the rules ended up this open. Good to know for context, not something that needs action beyond deleting the file.

---

## 9. Prove it, then ship

**Verify**

Once 1–4 are deployed, confirm each of these before calling it done — the first three are the ones that actually matter, since they prove the lock holds from the outside, not just that the app's own UI hides a button:

- [ ] Register a brand-new, non-admin account. Open the browser console on any page and try `setDoc(doc(db,"courses","test"), {title:"x"})` directly — this must fail with `permission-denied`.
- [ ] With that same non-admin account, try writing to your own `users/{uid}` doc setting `role: "admin"` — this should succeed (it's your own profile) but must have *no effect* anywhere in the app, since nothing reads that field for authorization anymore.
- [ ] Visit `/admin.html` logged out, and again logged in as a non-admin — both should show the restricted message, not the dashboard.
- [ ] Log in as an actual admin (your seeded UID) and confirm the bulk CSV/JSON upload on `admin.html` still works.
- [ ] After that upload, reload `store.html` in a private window and confirm the new course appears without a redeploy.
- [ ] Submit the public contact form on `contact.html` and confirm it now succeeds (previously silently failing — step 1).
- [ ] Have a non-admin learner complete a quiz and confirm their result still saves, and that they can't read any other worker's submission by UID-guessing in the console.

---

*SELA TTM — access control remediation · selattm-ba765*
