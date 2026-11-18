// ============================================================================
// File: public/js/admin-tmp-signoff.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: admin.html "TMP Sign-off" tab -- the assessor's tool for the
// TMP Design Practical Sign-off (NZGTTM-TMP-PS).
//   - Lists every TMP submitted from /courses/nzgttm-tmp-ps/ (awaiting first).
//   - "Mark" opens the submission: learner details, their files (download
//     links from Firebase Storage), share link, notes, earlier attempts, and
//     the marking form built from js/tmp-rubric.js (the same criteria the
//     learner sees).
//   - Each criterion: Met / Not yet met / Not applicable (where allowed) plus
//     feedback. The outcome the marks support is shown live; "Signed off" is
//     only available when the marks support it.
//   - Save draft, or record the result: the learner sees the marks and
//     feedback on the sign-off page and gets an email. A sign-off also adds a
//     record to "submissions" so the certificate is issued from Results &
//     Certificates like every other course.
//   - "Void attempt" removes an attempt from the learner's count (to give an
//     extra attempt, or to clear a wrong upload).
// Data: tmp_signoff_submissions, users/{uid}, submissions, mail.
// ============================================================================

import { app, auth, db, doc, getDoc, setDoc, addDoc, collection, getDocs, onAuthStateChanged } from "./firebase-init.js";
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { SIGNOFF, RUBRIC, ALL_CRITERIA, evaluate, PASS_RULE } from "./tmp-rubric.js";

const COLL = "tmp_signoff_submissions";
const PORTAL_URL = "https://selattm.com/courses/nzgttm-tmp-ps/index.html";
const state = { subs: [], names: new Map(), filter: "open" };

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = iso => iso ? new Date(iso).toLocaleString("en-NZ", { dateStyle: "medium", timeStyle: "short" }) : "--";
const nameOf = s => state.names.get(s.userId) || s.name || s.email || "Unknown";

function statusPill(s) {
  if (s.voided) return `<span class="badge" style="background:rgba(148,163,184,.2);color:#94a3b8;">Voided</span>`;
  if (s.status === "assessed") return s.result === "competent"
    ? `<span class="badge" style="background:rgba(34,197,94,.15);color:#4ade80;">Signed off</span>`
    : `<span class="badge" style="background:rgba(239,68,68,.15);color:#f87171;">Not yet competent</span>`;
  if (s.draft) return `<span class="badge" style="background:rgba(56,189,248,.15);color:#38bdf8;">Marking (draft)</span>`;
  return `<span class="badge" style="background:rgba(245,158,11,.2);color:#f59e0b;">Awaiting</span>`;
}

async function load() {
  const tbody = document.getElementById("tmpps-tbody");
  if (!tbody) return;
  try {
    const snap = await getDocs(collection(db, COLL));
    state.subs = snap.docs.map(d => ({ _id: d.id, ...d.data() }))
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
    const uids = [...new Set(state.subs.map(s => s.userId).filter(Boolean))].filter(u => !state.names.has(u));
    await Promise.all(uids.map(async uid => {
      try {
        const u = await getDoc(doc(db, "users", uid));
        if (u.exists()) { const d = u.data(); const n = [d.firstName, d.lastName].filter(Boolean).join(" "); if (n) state.names.set(uid, n); }
      } catch (e) { /* name is optional */ }
    }));
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f87171;">Couldn't load submissions: ${esc(e.message)}</td></tr>`;
    return;
  }
  render();
}

