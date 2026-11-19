// ============================================================================
// File: public/js/admin-learners.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: admin.html "Learners" panel.
//   - Lists every learner (users / grants / results / attempts) with their
//     last-active time, number of courses, attempts and passes.
//   - "View" opens a learner profile:
//       * details (name, DOB, postcode, last active / last sign-in)
//       * their courses (paid via Stripe + pre-paid grants) with status,
//         in the order they must be completed; admin can re-order, turn the
//         "complete in order" rule on/off, add pre-paid courses or remove one
//       * full history of every quiz/test attempt (pass and fail), course
//         completions and certificates.
//   - Shows where each learner is up to in each course (slide/step, % done)
//     from course_progress, written by js/progress-sync.js.
// Data: users/{uid}, grants/{email}, learner_plans/{email}, attempts,
//       submissions, course_progress, customers/{uid}/payments, courses.
// ============================================================================

import { auth, db, doc, getDoc, setDoc, collection, getDocs, onAuthStateChanged } from "./firebase-init.js";
import { arrayUnion, arrayRemove, deleteField, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from "./modal.js";
import { canonicalId, dedupeCatalog, LEGACY_IDS } from "./course-map.js";
import { downloadRecordOfLearning } from "./record-of-learning.js";

const state = { catalog: [], learners: [], byEmail: new Map(), grants: new Map(), plans: new Map(), names: new Map(), ids: new Map(), companyOf: new Map(), companies: new Map(), attempts: [], submissions: [], progress: [] };

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lower = v => String(v || "").trim().toLowerCase();

function fmtDate(iso, withTime = true) {
  if (!iso) return "--";
  const d = new Date(iso);
  if (isNaN(d)) return "--";
  return d.toLocaleString("en-NZ", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}
function ago(iso) {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(iso, false);
}

// Which catalog course does a submission/attempt belong to? Matches on id or
// code, because older pages record their own folder name as courseId.
function catalogCourseFor(rec) {
  const id = lower(rec.courseId), code = lower(rec.courseCode);
  const hit = state.catalog.find(c => lower(c.id) === id || (code && lower(c.code) === code));
  if (hit) return hit;
  // Fallback: match the course folder of the page the record came from
  // against the catalog launchPath (e.g. PTS-01 records "pts-01" but the
  // catalog lists it as "ttm-portable-traffic-signals").
  const folder = (String(rec.positionPage || rec.page || "").match(/\/courses\/([^\/]+)\//) || [])[1];
  return (folder && state.catalog.find(c => String(c.launchPath || "").includes(`/courses/${folder}/`))) || null;
}
function courseTitle(id) {
  const c = state.catalog.find(x => x.id === id);
  return c ? (c.title || c.code || c.id) : id;
}

async function safeGetAll(name) {
  try {
    const snap = await getDocs(collection(db, name));
    const out = [];
    snap.forEach(d => out.push({ _id: d.id, ...d.data() }));
    return out;
  } catch (e) {
    console.warn(`[learners] could not read ${name}:`, e.message);
    return [];
  }
}

// ---------------------------------------------------------------- load
async function loadAll() {
  const tbody = document.getElementById("learners-tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">Loading learners...</td></tr>`;

  const [catalog, users, grants, plans, attempts, submissions, progress, profiles, companies] = await Promise.all([
    safeGetAll("courses"), safeGetAll("users"), safeGetAll("grants"),
    safeGetAll("learner_plans"), safeGetAll("attempts"), safeGetAll("submissions"),
    safeGetAll("course_progress"), safeGetAll("learner_profiles"), safeGetAll("companies"),
  ]);
  // Names an admin has typed in (Edit name here, or at certificate time).
  state.names = new Map(profiles.filter(p => p.fullName).map(p => [lower(p._id), p.fullName]));
  // Learner IDs (SELA1000...), assigned by scripts/assign-learner-ids.js and
  // the assignLearnerIdOn* Cloud Functions.
  state.ids = new Map(profiles.filter(p => p.learnerId).map(p => [lower(p._id), p.learnerId]));
  // Company each learner works for (set by an admin below; see admin-companies.js).
  state.companies = new Map(companies.map(c => [c._id, c.name || c._id]));
  state.companyOf = new Map(profiles.filter(p => p.companyId).map(p => [lower(p._id), p.companyId]));
  // Course docs keep their id as the document name, not a field -- copy it in.
  state.catalog = dedupeCatalog(catalog.map(c => ({ ...c, id: c.id || c._id })))
    .map(c => ({ ...c, id: canonicalId(c.id) }))
    .filter(c => c.launchPath || c.status === "active").sort((a, b) => String(a.title).localeCompare(String(b.title)));
  state.grants = new Map(grants.map(g => [lower(g._id), g]));
  state.plans = new Map(plans.map(p => [lower(p._id), p]));
  state.attempts = attempts;
  state.submissions = submissions;
  state.progress = progress;

  const map = new Map();
  const get = (email) => {
    const e = lower(email);
    if (!e) return null;
    if (!map.has(e)) map.set(e, { email: e, uid: "", profile: {}, attempts: [], submissions: [], progress: [] });
    return map.get(e);
  };
  users.forEach(u => { const l = get(u.email); if (l) { l.uid = u._id; l.profile = u; } });
  grants.forEach(g => get(g._id));
  plans.forEach(p => get(p._id));
  submissions.forEach(s => { const l = get(s.email); if (l) { l.submissions.push(s); if (!l.uid && s.userId) l.uid = s.userId; } });
  attempts.forEach(a => { const l = get(a.email); if (l) { l.attempts.push(a); if (!l.uid && a.userId) l.uid = a.userId; } });
  progress.forEach(p => { const l = get(p.email); if (l) { l.progress.push(p); if (!l.uid && p.userId) l.uid = p.userId; } });

  state.learners = [...map.values()].sort((a, b) =>
    String(b.profile.lastSeenAt || "").localeCompare(String(a.profile.lastSeenAt || "")) || a.email.localeCompare(b.email));
  state.byEmail = map;
  renderTable();
}

// Admin-entered name (learner_profiles) wins, so an admin can add a missing
// name or correct a misspelt one. Then the name the learner entered on
// sign-up (users/{uid}), then the name printed on their latest certificate.
function selfEnteredName(l) {
  const p = l.profile || {};
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
}
function displayName(l) {
  const certName = [...(l.submissions || [])]
    .filter(s => s.certificateName)
    .sort((a, b) => String(b.completedAt || "").localeCompare(String(a.completedAt || "")))[0]?.certificateName;
  return state.names.get(l.email) || selfEnteredName(l) || certName || "";
}

function companyName(l) {
  const id = state.companyOf.get(l.email);
  return id ? (state.companies.get(id) || "(deleted company)") : "";
}

async function saveLearnerCompany(email, companyId) {
  const data = companyId
    ? { email, companyId, companyName: state.companies.get(companyId) || "", companyUpdatedBy: auth.currentUser?.email || "unknown", companyUpdatedAt: new Date().toISOString() }
    : { email, companyId: deleteField(), companyName: deleteField(), companyUpdatedBy: auth.currentUser?.email || "unknown", companyUpdatedAt: new Date().toISOString() };
  await setDoc(doc(db, "learner_profiles", email), data, { merge: true });
  if (companyId) state.companyOf.set(email, companyId); else state.companyOf.delete(email);
  window.dispatchEvent(new CustomEvent("sela:learner-company-changed"));
}

async function saveLearnerName(email, current) {
  const entered = window.prompt(`Full name for ${email} (used in the admin lists and on certificates):`, current || "");
  if (entered === null) return false;
  const fullName = entered.trim().replace(/\s+/g, " ");
  if (!fullName) { showModal({ title: "Name not saved", message: "The name can't be blank.", type: "error" }); return false; }
  try {
    await setDoc(doc(db, "learner_profiles", email), {
      email, fullName,
      lastUpdatedBy: auth.currentUser?.email || "unknown",
      lastUpdatedAt: new Date().toISOString(),
    }, { merge: true });
    state.names.set(email, fullName);
    return true;
  } catch (err) {
    console.error("[learners] could not save name:", err);
    showModal({ title: "Name not saved", message: err.message, type: "error" });
    return false;
  }
}
function grantedIds(l) {
  const g = state.grants.get(l.email);
  if (!g) return [];
  if (g.allCourses) return state.catalog.map(c => c.id);
  return Array.isArray(g.courseIds) ? [...new Set(g.courseIds.map(canonicalId))] : [];
}
// Where a learner is up to in one course (course_progress, newest record).
function progressFor(l, courseId) {
  return (l.progress || []).filter(p => catalogCourseFor(p)?.id === courseId)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0] || null;
}
function progressBar(pct) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  return `<span style="display:inline-block;width:70px;height:6px;border-radius:3px;background:rgba(148,163,184,.25);vertical-align:middle;margin-right:6px;overflow:hidden;"><span style="display:block;height:100%;width:${v}%;background:#38bdf8;"></span></span>`;
}
function progressHtml(p) {
  const counts = p.total ? `${p.done || 0} of ${p.total} screens` : "";
  const quiz = p.quizzesTotal ? ` · quizzes ${p.quizzesPassed || 0}/${p.quizzesTotal}` : "";
  return `${progressBar(p.percent)}<strong>${esc(p.percent || 0)}%</strong>
    <div style="font-size:0.78rem;color:var(--text-muted);">${esc(counts)}${esc(quiz)}${p.position ? ` · at ${esc(p.position)}` : ""} · ${esc(ago(p.updatedAt))}</div>`;
}

function passedIds(l) {
  const ids = new Set();
  [...l.submissions.filter(s => s.passed !== false), ...l.attempts.filter(a => a.passed && a.quizId && /final/i.test(a.quizId))]
    .forEach(r => { const c = catalogCourseFor(r); if (c) ids.add(c.id); });
  return ids;
}

// ---------------------------------------------------------------- table
function renderTable() {
  const tbody = document.getElementById("learners-tbody");
  if (!tbody) return;
  const q = lower(document.getElementById("learners-search")?.value);
  const rows = state.learners.filter(l => !q || l.email.includes(q) || lower(displayName(l)).includes(q) || lower(state.ids.get(l.email)).includes(q) || lower(companyName(l)).includes(q));
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">${q ? "No learners match that search." : "No learners yet."}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(l => {
    const name = displayName(l);
    const passes = passedIds(l).size;
    const fails = l.attempts.filter(a => !a.passed).length;
    const passedSet = passedIds(l);
    const current = [...(l.progress || [])]
      .map(p => ({ p, c: catalogCourseFor(p) }))
      .filter(x => !(x.c && passedSet.has(x.c.id)))
      .sort((a, b) => String(b.p.updatedAt || "").localeCompare(String(a.p.updatedAt || "")))[0];
    const currentHtml = current
      ? `<div style="font-size:0.85rem;">${esc(current.c?.title || current.p.courseTitle || current.p.courseId)}</div>${progressBar(current.p.percent)}<span style="font-size:0.8rem;">${esc(current.p.percent || 0)}%${current.p.position ? ` · ${esc(current.p.position)}` : ""}</span>`
      : `<span style="color:var(--text-muted);font-size:0.85rem;">--</span>`;
    return `<tr>
      <td><strong>${esc(name || "(name not entered)")}</strong>
        <button class="btn-action btn-edit-name" data-email="${esc(l.email)}" title="${name ? "Edit this learner's name" : "Add this learner's name"}" style="padding:2px 8px;font-size:0.72rem;margin-left:6px;">${name ? "Edit name" : "Add name"}</button>
        <div style="font-size:0.8rem;color:var(--text-muted);">${state.ids.get(l.email) ? `<strong>${esc(state.ids.get(l.email))}</strong> · ` : ""}${esc(l.email)}${companyName(l) ? ` · ${esc(companyName(l))}` : ""}</div></td>
      <td title="${esc(fmtDate(l.profile.lastSeenAt))}">${esc(ago(l.profile.lastSeenAt))}</td>
      <td>${grantedIds(l).length ? `${grantedIds(l).length} pre-paid` : "--"}</td>
      <td>${l.attempts.length}${fails ? ` <span style="color:#f87171;font-size:0.8rem;">(${fails} failed)</span>` : ""}</td>
      <td>${currentHtml}</td>
      <td>${passes}</td>
      <td><button class="btn-action btn-view-learner" data-email="${esc(l.email)}" style="padding:6px 10px;font-size:0.8rem;">View</button></td>
    </tr>`;
  }).join("");
}

// ---------------------------------------------------------------- profile
async function paidCourseIds(l) {
  if (!l.uid) return [];
  try {
    const snap = await getDocs(query(collection(db, "customers", l.uid, "payments"), where("status", "==", "succeeded")));
    const prices = new Set();
    snap.forEach(d => (d.data().items || []).forEach(i => { if (i?.price?.id) prices.add(i.price.id); }));
    return state.catalog.filter(c => [c.stripePriceId, ...(c.legacyStripePriceIds || [])].some(p => p && prices.has(p))).map(c => c.id);
  } catch (e) {
    console.warn("[learners] payments lookup failed:", e.message);
    return [];
  }
}

async function openProfile(email) {
  const l = state.byEmail.get(lower(email));
  if (!l) return;
  const paid = await paidCourseIds(l);
  const granted = grantedIds(l);
  const rawPlan = state.plans.get(l.email) || {};
  const plan = rawPlan.courseSequence ? { ...rawPlan, courseSequence: [...new Set(rawPlan.courseSequence.map(canonicalId))] } : rawPlan;
  const assigned = [...new Set([...(plan.courseSequence || []), ...paid, ...granted])]
    .filter(id => paid.includes(id) || granted.includes(id) || (plan.courseSequence || []).includes(id));
  // Saved order first, then anything new in catalog order.
  const saved = (plan.courseSequence || []).filter(id => assigned.includes(id));
  const rest = state.catalog.map(c => c.id).filter(id => assigned.includes(id) && !saved.includes(id));
  const ctx = { l, paid, granted, order: [...saved, ...rest], enforce: plan.enforceOrder !== false && !!plan.courseSequence, dirty: false };
  renderProfile(ctx);
}

function courseStatus(l, courseId) {
  const subs = l.submissions.filter(s => catalogCourseFor(s)?.id === courseId);
  const atts = l.attempts.filter(a => catalogCourseFor(a)?.id === courseId);
  const pass = subs.find(s => s.passed !== false);
  if (pass) return { html: `<span class="badge badge-active">Passed</span> <span style="font-size:0.78rem;color:var(--text-muted);">${esc(fmtDate(pass.completedAt, false))}${typeof pass.scorePercent === "number" ? ` · ${pass.scorePercent}%` : ""}</span>`, passed: true };
  const prog = progressFor(l, courseId);
  const progLine = prog ? `<div style="margin-top:4px;">${progressHtml(prog)}</div>` : "";
  if (prog && prog.contentComplete) {
    return { html: `<span class="badge badge-pending" style="text-transform:none;">Content complete${prog.contentCompletedAt ? ` ${esc(fmtDate(prog.contentCompletedAt, false))}` : ""}</span>${progLine}`, passed: false };
  }
  if (atts.some(a => a.passed)) return { html: `<span class="badge badge-pending" style="text-transform:none;">Quiz passed, not finished</span>${progLine}`, passed: false };
  if (atts.length) return { html: `<span class="badge badge-fail">${atts.length} attempt${atts.length === 1 ? "" : "s"}, not passed</span>${progLine}`, passed: false };
  if (prog) return { html: `<span class="badge badge-pending" style="text-transform:none;">In progress</span>${progLine}`, passed: false };
  return { html: `<span style="color:var(--text-muted);font-size:0.85rem;">Not started</span>`, passed: false };
}

function renderProfile(ctx) {
  const { l } = ctx;
  const p = l.profile || {};
  document.getElementById("sela-learner-profile")?.remove();

  const courseRows = ctx.order.map((id, i) => {
    const st = courseStatus(l, id);
    const source = ctx.paid.includes(id) ? "Paid (Stripe)" : ctx.granted.includes(id) ? "Pre-paid" : "In plan only";
    const removable = ctx.granted.includes(id) && !state.grants.get(l.email)?.allCourses;
    return `<tr>
      <td style="width:34px;font-weight:700;color:var(--text-muted);">${i + 1}</td>
      <td>${esc(courseTitle(id))}<div style="font-size:0.75rem;color:var(--text-muted);">${esc(source)}</div></td>
      <td>${st.html}</td>
      <td style="white-space:nowrap;text-align:right;">
        <button class="btn-action lp-up" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Move up" style="padding:4px 8px;">▲</button>
        <button class="btn-action lp-down" data-i="${i}" ${i === ctx.order.length - 1 ? "disabled" : ""} title="Move down" style="padding:4px 8px;">▼</button>
        ${removable ? `<button class="btn-action lp-remove" data-id="${esc(id)}" title="Remove this pre-paid course" style="padding:4px 8px;color:#f87171;">✕</button>` : ""}
      </td></tr>`;
  }).join("") || `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:14px;">No courses yet -- add a pre-paid course below.</td></tr>`;

  const addable = state.catalog.filter(c => !ctx.order.includes(c.id));
  const history = [
    ...l.attempts.map(a => ({ when: a.attemptedAt, course: catalogCourseFor(a)?.title || a.courseTitle || a.courseId, what: `Quiz attempt (${a.quizId || "quiz"})`,
      score: typeof a.scorePercent === "number" ? `${a.scorePercent}%${a.total ? ` (${a.score}/${a.total})` : ""}` : "--", ok: !!a.passed })),
    ...l.submissions.map(s => ({ when: s.completedAt, course: catalogCourseFor(s)?.title || s.courseTitle || s.courseId, what: "Course completed",
      score: typeof s.scorePercent === "number" ? `${s.scorePercent}%` : "--", ok: s.passed !== false,
      extra: s.certificateIssued ? `Certificate ${esc(s.certificateNumber || "")}${s.certificateEmailedAt ? ` · emailed ${esc(fmtDate(s.certificateEmailedAt, false))}` : ""}` : "No certificate yet" })),
  ].sort((a, b) => String(b.when || "").localeCompare(String(a.when || "")));
  const historyRows = history.map(h => `<tr>
      <td style="white-space:nowrap;">${esc(fmtDate(h.when))}</td>
      <td>${esc(h.course)}</td>
      <td>${esc(h.what)}${h.extra ? `<div style="font-size:0.75rem;color:var(--text-muted);">${h.extra}</div>` : ""}</td>
      <td>${esc(h.score)}</td>
      <td>${h.ok ? `<span class="badge badge-active">PASS</span>` : `<span class="badge badge-fail">FAIL</span>`}</td></tr>`).join("")
    || `<tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:14px;">No attempts recorded yet. (Attempts are recorded from the date this feature went live.)</td></tr>`;

  const overlay = document.createElement("div");
  overlay.id = "sela-learner-profile";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.8);backdrop-filter:blur(6px);z-index:9999;overflow:auto;padding:24px 12px;";
  overlay.innerHTML = `
  <div class="panel-card" style="max-width:980px;margin:0 auto;position:relative;">
    <button type="button" id="lp-close" class="btn-action" style="position:absolute;top:16px;right:16px;">Close</button>
    <h2 style="margin-right:90px;">${esc(displayName(l) || l.email)}
      <button type="button" id="lp-edit-name" class="btn-action" style="padding:4px 10px;font-size:0.8rem;margin-left:8px;vertical-align:middle;">${displayName(l) ? "Edit name" : "Add name"}</button></h2>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:4px 0 12px;">
      <button type="button" id="lp-record" class="btn-action btn-primary-action" ${l.uid ? "" : "disabled"}>&#11015; Download Record of Learning (PDF)</button>
      ${l.uid ? "" : `<span style="font-size:0.8rem;color:var(--text-muted);">Available once the learner has signed up.</span>`}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 24px;margin:8px 0 20px;font-size:0.9rem;">
      <div><span style="color:var(--text-muted);">Learner ID</span><br><strong>${esc(state.ids.get(l.email) || "Not assigned yet")}</strong></div>
      <div><span style="color:var(--text-muted);">Email</span><br>${esc(l.email)}</div>
      <div><span style="color:var(--text-muted);">Company</span><br>
        <select id="lp-company" style="margin-top:4px;padding:6px 8px;border-radius:6px;max-width:100%;">
          <option value="">-- None --</option>
          ${[...state.companies].sort((a, b) => String(a[1]).localeCompare(String(b[1]))).map(([id, n]) => `<option value="${esc(id)}" ${state.companyOf.get(l.email) === id ? "selected" : ""}>${esc(n)}</option>`).join("")}
        </select>
        <div id="lp-company-msg" style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${state.companies.size ? "Their company's HR contact will see completed courses." : "Add companies in the Companies tab first."}</div></div>
      <div><span style="color:var(--text-muted);">Last active</span><br>${esc(ago(p.lastSeenAt))}<div style="font-size:0.75rem;color:var(--text-muted);">${esc(fmtDate(p.lastSeenAt))}</div></div>
      <div><span style="color:var(--text-muted);">Last sign-in</span><br>${esc(fmtDate(p.lastSignInAt))}</div>
      <div><span style="color:var(--text-muted);">Date of birth</span><br>${esc(p.dateOfBirth ? fmtDate(p.dateOfBirth + "T00:00:00", false) : "--")}</div>
      <div><span style="color:var(--text-muted);">Postcode</span><br>${esc(p.postcode || "--")}</div>
      <div><span style="color:var(--text-muted);">Account</span><br>${l.uid ? "Signed up" : "Not signed in yet"}</div>
    </div>

    <h3 style="margin:0 0 6px;">Courses &amp; completion order</h3>
    <label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;margin:6px 0 10px;cursor:pointer;">
      <input type="checkbox" id="lp-enforce" ${ctx.enforce ? "checked" : ""} style="width:18px;height:18px;">
      Learner must complete these courses in this order (later courses stay locked until the one before is passed)
    </label>
    <div class="table-container"><table><thead><tr><th>#</th><th>Course</th><th>Status</th><th></th></tr></thead><tbody>${courseRows}</tbody></table></div>
    <div style="display:flex;gap:10px;align-items:center;margin:10px 0 22px;flex-wrap:wrap;">
      <button type="button" id="lp-save-order" class="btn-action btn-primary-action">Save order</button>
      <span id="lp-order-msg" style="font-size:0.85rem;color:var(--text-muted);">${ctx.dirty ? "Unsaved changes" : ""}</span>
    </div>

    <h3 style="margin:0 0 8px;">Add a pre-paid course</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">
      <select id="lp-add-course" style="flex:1 1 240px;padding:10px;border-radius:6px;">
        ${addable.length ? addable.map(c => `<option value="${esc(c.id)}">${esc(c.title || c.id)}${c.code ? ` (${esc(c.code)})` : ""}</option>`).join("") : `<option value="">All courses already assigned</option>`}
      </select>
      <input id="lp-add-note" placeholder="Billing note (e.g. Invoice #123, Fulton Hogan)" style="flex:1 1 240px;padding:10px;border-radius:6px;">
      <button type="button" id="lp-add-btn" class="btn-action btn-primary-action" ${addable.length ? "" : "disabled"}>Add course</button>
    </div>

    <h3 style="margin:0 0 8px;">Attempts &amp; outcomes</h3>
    <div class="table-container"><table><thead><tr><th>When</th><th>Course</th><th>What</th><th>Score</th><th>Result</th></tr></thead><tbody>${historyRows}</tbody></table></div>
  </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => { overlay.remove(); document.body.style.overflow = ""; };
  overlay.querySelector("#lp-close").addEventListener("click", close);
  overlay.querySelector("#lp-company").addEventListener("change", async (e) => {
    const sel = e.currentTarget;
    const msgEl = overlay.querySelector("#lp-company-msg");
    sel.disabled = true;
    try {
      await saveLearnerCompany(l.email, sel.value);
      msgEl.textContent = sel.value ? `Saved. ${state.companies.get(sel.value)}'s HR contact can now see ${displayName(l) || l.email}'s completed courses.` : "Saved. No company.";
      msgEl.style.color = "#4ade80";
      renderTable();
    } catch (err) {
      showModal({ title: "Could not save company", message: err.message, type: "error" });
    } finally { sel.disabled = false; }
  });
  overlay.querySelector("#lp-edit-name").addEventListener("click", async () => {
    if (await saveLearnerName(l.email, displayName(l))) { renderProfile(ctx); renderTable(); }
  });

  // Same Record of Learning PDF the learner downloads from Your Courses
  // (js/record-of-learning.js), built for this learner by an admin.
  overlay.querySelector("#lp-record")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!l.uid) return;
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Preparing PDF...";
    try {
      const learner = { uid: l.uid, email: l.email, displayName: displayName(l) || l.email, metadata: {} };
      const courses = ctx.order.map(id => {
        const c = state.catalog.find(x => x.id === id) || {};
        return { id, title: c.title || courseTitle(id), code: c.code || "" };
      });
      await downloadRecordOfLearning({ user: learner, courses });
    } catch (err) {
      showModal({ title: "Could not create the Record of Learning", message: err.message, type: "error" });
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

  const move = (i, dir) => {
    const j = i + dir;
    [ctx.order[i], ctx.order[j]] = [ctx.order[j], ctx.order[i]];
    ctx.dirty = true;
    renderProfile(ctx);
  };
  overlay.querySelectorAll(".lp-up").forEach(b => b.addEventListener("click", () => move(Number(b.dataset.i), -1)));
  overlay.querySelectorAll(".lp-down").forEach(b => b.addEventListener("click", () => move(Number(b.dataset.i), 1)));
  overlay.querySelector("#lp-enforce").addEventListener("change", e => {
    ctx.enforce = e.target.checked; ctx.dirty = true;
    overlay.querySelector("#lp-order-msg").textContent = "Unsaved changes";
  });

  overlay.querySelector("#lp-save-order").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const data = { email: l.email, courseSequence: ctx.order, enforceOrder: ctx.enforce,
        updatedBy: auth.currentUser?.email || "unknown", updatedAt: new Date().toISOString() };
      await setDoc(doc(db, "learner_plans", l.email), data);
      state.plans.set(l.email, data);
      ctx.dirty = false;
      overlay.querySelector("#lp-order-msg").textContent = ctx.enforce ? "Saved -- the learner must now follow this order." : "Saved -- order shown to the learner, but not enforced.";
      overlay.querySelector("#lp-order-msg").style.color = "#4ade80";
    } catch (err) {
      showModal({ title: "Could not save order", message: err.message, type: "error" });
    } finally { btn.disabled = false; }
  });

  overlay.querySelector("#lp-add-btn").addEventListener("click", async (e) => {
    const id = overlay.querySelector("#lp-add-course").value;
    if (!id) return;
    const note = overlay.querySelector("#lp-add-note").value.trim();
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const payload = { email: l.email, courseIds: arrayUnion(id), lastGrantedBy: auth.currentUser?.email || "unknown", lastGrantedAt: new Date().toISOString() };
      if (note) payload.billingNote = note;
      await setDoc(doc(db, "grants", l.email), payload, { merge: true });
      const g = state.grants.get(l.email) || { courseIds: [] };
      g.courseIds = [...new Set([...(g.courseIds || []), id])];
      if (note) g.billingNote = note;
      state.grants.set(l.email, g);
      ctx.granted = grantedIds(l);
      ctx.order.push(id);
      // Keep the saved order in step so the new course lands at the end.
      if (state.plans.get(l.email)) {
        const plan = { ...state.plans.get(l.email), courseSequence: ctx.order, updatedAt: new Date().toISOString(), updatedBy: auth.currentUser?.email || "unknown" };
        await setDoc(doc(db, "learner_plans", l.email), plan);
        state.plans.set(l.email, plan);
      }
      renderProfile(ctx);
      renderTable();
    } catch (err) {
      btn.disabled = false;
      showModal({ title: "Could not add course", message: err.message, type: "error" });
    }
  });

  overlay.querySelectorAll(".lp-remove").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.id;
    if (!window.confirm(`Remove "${courseTitle(id)}" from ${l.email}'s pre-paid courses? Their past attempts and results are kept.`)) return;
    try {
      const oldIds = Object.keys(LEGACY_IDS).filter(k => LEGACY_IDS[k] === id); // also remove grants made under an old id
      await setDoc(doc(db, "grants", l.email), { courseIds: arrayRemove(id, ...oldIds), lastGrantedBy: auth.currentUser?.email || "unknown", lastGrantedAt: new Date().toISOString() }, { merge: true });
      const g = state.grants.get(l.email);
      if (g) g.courseIds = (g.courseIds || []).filter(x => canonicalId(x) !== id);
      ctx.granted = grantedIds(l);
      if (!ctx.paid.includes(id)) ctx.order = ctx.order.filter(x => x !== id);
      if (state.plans.get(l.email)) {
        const plan = { ...state.plans.get(l.email), courseSequence: ctx.order, updatedAt: new Date().toISOString() };
        await setDoc(doc(db, "learner_plans", l.email), plan);
        state.plans.set(l.email, plan);
      }
      renderProfile(ctx);
      renderTable();
    } catch (err) {
      showModal({ title: "Could not remove course", message: err.message, type: "error" });
    }
  }));
}

// ---------------------------------------------------------------- wiring
document.getElementById("learners-search")?.addEventListener("input", renderTable);
document.getElementById("btn-refresh-learners")?.addEventListener("click", loadAll);
window.addEventListener("sela:companies-changed", loadAll);
document.getElementById("learners-tbody")?.addEventListener("click", async e => {
  const nameBtn = e.target.closest(".btn-edit-name");
  if (nameBtn) {
    const l = state.byEmail.get(lower(nameBtn.dataset.email));
    if (l && await saveLearnerName(l.email, displayName(l))) renderTable();
    return;
  }
  const b = e.target.closest(".btn-view-learner");
  if (b) openProfile(b.dataset.email);
});

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) return;
  try {
    const a = await getDoc(doc(db, "admins", user.uid));
    if (a.exists()) loadAll();
  } catch (_) {}
});
