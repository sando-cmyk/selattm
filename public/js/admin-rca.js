// ============================================================================
// File: public/js/admin-rca.js
// admin.html -> RCA Access. Road Controlling Authority staff request access
// on rca.html (rca_access_requests/{email}); approve or decline them here.
// Approving writes rca_users/{email}, which lets them look up a learner ID
// and see the person's name + certificates held (via the rcaLookup Cloud
// Function). Every lookup is logged to rca_lookups and listed here.
// ============================================================================
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onAuthStateChanged } from "./firebase-init.js";
import { showModal } from "./modal.js";

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = iso => iso ? new Date(iso).toLocaleString("en-NZ", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "--";
const who = () => auth.currentUser?.email || "unknown";
let requests = [], users = [];
const RCA_EMAIL = /@([a-z0-9-]+\.)+govt\.nz$/; // council / NZTA only, as on rca.html
const domainOf = e => String(e || "").split("@")[1] || "";
const METHODS = [
  "Phoned the organisation's main number and confirmed they work there",
  "Emailed a known contact at the organisation, who confirmed",
  "Known to Sela personally / existing working relationship",
  "Confirmed with their manager",
  "Other (explain in the note)",
];

// Approval form: Sela records HOW the person was checked before access is given.
function verificationForm(req) {
  return new Promise(resolve => {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.8);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";
    ov.innerHTML = `<form class="panel-card" style="max-width:560px;width:100%;margin:0;">
      <h2 style="margin-bottom:6px;">Approve RCA access</h2>
      <div style="font-size:0.9rem;line-height:1.6;margin-bottom:14px;">
        <strong>${esc(req.name)}</strong> &middot; ${esc(req.role)}<br>
        ${esc(req.organisation)}<br>
        <span style="color:var(--text-muted);">${esc(req.id)} &middot; ${esc(req.phone)}</span><br>
        <span style="color:var(--text-muted);">Email domain: <strong style="color:var(--text-main);">${esc(domainOf(req.id))}</strong> &mdash; does it belong to ${esc(req.organisation)}?</span>
      </div>
      <label style="display:block;font-size:0.85rem;margin-bottom:10px;">How did you check them?
        <select name="method" required style="display:block;width:100%;margin-top:4px;padding:8px;border-radius:6px;background:#0f172a;color:#f8fafc;border:1px solid #334155;">
          <option value="">Choose...</option>${METHODS.map(m => `<option>${esc(m)}</option>`).join("")}
        </select></label>
      <label style="display:block;font-size:0.85rem;margin-bottom:10px;">Note (who you spoke to, when, anything else)
        <textarea name="note" required rows="3" maxlength="500" placeholder="e.g. Called TCDC reception 20/11, put through to Jane Smith, Corridor Access team lead, who confirmed" style="display:block;width:100%;margin-top:4px;padding:8px;border-radius:6px;background:#0f172a;color:#f8fafc;border:1px solid #334155;font-family:inherit;"></textarea></label>
      <label style="display:flex;gap:8px;align-items:flex-start;font-size:0.85rem;margin-bottom:12px;">
        <input type="checkbox" name="confirmed" required style="width:18px;height:18px;margin-top:2px;">
        I have confirmed ${esc(req.name)} works for ${esc(req.organisation)} and needs to check Sela certificates for their role.</label>
      <p class="vf-err" style="color:#f87171;font-size:0.85rem;min-height:1.2em;margin:0 0 8px;"></p>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button type="button" class="btn-action vf-cancel">Cancel</button>
        <button type="submit" class="btn-action btn-primary-action">Approve access</button>
      </div></form>`;
    document.body.appendChild(ov);
    const form = ov.querySelector("form");
    const done = v => { ov.remove(); resolve(v); };
    ov.querySelector(".vf-cancel").onclick = () => done(null);
    form.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(form);
      const method = String(f.get("method") || ""), note = String(f.get("note") || "").trim();
      if (!method || note.length < 5 || !f.get("confirmed")) { ov.querySelector(".vf-err").textContent = "Choose how you checked them, add a note and tick the confirmation."; return; }
      done({ method, note });
    };
  });
}

