// ============================================================================
// selattm.com Cloud Functions
// ----------------------------------------------------------------------------
// notifyOnCompletion: whenever a course writes a result to "submissions"
// (every course's completion page does this), queue an email to the
// training manager in the "mail" collection. The Trigger Email extension
// (firestore-send-email) sends it. One function covers every course, so no
// course page needs changing.
// Deploy: cd functions && npm install && cd .. && firebase deploy --only functions
// ============================================================================
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const NOTIFY_TO = "joseph@selacivil.co.nz";
const ADMIN_URL = "https://selattm.com/admin.html";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

exports.notifyOnCompletion = onDocumentCreated(
  { document: "submissions/{submissionId}", region: "australia-southeast1", database: "(default)" },
  async (event) => {
    const sub = event.data && event.data.data();
    if (!sub) return;
    const id = event.params.submissionId;

    let name = "";
    let postcode = "";
    if (sub.userId) {
      try {
        const u = await db.collection("users").doc(sub.userId).get();
        if (u.exists) {
          const d = u.data();
          name = [d.firstName, d.lastName].filter(Boolean).join(" ");
          postcode = d.postcode || "";
        }
      } catch (e) {
        logger.warn("Learner profile lookup failed", { id, error: e.message });
      }
    }

    const who = name || sub.email || "A learner";
    const course = sub.courseTitle || sub.courseId || "a course";
    const score = typeof sub.scorePercent === "number" ? `${sub.scorePercent}%` : "--";
    const result = sub.passed === false ? "did not pass" : "passed";
    const when = sub.completedAt
      ? new Date(sub.completedAt).toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", dateStyle: "medium", timeStyle: "short" })
      : "--";

    const lines = [
      ["Learner", name || "(name not entered yet)"],
      ["Email", sub.email || "--"],
      ["Postcode", postcode || "--"],
      ["Course", `${course}${sub.courseCode ? ` (${sub.courseCode})` : ""}`],
      ["Result", `${result} - ${score}`],
      ["Completed", when],
    ];

    await db.collection("mail").add({
      to: NOTIFY_TO,
      message: {
        subject: `Course completed: ${who} - ${course}`,
        text:
          `${who} has ${result === "passed" ? "completed" : "finished"} ${course}.\n\n` +
          lines.map(([k, v]) => `${k}: ${v}`).join("\n") +
          `\n\nIssue the certificate: ${ADMIN_URL}`,
        html:
          `<p><strong>${esc(who)}</strong> has ${result === "passed" ? "completed" : "finished"} <strong>${esc(course)}</strong>.</p>` +
          `<table cellpadding="4" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">` +
          lines.map(([k, v]) => `<tr><td style="color:#666;padding-right:14px;">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("") +
          `</table><p><a href="${ADMIN_URL}">Open Admin to issue the certificate</a></p>`,
      },
      meta: { type: "completion-notice", submissionId: id, queuedAt: new Date().toISOString() },
    });
    logger.info("Completion notice queued", { id, course, email: sub.email });
  }
);
