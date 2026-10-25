// ============================================================================
// File: public/js/sequence-guard.js
// Loaded on every course page (via home-button.js). If an admin has set this
// learner's courses to be completed in order and this course isn't unlocked
// yet, cover the page with a short explanation and a link back to Your Courses.
// ============================================================================
import { auth, onAuthStateChanged } from "./firebase-init.js";
import { courseForPath, titleFor } from "./course-map.js";
import { loadSequence } from "./course-sequence.js";

const stop = onAuthStateChanged(auth, async (user) => {
  stop();
  if (!user || user.isAnonymous) return;
  const course = courseForPath();
  const seq = await loadSequence(user);
  const prev = seq.blockedBy(course.courseId);
  if (!prev) return;

  const show = () => {
    const o = document.createElement("div");
    o.id = "sela-sequence-lock";
    o.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.94);display:flex;align-items:center;" +
      "justify-content:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";
    o.innerHTML = `<div style="background:#1e293b;color:#f8fafc;border-radius:12px;max-width:440px;width:100%;padding:28px 24px;text-align:center;
      border:1px solid rgba(255,255,255,.15);">
      <div style="font-size:2rem;">&#128274;</div>
      <h2 style="margin:8px 0 10px;font-size:1.25rem;">This course isn't unlocked yet</h2>
      <p style="color:#cbd5e1;line-height:1.5;margin:0 0 18px;">Your training plan has your courses in a set order.
        Please complete <strong></strong> first.</p>
      <a href="/learner.html" style="display:inline-block;background:#22c55e;color:#0f172a;font-weight:700;text-decoration:none;
        padding:11px 20px;border-radius:8px;">Go to Your Courses</a></div>`;
    o.querySelector("strong").textContent = titleFor(prev);
    document.body.appendChild(o);
  };
  if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
});
