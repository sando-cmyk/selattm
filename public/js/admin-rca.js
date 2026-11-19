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
        <td><strong>${esc(x.name)}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.email)} · ${esc(x.phone)}</div></td>
        <td>${esc(x.organisation)}<div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.role)}</div></td>
        <td style="max-width:280px;font-size:0.85rem;">${esc(x.reason)}</td>
        <td>${esc(fmt(x.requestedAt))}</td>
        <td style="white-space:nowrap;"><button class="btn-action btn-primary-action rca-approve" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;">Approve</button>
          <button class="btn-action rca-decline" data-email="${esc(x.id)}" style="padding:6px 10px;font-size:0.8rem;color:#f87171;">Decline</button></td></tr>`).join("")
      || `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:16px;">No requests waiting.</td></tr>`);

    set("rca-users-tbody", users.map(x => `<tr>
        <td><strong>${esc(x.name || "")}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${esc(x.id)}</div></td>
        <td>${esc(x.organisation)}</td>
        <td>${esc(fmt(x.approvedAt))}<div style="font-size:0.75rem;color:var(--text-muted);">by ${esc(x.approvedBy)}</div></td>
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
      if (!window.confirm(`Approve ${req.name} (${req.organisation}) to check Sela certificates by learner ID?`)) return;
      const now = new Date().toISOString();
      await setDoc(doc(db, "rca_users", email), { email, name: req.name || "", organisation: req.organisation || "", role: req.role || "", phone: req.phone || "", approvedBy: who(), approvedAt: now });
      await setDoc(doc(db, "rca_access_requests", email), { status: "approved", decidedBy: who(), decidedAt: now }, { merge: true });
      await load();
      if (window.confirm(`${req.name} is approved.\n\nOpen a pre-written email to let them know?`)) window.location.href = approvedEmailLink(email, req.name);
    } else if (b.classList.contains("rca-decline")) {
      if (!window.confirm(`Decline ${req.name}'s request? They'll see that it wasn't approved.`)) return;
      await setDoc(doc(db, "rca_access_requests", email), { status: "declined", decidedBy: who(), decidedAt: new Date().toISOString() }, { merge: true });
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