function render() {
  const tbody = document.getElementById("tmpps-tbody");
  const open = state.subs.filter(s => !s.voided && s.status !== "assessed");
  const badge = document.getElementById("tab-count-tmpps");
  if (badge) badge.textContent = open.length ? open.length : "";
  const rows = state.filter === "open" ? open : state.subs;
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">${state.filter === "open" ? "Nothing waiting to be marked." : "No TMPs submitted yet."}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(s => `<tr>
    <td><strong>${esc(nameOf(s))}</strong><div style="font-size:.78rem;color:var(--text-muted);">${esc(s.email)}</div></td>
    <td>${esc(s.title)}<div style="font-size:.78rem;color:var(--text-muted);">${esc(s.location)}</div></td>
    <td>${esc(s.attempt)} of ${SIGNOFF.attemptsAllowed}</td>
    <td>${fmt(s.submittedAt)}</td>
    <td>${statusPill(s)}</td>
    <td><button class="btn-action" data-tmpps="${esc(s._id)}" style="padding:6px 10px;font-size:.8rem;">${s.status === "assessed" || s.voided ? "View" : "Mark"}</button></td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-tmpps]").forEach(b => b.addEventListener("click", () => openMarking(b.dataset.tmpps)));
}

// ---------------------------------------------------------------------------
// Marking view
// ---------------------------------------------------------------------------
async function openMarking(id) {
  const s = state.subs.find(x => x._id === id);
  if (!s) return;
  const locked = s.status === "assessed" || s.voided;
  const marks = JSON.parse(JSON.stringify(s.marks || {}));
  const earlier = state.subs.filter(x => x.userId === s.userId && x._id !== s._id && !x.voided && x.status === "assessed")
    .sort((a, b) => a.attempt - b.attempt);

  const overlay = document.createElement("div");
  overlay.id = "tmpps-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.85);overflow:auto;padding:24px 12px;";
  const crit = c => {
    const m = marks[c.id] || {};
    const prev = earlier.length ? earlier[earlier.length - 1].marks?.[c.id] : null;
    const opt = (val, label) => `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:14px;font-weight:500;cursor:pointer;">
      <input type="radio" name="m-${c.id}" value="${val}" ${m.mark === val ? "checked" : ""} ${locked ? "disabled" : ""}> ${label}</label>`;
    return `<div style="border-top:1px solid rgba(255,255,255,.1);padding:12px 0;">
      <div><strong style="color:#38bdf8;">${c.id}</strong> ${c.critical ? '<span style="background:rgba(239,68,68,.15);color:#f87171;border-radius:9999px;padding:1px 8px;font-size:.72rem;font-weight:700;">Critical</span>' : ""}
        ${esc(c.text)}</div>
      <div style="font-size:.82rem;color:var(--text-muted);margin:3px 0 8px;">Look for: ${esc(c.evidence)}</div>
      ${prev ? `<div style="font-size:.8rem;color:#f59e0b;margin-bottom:6px;">Last attempt: ${prev.mark === "met" ? "Met" : prev.mark === "na" ? "N/A" : "Not yet met"}${prev.comment ? ` — ${esc(prev.comment)}` : ""}</div>` : ""}
      ${opt("met", "Met")}${opt("not_yet", "Not yet met")}${c.naAllowed ? opt("na", "Not applicable") : ""}
      <textarea data-comment="${c.id}" ${locked ? "readonly" : ""} placeholder="Feedback the learner will see${c.critical ? " (required if not yet met)" : ""}"
        style="width:100%;min-height:52px;margin-top:6px;padding:8px;border-radius:6px;">${esc(m.comment || "")}</textarea>
    </div>`;
  };

  overlay.innerHTML = `<div style="max-width:920px;margin:0 auto;background:#1e293b;color:#f8fafc;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:24px;">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
      <div><h2 style="margin:0;">${esc(s.title)}</h2>
        <div style="color:var(--text-muted);">${esc(nameOf(s))} &middot; ${esc(s.email)} &middot; Attempt ${esc(s.attempt)} of ${SIGNOFF.attemptsAllowed} &middot; Submitted ${fmt(s.submittedAt)}</div></div>
      <button class="btn-action" id="tmpps-close">Close</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:16px 0;">
      <div><div style="color:var(--text-muted);font-size:.8rem;">Location</div>${esc(s.location) || "--"}</div>
      <div><div style="color:var(--text-muted);font-size:.8rem;">Speed (permanent / design)</div>${esc(s.speed) || "--"}</div>
      <div><div style="color:var(--text-muted);font-size:.8rem;">Status</div>${statusPill(s)}</div>
    </div>
    <div style="margin-bottom:10px;"><div style="color:var(--text-muted);font-size:.8rem;">Files</div><ul id="tmpps-files" style="margin:4px 0;padding-left:18px;">
      ${(s.files || []).length ? s.files.map((f, i) => `<li><a data-file="${i}" href="#" style="color:#38bdf8;">${esc(f.name)}</a> (${(f.size / 1048576).toFixed(1)} MB)</li>`).join("") : "<li>No files uploaded</li>"}</ul>
      ${s.link ? `<div>Share link: <a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;word-break:break-all;">${esc(s.link)}</a></div>` : ""}</div>
    ${s.notes ? `<div style="background:rgba(255,255,255,.05);border-radius:8px;padding:10px 12px;margin-bottom:10px;"><div style="color:var(--text-muted);font-size:.8rem;">Learner's notes</div>${esc(s.notes).replace(/\n/g, "<br>")}</div>` : ""}
    ${earlier.length ? `<div style="font-size:.85rem;color:#f59e0b;margin-bottom:10px;">Earlier attempt${earlier.length > 1 ? "s" : ""}: ${earlier.map(e => `#${e.attempt} not yet competent (${fmt(e.assessedAt)})`).join("; ")}. Last attempt's marks are shown under each criterion.</div>` : ""}
    <p style="font-size:.85rem;color:var(--text-muted);">${esc(PASS_RULE)}</p>
    ${RUBRIC.map(sec => `<h3 style="margin:18px 0 0;color:#f59e0b;">${sec.id}. ${esc(sec.title)}</h3>${sec.criteria.map(crit).join("")}`).join("")}
    <h3 style="margin:18px 0 6px;">Overall feedback</h3>
    <textarea id="tmpps-overall" ${locked ? "readonly" : ""} style="width:100%;min-height:90px;padding:8px;border-radius:6px;" placeholder="Summary the learner sees at the top of their result">${esc(s.overallComment || "")}</textarea>
    <div id="tmpps-eval" style="margin:14px 0;padding:12px;border-radius:8px;background:rgba(255,255,255,.05);"></div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">
      ${locked ? "" : `<button class="btn-action" id="tmpps-draft">Save draft</button>
      <button class="btn-primary-action" id="tmpps-pass" style="background:#16a34a;">Record: Signed off</button>
      <button class="btn-primary-action" id="tmpps-fail" style="background:#dc2626;">Record: Not yet competent</button>`}
      ${s.voided ? "" : `<button class="btn-action" id="tmpps-void" style="margin-left:auto;">Void this attempt</button>`}
    </div>
    ${s.status === "assessed" ? `<p style="color:var(--text-muted);font-size:.85rem;margin-top:12px;">Assessed ${fmt(s.assessedAt)} by ${esc(s.assessorEmail)}.</p>` : ""}
    <div id="tmpps-msg" style="margin-top:10px;font-weight:600;"></div>
  </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector("#tmpps-close").addEventListener("click", close);

  // File downloads: fetch a fresh signed URL when clicked.
  overlay.querySelectorAll("[data-file]").forEach(a => a.addEventListener("click", async e => {
    e.preventDefault();
    const f = s.files[+a.dataset.file];
    try { window.open(await getDownloadURL(ref(getStorage(app), f.path)), "_blank", "noopener"); }
    catch (err) { alert("Couldn't open the file: " + err.message); }
  }));

  const collect = () => {
    ALL_CRITERIA.forEach(c => {
      const r = overlay.querySelector(`input[name="m-${c.id}"]:checked`);
      const t = overlay.querySelector(`[data-comment="${c.id}"]`).value.trim();
      marks[c.id] = { mark: r ? r.value : "", comment: t };
    });
    return marks;
  };
  const showEval = () => {
    const ev = evaluate(collect());
    const passBtn = overlay.querySelector("#tmpps-pass"), failBtn = overlay.querySelector("#tmpps-fail");
    const needComment = ALL_CRITERIA.filter(c => marks[c.id].mark === "not_yet" && !marks[c.id].comment).map(c => c.id);
    let html;
    if (!ev.complete) html = `<strong>${ev.missing.length} criteria still to mark:</strong> ${ev.missing.join(", ")}`;
    else if (ev.competent) html = `<strong style="color:#4ade80;">Marks support: Signed off.</strong>${ev.otherGaps.length ? ` Minor corrections: ${ev.otherGaps.join(", ")}.` : ""}`;
    else html = `<strong style="color:#f87171;">Marks support: Not yet competent.</strong> ${ev.criticalGaps.length ? `Critical not met: ${ev.criticalGaps.join(", ")}. ` : ""}${ev.otherGaps.length > SIGNOFF.maxNonCriticalGaps ? `${ev.otherGaps.length} other criteria not met (max ${SIGNOFF.maxNonCriticalGaps}).` : ""}`;
    if (needComment.length) html += `<div style="color:#f59e0b;margin-top:4px;">Add feedback for: ${needComment.join(", ")}</div>`;
    overlay.querySelector("#tmpps-eval").innerHTML = html;
    if (passBtn) passBtn.disabled = !(ev.complete && ev.competent && !needComment.length);
    if (failBtn) failBtn.disabled = !(ev.complete && !ev.competent && !needComment.length);
    return { ev, needComment };
  };
  overlay.addEventListener("change", showEval);
  overlay.addEventListener("input", e => { if (e.target.matches("[data-comment]")) showEval(); });
  showEval();

  const msg = t => { overlay.querySelector("#tmpps-msg").textContent = t; };
  const who = auth.currentUser?.email || "unknown";

  overlay.querySelector("#tmpps-draft")?.addEventListener("click", async () => {
    collect();
    try {
      await updateDoc(doc(db, COLL, s._id), { marks, overallComment: overlay.querySelector("#tmpps-overall").value.trim(), draft: true, draftSavedAt: new Date().toISOString(), assessorEmail: who });
      Object.assign(s, { marks, draft: true }); msg("Draft saved. The learner can't see it until you record a result."); render();
    } catch (e) { msg("Save failed: " + e.message); }
  });

  const record = async result => {
    const { ev } = showEval();
    const overall = overlay.querySelector("#tmpps-overall").value.trim();
    const label = result === "competent" ? "Signed off" : "Not yet competent";
    if (!confirm(`Record "${label}" for ${nameOf(s)}? The learner will see the marks and get an email.`)) return;
    const now = new Date().toISOString();
    const applicable = ALL_CRITERIA.filter(c => marks[c.id].mark !== "na");
    const pct = Math.round(100 * applicable.filter(c => marks[c.id].mark === "met").length / applicable.length);
    try {
      await updateDoc(doc(db, COLL, s._id), { marks, overallComment: overall, status: "assessed", result, draft: false, scorePercent: pct, assessedAt: now, assessorEmail: who });
      Object.assign(s, { marks, overallComment: overall, status: "assessed", result, assessedAt: now, assessorEmail: who });

      if (result === "competent") {
        await addDoc(collection(db, "submissions"), {
          userId: s.userId, email: s.email, courseId: SIGNOFF.courseId, courseCode: SIGNOFF.courseCode, courseTitle: SIGNOFF.courseTitle,
          scorePercent: pct, passed: true, completedAt: now, certificateIssued: false, tmpSignoffId: s._id, recordedBy: who,
        });
      }

      const left = SIGNOFF.attemptsAllowed - state.subs.filter(x => x.userId === s.userId && !x.voided && x.result === "not_yet").length;
      const gaps = ALL_CRITERIA.filter(c => marks[c.id].mark === "not_yet");
      const intro = result === "competent"
        ? `Your TMP "${s.title}" has been assessed and you are signed off for TMP design. Well done.${gaps.length ? " Please make the minor corrections noted before using this TMP." : ""} Your certificate will follow by email.`
        : `Your TMP "${s.title}" has been assessed and isn't signed off yet. Please read the feedback, fix the criteria marked not yet met, and resubmit. You have ${left} attempt${left === 1 ? "" : "s"} left.`;
      const gapText = gaps.map(c => `${c.id}: ${marks[c.id].comment}`).join("\n");
      await addDoc(collection(db, "mail"), {
        to: s.email,
        message: {
          subject: `TMP sign-off result: ${label}`,
          text: `Kia ora ${nameOf(s)},\n\n${intro}\n\n${overall ? "Assessor's summary:\n" + overall + "\n\n" : ""}${gapText ? (result === "competent" ? "Corrections to make:\n" : "Not yet met:\n") + gapText + "\n\n" : ""}See your full marks against every criterion: ${PORTAL_URL}\n\nNgā mihi,\nSela Civil Advisory`,
          html: `<p>Kia ora ${esc(nameOf(s))},</p><p>${esc(intro)}</p>` +
            (overall ? `<p><strong>Assessor's summary:</strong><br>${esc(overall).replace(/\n/g, "<br>")}</p>` : "") +
            (gaps.length ? `<p><strong>${result === "competent" ? "Corrections to make" : "Not yet met"}:</strong></p><ul>${gaps.map(c => `<li><strong>${c.id}</strong> ${esc(marks[c.id].comment)}</li>`).join("")}</ul>` : "") +
            `<p><a href="${PORTAL_URL}">See your full marks against every criterion</a></p><p>Ngā mihi,<br>Sela Civil Advisory</p>`,
        },
        meta: { type: "tmp-signoff-result", submissionId: s._id, result, sentBy: who, queuedAt: now },
      });
      msg(`Recorded: ${label}. The learner has been emailed.${result === "competent" ? " Issue the certificate from Results & Certificates." : ""}`);
      render();
      setTimeout(() => { close(); openMarking(s._id); }, 1200);
    } catch (e) { msg("Couldn't record the result: " + e.message); }
  };
  overlay.querySelector("#tmpps-pass")?.addEventListener("click", () => record("competent"));
  overlay.querySelector("#tmpps-fail")?.addEventListener("click", () => record("not_yet"));

  overlay.querySelector("#tmpps-void")?.addEventListener("click", async () => {
    const reason = prompt("Void this attempt? It will no longer count towards the learner's 3 attempts. Reason (kept on the record):");
    if (reason === null) return;
    try {
      await updateDoc(doc(db, COLL, s._id), { voided: true, voidReason: reason, voidedAt: new Date().toISOString(), voidedBy: who });
      // Renumber the learner's remaining attempts so the next one follows on.
      const rest = state.subs.filter(x => x.userId === s.userId && !x.voided && x._id !== s._id).sort((a, b) => a.attempt - b.attempt);
      for (let i = 0; i < rest.length; i++) if (rest[i].attempt !== i + 1) { await updateDoc(doc(db, COLL, rest[i]._id), { attempt: i + 1 }); rest[i].attempt = i + 1; }
      s.voided = true; close(); render();
    } catch (e) { msg("Couldn't void: " + e.message); }
  });
}

document.getElementById("tmpps-filter")?.addEventListener("change", e => { state.filter = e.target.value; render(); });
document.getElementById("btn-refresh-tmpps")?.addEventListener("click", load);
const stop = onAuthStateChanged(auth, user => { if (user && !user.isAnonymous) { stop(); load(); } });
