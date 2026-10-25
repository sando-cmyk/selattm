// ============================================================================
// File: public/js/last-seen.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Records when a signed-in learner was last on the site, for the
//              admin Learners panel. Loaded by navigation.js (every site page)
//              and by home-button.js (every course page). Writes at most once
//              every 5 minutes per browser to keep Firestore writes low.
//   users/{uid}.lastSeenAt     -- last time they were active on the site
//   users/{uid}.lastSeenPage   -- the page they were on
//   users/{uid}.lastSignInAt   -- last actual sign-in (from Firebase Auth)
// ============================================================================

import { auth, db, doc, setDoc, onAuthStateChanged } from "./firebase-init.js";

const KEY = "sela_last_seen_write::v1";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) return;
  try {
    const last = Number(localStorage.getItem(KEY + "::" + user.uid) || 0);
    if (Date.now() - last < 5 * 60 * 1000) return;
    localStorage.setItem(KEY + "::" + user.uid, String(Date.now()));
  } catch (_) {}
  try {
    const signIn = user.metadata && user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : null;
    await setDoc(doc(db, "users", user.uid), {
      email: (user.email || "").toLowerCase(),
      lastSeenAt: new Date().toISOString(),
      lastSeenPage: location.pathname,
      ...(signIn ? { lastSignInAt: signIn } : {}),
    }, { merge: true });
  } catch (e) {
    console.warn("[last-seen] not recorded:", e && e.message);
  }
});
