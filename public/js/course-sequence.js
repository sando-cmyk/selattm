// ============================================================================
// File: public/js/course-sequence.js
// The learner's course order, set by an admin in admin.html (Learners ->
// View -> Courses & completion order) and stored at learner_plans/{email}.
// When enforceOrder is on, a course is locked until every course before it
// in courseSequence has been passed (a passed result in "submissions").
// ============================================================================
import { db, doc, getDoc, getDocs, collection } from "./firebase-init.js";
import { query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { catalogIdFor } from "./course-map.js";

export async function loadSequence(user) {
  const email = String(user.email || "").trim().toLowerCase();
  let plan = null;
  try {
    const s = await getDoc(doc(db, "learner_plans", email));
    if (s.exists()) plan = s.data();
  } catch (e) { console.warn("[sequence] plan lookup failed:", e.message); }

  const passed = new Set();
  try {
    const snap = await getDocs(query(collection(db, "submissions"), where("userId", "==", user.uid)));
    snap.forEach(d => { const r = d.data(); if (r.passed !== false) passed.add(catalogIdFor(r)); });
  } catch (e) { console.warn("[sequence] results lookup failed:", e.message); }

  const order = plan && Array.isArray(plan.courseSequence) ? plan.courseSequence : [];
  const enforce = !!(plan && plan.enforceOrder && order.length);

  // Returns the id of the first earlier course not yet passed, or null.
  function blockedBy(courseId, ownedIds) {
    if (!enforce) return null;
    const idx = order.indexOf(courseId);
    if (idx <= 0) return null;
    for (const prev of order.slice(0, idx)) {
      if (ownedIds && !ownedIds.includes(prev)) continue; // no longer assigned -> ignore
      if (!passed.has(prev)) return prev;
    }
    return null;
  }
  return { order, enforce, passed, blockedBy };
}
