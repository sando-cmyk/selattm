// ============================================================================
// File: public/js/attempt-logger.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Records EVERY quiz / test attempt (pass or fail) to the
//              Firestore "attempts" collection so admin.html can show a
//              learner's full history. Course pages call it with one line:
//
//   import("/js/attempt-logger.js").then(m => m.logAttempt({ quizId, score, total, passed }));
//
//   score/total are raw counts (or pass percent:true with score = percent).
//   The course is worked out from the page URL (see COURSES below).
// ============================================================================

import { auth, db, addDoc, collection, onAuthStateChanged } from "./firebase-init.js";
import { courseForPath as currentCourse } from "./course-map.js";

function signedInUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, u => { stop(); resolve(u); });
    setTimeout(() => resolve(auth.currentUser), 8000);
  });
}

// Result screens can re-render (e.g. revisiting the slide), so the same
// result is only logged once per 5 minutes.
function isDuplicate(key) {
  try {
    const now = Date.now();
    const seen = JSON.parse(localStorage.getItem("sela_attempts_seen::v1") || "{}");
    Object.keys(seen).forEach(k => { if (now - seen[k] > 5 * 60 * 1000) delete seen[k]; });
    if (seen[key]) return true;
    seen[key] = now;
    localStorage.setItem("sela_attempts_seen::v1", JSON.stringify(seen));
  } catch (_) {}
  return false;
}

export async function logAttempt({ quizId = "final", score, total, passed, percent = false } = {}) {
  try {
    const course = currentCourse();
    const pct = percent ? Math.round(Number(score)) : (total ? Math.round((Number(score) / Number(total)) * 100) : null);
    if (isDuplicate(`${course.courseId}|${quizId}|${score}|${total}|${passed}`)) return;

    const user = await signedInUser();
    if (!user || user.isAnonymous) return; // only signed-in learners are tracked

    await addDoc(collection(db, "attempts"), {
      userId: user.uid,
      email: (user.email || "").toLowerCase(),
      ...course,
      quizId: String(quizId),
      score: percent ? null : Number(score),
      total: percent ? null : Number(total),
      scorePercent: pct,
      passed: !!passed,
      attemptedAt: new Date().toISOString(),
      page: location.pathname,
    });
  } catch (e) {
    console.warn("[attempts] not recorded:", e && e.message);
  }
}
