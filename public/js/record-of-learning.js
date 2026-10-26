// ============================================================================
// File: public/js/record-of-learning.js
// Project: Sela Skills Hub (Sela Civil Advisory Ltd)
// One downloadable "Record of Learning" PDF covering ALL of a learner's Sela
// Skills Hub learning:
//   1. learner details
//   2. summary table of every course (status, completed, score, certificate)
//   3. for each completed course: what was covered / demonstrated / assessed
//      (from js/course-summaries.js)
//   4. full assessment attempt history (pass and fail)
// Used by learner.html (Your Courses). Needs jsPDF on the page (window.jspdf).
// ============================================================================

import { db, doc, getDoc, getDocs, collection } from "./firebase-init.js";
import { query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COURSE_SUMMARIES } from "./course-summaries.js";
import { catalogIdFor, titleFor, COURSES } from "./course-map.js";

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
const fmt = iso => iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }) : "--";
const codeFor = id => (Object.values(COURSES).find(c => c.courseId === id) || {}).courseCode || "";

async function mine(name, uid) {
  try {
    const snap = await getDocs(query(collection(db, name), where("userId", "==", uid)));
    const out = [];
    snap.forEach(d => out.push(d.data()));
    return out;
  } catch (_) { return []; }
}

/**
 * @param user     Firebase user
 * @param courses  the learner's courses as shown on Your Courses: [{id, title, code}]
 */
