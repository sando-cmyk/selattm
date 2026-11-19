// ============================================================================
// File: public/js/admin-companies.js
// admin.html -> Companies tab.
//   - Keep the list of employer companies (companies/{companyId}).
//   - Add / remove each company's HR contacts (company_managers/{email}).
//     An HR contact signs in at selattm.com with that email and opens the
//     Company Portal (enterprise.html) to see their staff's completed
//     courses and export a summary (CSV / PDF).
//   - Staff are linked to a company in the Learners tab (admin-learners.js),
//     which writes learner_profiles/{email}.companyId.
// ============================================================================
import { auth, db, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onAuthStateChanged } from "./firebase-init.js";
import { showModal } from "./modal.js";

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lower = v => String(v || "").trim().toLowerCase();
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const who = () => auth.currentUser?.email || "unknown";

const state = { companies: [], managers: [], staffCount: new Map() };

function slugFor(name) {
  return lower(name).replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
}

async function loadCompanies() {
  const tbody = document.getElementById("companies-tbody");
  if (!tbody) return;
  try {
    const [companies, managers, profiles] = await Promise.all(
      ["companies", "company_managers", "learner_profiles"].map(n => getDocs(collection(db, n))));
    state.companies = companies.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    state.managers = managers.docs.map(d => ({ email: d.id, ...d.data() }));
    state.staffCount = new Map();
    profiles.forEach(d => { const c = d.data().companyId; if (c) state.staffCount.set(c, (state.staffCount.get(c) || 0) + 1); });
    render();
  } catch (err) {
    console.warn("[companies] load failed:", err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Couldn't load companies: ${esc(err.message)}</td></tr>`;
  }
}

function render() {
  const tbody = document.getElementById("companies-tbody");
  if (!state.companies.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No companies yet. Add one above.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.companies.map(c => {
    const hr = state.managers.filter(m => m.companyId === c.id);
    const hrHtml = hr.map(m => `<div style="margin-bottom:4px;">${esc(m.email)}
        <button class="btn-action co-hr-email" data-email="${esc(m.email)}" data-company="${esc(c.id)}" style="padding:2px 6px;font-size:0.72rem;margin-left:4px;">Invite email</button>
        <button class="btn-action co-hr-remove" data-email="${esc(m.email)}" style="padding:2px 6px;font-size:0.72rem;color:#f87171;">Remove</button></div>`).join("")
      || `<span style="color:var(--text-muted);font-size:0.85rem;">None yet</span>`;
    const staff = state.staffCount.get(c.id) || 0;
    return `<tr>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${staff}</td>
      <td>${hrHtml}<button class="btn-action co-hr-add" data-company="${esc(c.id)}" style="padding:4px 8px;font-size:0.78rem;margin-top:4px;">+ Add HR contact</button></td>
      <td style="white-space:nowrap;">
        <a class="btn-action" href="enterprise.html?company=${encodeURIComponent(c.id)}" target="_blank" rel="noopener" style="padding:6px 10px;font-size:0.8rem;text-decoration:none;display:inline-block;">View report</a>
        <button class="btn-action co-rename" data-company="${esc(c.id)}" style="padding:6px 10px;font-size:0.8rem;">Rename</button>
        ${staff || hr.length ? "" : `<button class="btn-action co-delete" data-company="${esc(c.id)}" style="padding:6px 10px;font-size:0.8rem;color:#f87171;">Delete</button>`}
      </td></tr>`;
  }).join("");
}

function inviteEmailLink(email, companyName) {
  const subject = `Your Sela Company Training Portal access - ${companyName}`;
  const body =
    `Kia ora,\n\n` +
    `You've been set up as the training contact for ${companyName} on Sela Skills Hub. ` +
    `You can now see which courses your staff have completed and download a summary for each course.\n\n` +
    `1. Go to https://selattm.com/login.html\n` +
    `2. Sign in with this email address (${email}). If you don't have an account yet, choose "Create Account" ` +
    `using this same email, or "Sign in with Google" if it's a Google account.\n` +
    `3. If asked, confirm your email address using the link we send you.\n` +
    `4. You'll be taken to the Company Portal. You can also open it any time from the "Company Portal" link at the top of the site.\n\n` +
    `Nga mihi,\nJoseph Rosendaal\nTraining Manager, Sela Civil Advisory Ltd\njoseph@selacivil.co.nz | 027 267 7264`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------------------------------------------------------------- actions
document.getElementById("btn-add-company")?.addEventListener("click", async (e) => {
  const input = document.getElementById("company-name-input");
  const msg = document.getElementById("company-status-msg");
  const name = String(input?.value || "").trim().replace(/\s+/g, " ");
  if (!name) { msg.textContent = "Enter the company name."; msg.style.color = "#f87171"; return; }
  if (state.companies.some(c => lower(c.name) === lower(name))) { msg.textContent = `${name} is already in the list.`; msg.style.color = "#f87171"; return; }
  let id = slugFor(name);
  if (state.companies.some(c => c.id === id)) id = `${id}-${Date.now().toString(36)}`;
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    await setDoc(doc(db, "companies", id), { name, createdBy: who(), createdAt: new Date().toISOString() });
    input.value = "";
    msg.textContent = `Added ${name}. Now link its staff in the Learners tab and add an HR contact below.`;
    msg.style.color = "#22c55e";
    await loadCompanies();
    window.dispatchEvent(new CustomEvent("sela:companies-changed"));
  } catch (err) {
    msg.textContent = "Failed: " + err.message; msg.style.color = "#f87171";
  } finally { btn.disabled = false; }
});

document.getElementById("companies-tbody")?.addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const company = state.companies.find(c => c.id === b.dataset.company);
  try {
    if (b.classList.contains("co-hr-add") && company) {
      const email = lower(window.prompt(`Email address of the HR contact for ${company.name}.\nThey'll sign in at selattm.com with this email to see their staff's completed courses.`) || "");
      if (!email) return;
      if (!validEmail(email)) { showModal({ title: "Not added", message: "That doesn't look like an email address.", type: "error" }); return; }
      const existing = await getDoc(doc(db, "company_managers", email));
      if (existing.exists() && existing.data().companyId !== company.id) {
        const other = state.companies.find(c => c.id === existing.data().companyId)?.name || existing.data().companyName || "another company";
        if (!window.confirm(`${email} is currently the HR contact for ${other}. Move them to ${company.name}? They'll stop seeing ${other}'s staff.`)) return;
      }
      await setDoc(doc(db, "company_managers", email), {
        email, companyId: company.id, companyName: company.name, addedBy: who(), addedAt: new Date().toISOString(),
      });
      await loadCompanies();
      if (window.confirm(`${email} can now see ${company.name}'s completed courses.\n\nOpen a pre-written invite email to send them?`)) {
        window.location.href = inviteEmailLink(email, company.name);
      }
    } else if (b.classList.contains("co-hr-email")) {
      const c = state.companies.find(x => x.id === b.dataset.company);
      window.location.href = inviteEmailLink(b.dataset.email, c?.name || "your company");
    } else if (b.classList.contains("co-hr-remove")) {
      if (!window.confirm(`Remove ${b.dataset.email}'s access to the Company Portal? They will no longer see any staff results.`)) return;
      await deleteDoc(doc(db, "company_managers", b.dataset.email));
      await loadCompanies();
    } else if (b.classList.contains("co-rename") && company) {
      const name = String(window.prompt(`New name for ${company.name}:`, company.name) || "").trim().replace(/\s+/g, " ");
      if (!name || name === company.name) return;
      await setDoc(doc(db, "companies", company.id), { name, renamedBy: who(), renamedAt: new Date().toISOString() }, { merge: true });
      await Promise.all(state.managers.filter(m => m.companyId === company.id)
        .map(m => setDoc(doc(db, "company_managers", m.email), { companyName: name }, { merge: true })));
      await loadCompanies();
      window.dispatchEvent(new CustomEvent("sela:companies-changed"));
    } else if (b.classList.contains("co-delete") && company) {
      if (!window.confirm(`Delete ${company.name}? It has no staff or HR contacts.`)) return;
      await deleteDoc(doc(db, "companies", company.id));
      await loadCompanies();
      window.dispatchEvent(new CustomEvent("sela:companies-changed"));
    }
  } catch (err) {
    console.error("[companies]", err);
    showModal({ title: "Something went wrong", message: err.message, type: "error" });
  }
});

// Staff counts change when a learner's company is set in the Learners tab.
window.addEventListener("sela:learner-company-changed", loadCompanies);

onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) return;
  try {
    const a = await getDoc(doc(db, "admins", user.uid));
    if (a.exists()) loadCompanies();
  } catch (_) {}
});
