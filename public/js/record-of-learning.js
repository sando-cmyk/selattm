// ============================================================================
// File: public/js/record-of-learning.js
// Project: Sela Skills Hub (Sela Civil Advisory Ltd)
// Learner-downloadable "Record of Learning" PDF for a completed course:
// learner name, course, completion date, result, certificate number (if
// issued) and what the course covered and the learner demonstrated (from
// js/course-summaries.js). Used by learner.html (Your Courses).
// Needs jsPDF on the page (window.jspdf), loaded from cdnjs.
// ============================================================================

import { db, doc, getDoc, getDocs, collection } from "./firebase-init.js";
import { query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COURSE_SUMMARIES } from "./course-summaries.js";
import { catalogIdFor } from "./course-map.js";

async function imageDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const fmt = iso => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "--";

export async function downloadRecordOfLearning({ user, courseId, courseTitle, courseCode }) {
  if (!window.jspdf) throw new Error("PDF tool hasn't loaded yet -- please try again in a moment.");

  // Learner's own details and their passing result for this course.
  let name = user.displayName || "";
  try {
    const u = await getDoc(doc(db, "users", user.uid));
    if (u.exists()) {
      const d = u.data();
      if (d.firstName && d.lastName) name = `${d.firstName} ${d.lastName}`;
    }
  } catch (_) {}
  let result = null, attempts = [];
  try {
    const snap = await getDocs(query(collection(db, "submissions"), where("userId", "==", user.uid)));
    snap.forEach(s => {
      const r = s.data();
      if (r.passed !== false && catalogIdFor(r) === courseId && (!result || String(r.completedAt) > String(result.completedAt))) result = r;
    });
  } catch (_) {}
  try {
    const snap = await getDocs(query(collection(db, "attempts"), where("userId", "==", user.uid)));
    snap.forEach(s => { const a = s.data(); if (catalogIdFor(a) === courseId) attempts.push(a); });
  } catch (_) {}
  if (!result) throw new Error("We couldn't find a completed result for this course on your account yet.");

  const sum = COURSE_SUMMARIES[courseId] || {};
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
  const M = 48, maxW = W - M * 2;
  const NAVY = [22, 50, 110], GREEN = [62, 140, 46], SLATE = [40, 46, 60], GREY = [95, 100, 110];
  let y = M;

  const footer = () => {
    pdf.setDrawColor(220, 224, 230); pdf.setLineWidth(0.5); pdf.line(M, H - 46, W - M, H - 46);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(130, 130, 130);
    pdf.text("Sela Skills Hub  |  Sela Civil Advisory Ltd  |  NZBN 9429053816207  |  selattm.com", M, H - 32);
    pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, W - M, H - 32, { align: "right" });
  };
  const ensure = (h) => { if (y + h > H - 64) { footer(); pdf.addPage(); y = M; } };
  const para = (text, size = 10, color = SLATE, style = "normal", gap = 6) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color);
    pdf.splitTextToSize(String(text || ""), maxW).forEach(line => { ensure(size + 4); pdf.text(line, M, y); y += size + 4; });
    y += gap;
  };
  const heading = (text) => {
    ensure(34); y += 6;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(12); pdf.setTextColor(...NAVY);
    pdf.text(text, M, y); y += 6;
    pdf.setDrawColor(...GREEN); pdf.setLineWidth(1.2); pdf.line(M, y, M + 40, y); y += 14;
  };
  const bullets = (items) => {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(...SLATE);
    (items || []).forEach(item => {
      const lines = pdf.splitTextToSize(String(item), maxW - 14);
      ensure(lines.length * 14 + 2);
      pdf.setTextColor(...GREEN); pdf.text("•", M + 2, y); pdf.setTextColor(...SLATE);
      lines.forEach(l => { pdf.text(l, M + 14, y); y += 14; });
      y += 2;
    });
    y += 4;
  };
  const row = (label, value) => {
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(...GREY);
    pdf.text(label, M, y);
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(...SLATE);
    const lines = pdf.splitTextToSize(String(value || "--"), maxW - 130);
    lines.forEach((l, i) => pdf.text(l, M + 130, y + i * 13));
    y += Math.max(1, lines.length) * 13 + 4;
  };

  // Header
  try {
    const logo = await imageDataUrl("img/sela-logo-transparent.png");
    pdf.addImage(logo, "PNG", M, y - 10, 150, 150 * 359 / 1200);
  } catch (_) {}
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(20); pdf.setTextColor(...NAVY);
  pdf.text("Record of Learning", W - M, y + 14, { align: "right" });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(...GREY);
  pdf.text(`Generated ${fmt(new Date().toISOString())}`, W - M, y + 28, { align: "right" });
  y += 62;

  // Learner & result
  pdf.setFillColor(244, 247, 250); pdf.roundedRect(M - 10, y - 16, maxW + 20, 128, 6, 6, "F");
  row("Learner", name || user.email);
  row("Email", user.email);
  row("Course", `${courseTitle}${courseCode ? ` (${courseCode})` : ""}`);
  row("Completed", fmt(result.completedAt));
  row("Result", `Passed${typeof result.scorePercent === "number" ? ` - ${result.scorePercent}%` : ""}${attempts.length ? `  (${attempts.length} assessment attempt${attempts.length === 1 ? "" : "s"} recorded)` : ""}`);
  row("Certificate", result.certificateIssued && result.certificateNumber ? `No. ${result.certificateNumber}` : "To be issued once your result has been reviewed");
  y += 14;

  if (sum.overview) { heading("About this course"); para(sum.overview); if (sum.format) para(`Format: ${sum.format}`, 9, GREY); }
  if (sum.covers) { heading("What was covered"); bullets(sum.covers); }
  if (sum.demonstrates) { heading("What the learner demonstrated"); bullets(sum.demonstrates); }
  if (sum.assessment) { heading("How it was assessed"); para(sum.assessment); }

  ensure(60); y += 8;
  para("This record summarises online learning completed through Sela Skills Hub. A Sela certificate number, where shown, confirms the result has been reviewed by Sela Civil Advisory Ltd. Practical competence on site is assessed separately where a course requires it.", 8, GREY, "italic");
  footer();

  const safe = (courseCode || courseId).replace(/[^A-Za-z0-9-]/g, "");
  pdf.save(`Record-of-Learning-${safe}.pdf`);
}