export async function downloadRecordOfLearning({ user, courses = [] }) {
  if (!window.jspdf) throw new Error("The PDF tool hasn't loaded yet. Please try again in a moment.");

  let profile = {};
  try {
    const u = await getDoc(doc(db, "users", user.uid));
    if (u.exists()) profile = u.data();
  } catch (_) {}
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || user.displayName || user.email;
  const [submissions, attempts] = await Promise.all([mine("submissions", user.uid), mine("attempts", user.uid)]);

  // Every course the learner has, plus any course they have results for.
  const list = courses.map(c => ({ id: c.id, title: c.title || titleFor(c.id), code: c.code || codeFor(c.id) }));
  [...submissions, ...attempts].forEach(r => {
    const id = catalogIdFor(r);
    if (id && !list.some(c => c.id === id)) list.push({ id, title: r.courseTitle || titleFor(id), code: r.courseCode || codeFor(id) });
  });
  const rows = list.map(c => {
    const passes = submissions.filter(s => catalogIdFor(s) === c.id && s.passed !== false)
      .sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
    const tries = attempts.filter(a => catalogIdFor(a) === c.id);
    const best = passes[0];
    const status = best ? "Completed" : tries.length ? "In progress" : "Not started";
    return { ...c, best, tries, status };
  });
  const done = rows.filter(r => r.best);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
  const M = 44, maxW = W - M * 2;
  const NAVY = [22, 50, 110], GREEN = [62, 140, 46], SLATE = [40, 46, 60], GREY = [100, 106, 116], RED = [190, 50, 50];
  let y = M;

  const footer = () => {
    pdf.setDrawColor(220, 224, 230); pdf.setLineWidth(0.5); pdf.line(M, H - 40, W - M, H - 40);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(130, 130, 130);
    pdf.text(`Record of Learning: ${name}  |  Sela Skills Hub, Sela Civil Advisory Ltd  |  NZBN 9429053816207  |  selattm.com`, M, H - 27);
    pdf.text(`Page ${pdf.internal.getNumberOfPages()}`, W - M, H - 27, { align: "right" });
  };
  const ensure = h => { if (y + h > H - 58) { footer(); pdf.addPage(); y = M; return true; } return false; };
  const text = (t, x, size, color, style = "normal", opts) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color); pdf.text(t, x, y, opts);
  };
  const para = (t, size = 9.5, color = SLATE, style = "normal", indent = 0) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color);
    pdf.splitTextToSize(String(t || ""), maxW - indent).forEach(l => {
      ensure(size + 4);
      pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color); // reset after a page break
      pdf.text(l, M + indent, y); y += size + 4;
    });
  };
  const sectionTitle = t => {
    ensure(40); y += 10;
    text(t, M, 14, NAVY, "bold"); y += 6;
    pdf.setDrawColor(...GREEN); pdf.setLineWidth(1.4); pdf.line(M, y, M + 44, y); y += 16;
  };
  const bullets = (items, indent = 8) => {
    (items || []).forEach(it => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5);
      const lines = pdf.splitTextToSize(String(it), maxW - indent - 12);
      ensure(lines.length * 13 + 2);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5); // reset after a page break
      pdf.setTextColor(...GREEN); pdf.text("•", M + indent, y);
      pdf.setTextColor(...SLATE); lines.forEach(l => { pdf.text(l, M + indent + 12, y); y += 13; });
      y += 1;
    });
  };
  // Simple table: cols = [{h, w, get, color?}]
  const table = (cols, data) => {
    const head = () => {
      pdf.setFillColor(22, 50, 110); pdf.rect(M, y - 11, maxW, 17, "F");
      let x = M + 6;
      cols.forEach(c => { text(c.h, x, 8.5, [255, 255, 255], "bold"); x += c.w; });
      y += 14;
    };
    head();
    data.forEach((d, i) => {
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.8);
      const cells = cols.map(c => pdf.splitTextToSize(String(c.get(d) ?? "--"), c.w - 8));
      const h = Math.max(...cells.map(c => c.length)) * 11 + 6;
      if (ensure(h + 4)) head();
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.8);
      if (i % 2 === 0) { pdf.setFillColor(244, 247, 250); pdf.rect(M, y - 10, maxW, h, "F"); }
      let x = M + 6;
      cells.forEach((lines, ci) => {
        const col = cols[ci];
        pdf.setTextColor(...(col.color ? col.color(d) : SLATE));
        pdf.setFont("helvetica", col.bold && col.bold(d) ? "bold" : "normal");
        lines.forEach((l, li) => pdf.text(l, x, y + li * 11));
        x += col.w;
      });
      y += h;
    });
    y += 6;
  };

  // ---- Header
  try {
    const logo = await imageDataUrl("img/sela-logo-transparent.png");
    pdf.addImage(logo, "PNG", M, y - 10, 150, 150 * 359 / 1200);
  } catch (_) {}
  y += 14; text("Record of Learning", W - M, 20, NAVY, "bold", { align: "right" });
  y += 14; text(`Generated ${fmt(new Date().toISOString())}`, W - M, 9, GREY, "normal", { align: "right" });
  y += 38;

  // ---- Learner
  pdf.setFillColor(244, 247, 250); pdf.roundedRect(M - 8, y - 16, maxW + 16, 74, 6, 6, "F");
  const kv = (k, v, x) => { text(k, x, 9, GREY, "bold"); pdf.setFont("helvetica", "normal"); pdf.setTextColor(...SLATE); pdf.text(String(v), x + 78, y); };
  kv("Learner", name, M); kv("Courses", `${done.length} completed of ${rows.length}`, M + maxW / 2); y += 16;
  kv("Email", user.email, M); kv("Attempts", `${attempts.length} assessment attempt${attempts.length === 1 ? "" : "s"}`, M + maxW / 2); y += 16;
  kv("Member since", fmt(user.metadata && user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : profile.profileCompletedAt), M);
  kv("Certificates", `${done.filter(r => r.best.certificateIssued).length} issued`, M + maxW / 2);
  y += 30;

  // ---- Summary table
  sectionTitle("Course summary");
  if (rows.length) {
    table([
      { h: "Course", w: 185, get: r => `${r.title}${r.code ? ` (${r.code})` : ""}` },
      { h: "Status", w: 66, get: r => r.status, color: r => r.best ? GREEN : r.tries.length ? [180, 120, 20] : GREY, bold: r => !!r.best },
      { h: "Completed", w: 68, get: r => r.best ? fmt(r.best.completedAt) : "--" },
      { h: "Score", w: 42, get: r => r.best && typeof r.best.scorePercent === "number" ? `${r.best.scorePercent}%` : "--" },
      { h: "Certificate", w: maxW - 361, get: r => r.best ? (r.best.certificateIssued && r.best.certificateNumber ? r.best.certificateNumber : "Pending review") : "--" },
    ], rows);
  } else {
    para("No courses yet.", 9.5, GREY, "italic");
  }

  // ---- Each completed course
  if (done.length) {
    sectionTitle("Learning completed");
    done.forEach((r, i) => {
      const s = COURSE_SUMMARIES[r.id] || {};
      ensure(70);
      if (i) y += 6;
      text(`${r.title}${r.code ? ` (${r.code})` : ""}`, M, 11.5, NAVY, "bold"); y += 14;
      para(`Completed ${fmt(r.best.completedAt)}${typeof r.best.scorePercent === "number" ? `  ·  Score ${r.best.scorePercent}%` : ""}` +
        `${r.best.certificateIssued && r.best.certificateNumber ? `  ·  Certificate ${r.best.certificateNumber}` : ""}` +
        `${s.format ? `  ·  ${s.format}` : ""}`, 8.5, GREY);
      y += 2;
      if (s.covers) { ensure(30); text("What was covered", M, 9.5, SLATE, "bold"); y += 13; bullets(s.covers); }
      if (s.demonstrates) { ensure(30); y += 2; text("What the learner demonstrated", M, 9.5, SLATE, "bold"); y += 13; bullets(s.demonstrates); }
      if (s.assessment) { ensure(24); y += 2; para(`Assessment: ${s.assessment}`, 8.8, GREY, "italic"); }
      y += 4;
      pdf.setDrawColor(225, 229, 235); pdf.setLineWidth(0.5); pdf.line(M, y, W - M, y); y += 12;
    });
  }

  // ---- Attempt history
  sectionTitle("Assessment history");
  const hist = [...attempts].sort((a, b) => String(b.attemptedAt).localeCompare(String(a.attemptedAt)));
  if (hist.length) {
    table([
      { h: "Date", w: 78, get: a => fmt(a.attemptedAt) },
      { h: "Course", w: 230, get: a => a.courseTitle || titleFor(catalogIdFor(a)) },
      { h: "Assessment", w: 90, get: a => /final/i.test(a.quizId || "") ? "Final test" : String(a.quizId || "Quiz").replace(/^quiz/i, "Quiz ") },
      { h: "Score", w: 60, get: a => typeof a.scorePercent === "number" ? `${a.scorePercent}%` : "--" },
      { h: "Result", w: maxW - 458, get: a => a.passed ? "Pass" : "Not yet", color: a => a.passed ? GREEN : RED, bold: () => true },
    ], hist);
  } else {
    para("Individual quiz and test attempts are recorded from October 2026 onwards. Completed courses are listed above.", 9, GREY, "italic");
  }

  ensure(50); y += 10;
  para("This record lists online learning completed through Sela Skills Hub (selattm.com), operated by Sela Civil Advisory Ltd. A certificate number confirms the result has been reviewed by Sela. These courses are knowledge courses; practical competence on site is assessed separately where a course or role requires it. To verify this record, contact joseph@selacivil.co.nz.", 8, GREY, "italic");
  footer();

  const safe = String(name).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  pdf.save(`Sela-Record-of-Learning-${safe || "Learner"}.pdf`);
}
