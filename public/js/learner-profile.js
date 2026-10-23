// ============================================================================
// File: public/js/learner-profile.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: First-visit learner details. The first time a learner reaches
//              Your Courses (learner.html) they must enter their first name,
//              last name, date of birth and postcode before continuing.
//              Saved on users/{uid} (owner-writable; admins can read it), and
//              the name is what admin.html prints on certificates.
// ============================================================================

import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function isComplete(p) {
  return !!(p && p.firstName && p.lastName && p.dateOfBirth && p.postcode);
}

function esc(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** Resolves once the signed-in learner has a complete profile. */
export async function ensureLearnerProfile(user, db) {
  const ref = doc(db, "users", user.uid);
  let existing = {};
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existing = snap.data() || {};
  } catch (e) {
    console.warn("[profile] lookup failed:", e.message);
    return; // never lock a learner out because of a read error
  }
  if (isComplete(existing)) return;

  // Pre-fill names from the Google/display name if we have one.
  const parts = (user.displayName || "").trim().split(/\s+/);
  const preFirst = existing.firstName || (parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "");
  const preLast = existing.lastName || (parts.length > 1 ? parts[parts.length - 1] : "");

  return new Promise(resolve => {
    const today = new Date();
    const maxDob = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

    const overlay = document.createElement("div");
    overlay.id = "sela-profile-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.8);backdrop-filter:blur(6px);" +
      "display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;";
    overlay.innerHTML = `
      <form id="sela-profile-form" novalidate style="background:#1e293b;border:1px solid rgba(255,255,255,.15);
        border-radius:12px;max-width:440px;width:100%;padding:26px 22px;color:#f8fafc;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
        box-shadow:0 20px 40px rgba(0,0,0,.4);max-height:calc(100vh - 32px);overflow:auto;">
        <h2 style="margin:0 0 6px;font-size:1.3rem;">Welcome to Sela training</h2>
        <p style="margin:0 0 18px;color:#94a3b8;font-size:.92rem;line-height:1.45;">
          Before you start, please enter your details. Your name will appear on your certificates
          exactly as typed here, so please use your full legal name.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <label style="font-size:.85rem;">First name
            <input name="firstName" autocomplete="given-name" required maxlength="60" value="${esc(preFirst)}"></label>
          <label style="font-size:.85rem;">Last name
            <input name="lastName" autocomplete="family-name" required maxlength="60" value="${esc(preLast)}"></label>
        </div>
        <label style="font-size:.85rem;display:block;margin-top:12px;">Date of birth
          <input name="dateOfBirth" type="date" autocomplete="bday" required max="${maxDob}" min="1920-01-01"
            value="${esc(existing.dateOfBirth)}"></label>
        <label style="font-size:.85rem;display:block;margin-top:12px;">Postcode
          <input name="postcode" inputmode="numeric" autocomplete="postal-code" required maxlength="4"
            placeholder="e.g. 3620" value="${esc(existing.postcode)}"></label>
        <p id="sela-profile-error" style="color:#f87171;font-size:.85rem;min-height:1.2em;margin:12px 0 0;"></p>
        <button type="submit" style="margin-top:10px;width:100%;padding:12px;border:none;border-radius:8px;
          background:#22c55e;color:#0f172a;font-weight:700;font-size:1rem;cursor:pointer;">Save and continue</button>
        <p style="margin:12px 0 0;color:#64748b;font-size:.75rem;line-height:1.4;">
          Used only to identify you on training records and certificates issued by Sela Civil Advisory Ltd.</p>
      </form>`;
    overlay.querySelectorAll("input").forEach(i => {
      i.style.cssText = "display:block;width:100%;margin-top:4px;padding:10px;border-radius:6px;" +
        "border:1px solid rgba(255,255,255,.2);background:#0f172a;color:#f8fafc;font-size:1rem;box-sizing:border-box;";
    });
    document.body.appendChild(overlay);

    const form = overlay.querySelector("#sela-profile-form");
    const errEl = overlay.querySelector("#sela-profile-error");
    const btn = form.querySelector("button");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(form);
      const tidy = s => String(s || "").trim().replace(/\s+/g, " ");
      const firstName = tidy(f.get("firstName"));
      const lastName = tidy(f.get("lastName"));
      const dateOfBirth = String(f.get("dateOfBirth") || "");
      const postcode = String(f.get("postcode") || "").trim();

      if (!firstName || !lastName) { errEl.textContent = "Please enter your first and last name."; return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || dateOfBirth > maxDob || dateOfBirth < "1920-01-01") {
        errEl.textContent = "Please enter a valid date of birth."; return;
      }
      if (!/^\d{4}$/.test(postcode)) { errEl.textContent = "Please enter your 4-digit postcode."; return; }

      errEl.textContent = "";
      btn.disabled = true;
      btn.textContent = "Saving...";
      try {
        await setDoc(doc(db, "users", user.uid), {
          firstName, lastName, dateOfBirth, postcode,
          email: (user.email || "").toLowerCase(),
          profileCompletedAt: new Date().toISOString(),
        }, { merge: true });
        try { await updateProfile(user, { displayName: `${firstName} ${lastName}` }); } catch (_) {}
        overlay.remove();
        resolve();
      } catch (err) {
        console.error("[profile] save failed:", err);
        errEl.textContent = "Couldn't save your details. Please check your connection and try again.";
        btn.disabled = false;
        btn.textContent = "Save and continue";
      }
    });
  });
}