function approvedEmailLink(email, name) {
  const subject = "Your Sela RCA certificate check access is approved";
  const body = `Kia ora ${(name || "").split(" ")[0] || ""},\n\n` +
    `Your access to the Sela certificate check has been approved.\n\n` +
    `Go to https://selattm.com/rca.html and sign in with ${email}. Enter a worker's Sela learner ID (e.g. SELA1234) ` +
    `to see their name and the Sela certificates they hold. You can download each check as a PDF.\n\n` +
    `Please only check workers you have a genuine reason to, e.g. on your network. Every check is logged.\n\n` +
    `Nga mihi,\nJoseph Rosendaal\nTraining Manager, Sela Civil Advisory Ltd\njoseph@selacivil.co.nz | 027 267 7264`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function load() {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  try {
    const [r, u, l] = await Promise.all(["rca_access_requests", "rca_users", "rca_lookups"].map(n => getDocs(collection(db, n))));
    requests = r.docs.map(d => ({ id: d.id, ...d.data() }));
    users = u.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.organisation).localeCompare(String(b.organisation)));
    const lookups = l.docs.map(d => d.data()).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 100);

    const pending = requests.filter(x => x.status === "pending").sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
    const count = document.getElementById("tab-count-rca");
    if (count) count.textContent = pending.length ? `(${pending.length})` : "";

    set("rca-requests-tbody", pending.map(x => `<tr>
        <td><strong>${esc(x.name)}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.id)} · ${esc(x.phone)}</div>${RCA_EMAIL.test(x.id) ? "" : `<div style="font-size:0.75rem;color:#f87171;">Not a council/NZTA email -- can't be approved</div>`}</td>
        <td>${esc(x.organisation)}<div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.role)} · domain ${esc(domainOf(x.id))}</div></td>
        <td style="max-width:280px;font-size:0.85rem;">${esc(x.reason)}</td>
        <td>${esc(fmt(x.requestedAt))}</td>
        <td style="white-space:nowrap;"><button class="btn-action btn-primary-action rca-approve" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;">Approve</button>
          <button class="btn-action rca-decline" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;color:#f87171;">Decline</button></td></tr>`).join("")
      || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px;">No requests waiting.</td></tr>`);

    set("rca-users-tbody", users.map(x => `<tr>
        <td><strong>${esc(x.name || "")}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.id)}</div></td>
        <td>${esc(x.organisation)}</td>
        <td>${esc(fmt(x.approvedAt))}<div style="font-size:0.75rem;color:var(--text-muted);">by ${esc(x.approvedBy)}</div>
          ${x.verification ? `<div style="font-size:0.75rem;margin-top:4px;max-width:320px;"><strong>Checked:</strong> ${esc(x.verification.method)}<br><em>${esc(x.verification.note)}</em></div>` : `<div style="font-size:0.75rem;color:#f59e0b;">No check recorded</div>`}</td>
        <td style="white-space:nowrap;"><button class="btn-action rca-email" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;">Draft email</button>
          <button class="btn-action rca-revoke" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;color:#f87171;">Remove access</button></td></tr>`).join("")
      || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:16px;">No one approved yet.</td></tr>`);

    set("rca-lookups-tbody", lookups.map(x => `<tr>
        <td>${esc(fmt(x.at))}</td><td>${esc(x.by)}<div style="font-size:0.75rem;color:var(--text-muted);">${esc(x.organisation)}</div></td>
        <td>${esc(x.learnerId)}</td><td>${x.found ? `${x.certificates} certificate${x.certificates === 1 ? "" : "s"}` : `<span style="color:#f59e0b;">ID not found</span>`}</td></tr>`).join("")
      || `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:16px;">No checks yet.</td></tr>`);
  } catch (err) {
    console.warn("[rca] load failed:", err);
    set("rca-requests-tbody", `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Couldn't load: ${esc(err.message)}</td></tr>`);
  }
}

document.getElementById("tab-rca")?.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || !b.dataset.email) return;
  const email = b.dataset.email;
  const req = requests.find(x => x.id === email) || {};
  try {
    if (b.classList.contains("rca-approve")) {
      if (!RCA_EMAIL.test(email)) {
        showModal({ title: "Can't approve", message: `${email} isn't a council or NZTA email address (ending in .govt.nz). Decline this request and ask them to sign up with their work email.`, type: "error" });
        return;
      }
      const check = await verificationForm(req);
      if (!check) return;
      const now = new Date().toISOString();
      const verification = { method: check.method, note: check.note, confirmedBy: who(), confirmedAt: now };
      await setDoc(doc(db, "rca_users", email), { email, name: req.name || "", organisation: req.organisation || "", role: req.role || "", phone: req.phone || "", approvedBy: who(), approvedAt: now, verification });
      await setDoc(doc(db, "rca_access_requests", email), { status: "approved", decidedBy: who(), decidedAt: now, verification }, { merge: true });
      await load();
      if (window.confirm(`${req.name} is approved.\n\nOpen a pre-written email to let them know?`)) window.location.href = approvedEmailLink(email, req.name);
    } else if (b.classList.contains("rca-decline")) {
      const reason = window.prompt(`Decline ${req.name}'s request?\n\nReason, for Sela's records (not shown to them):`, RCA_EMAIL.test(email) ? "" : "Not a council/NZTA email address");
      if (reason === null) return;
      await setDoc(doc(db, "rca_access_requests", email), { status: "declined", declineReason: reason.trim(), decidedBy: who(), decidedAt: new Date().toISOString() }, { merge: true });
      await load();
    } else if (b.classList.contains("rca-revoke")) {
      if (!window.confirm(`Remove ${email}'s access to the certificate check?`)) return;
      await deleteDoc(doc(db, "rca_users", email));
      const r = await getDoc(doc(db, "rca_access_requests", email));
      if (r.exists()) await setDoc(doc(db, "rca_access_requests", email), { status: "revoked", decidedBy: who(), decidedAt: new Date().toISOString() }, { merge: true });
      await load();
    } else if (b.classList.contains("rca-email")) {
      const u = users.find(x => x.id === email) || {};
      window.location.href = approvedEmailLink(email, u.name);
    }
  } catch (err) {
    console.error("[rca]", err);
    showModal({ title: "Something went wrong", message: err.message, type: "error" });
  }
});
document.getElementById("btn-refresh-rca")?.addEventListener("click", load);

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) return;
  try { if ((await getDoc(doc(db, "admins", user.uid))).exists()) load(); } catch (_) {}
});
