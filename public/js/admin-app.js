// ============================================================================
// File: public/js/admin-app.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Secured operations console with built-in database repair utility.
// ============================================================================

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  query, 
  limit 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { normaliseCourseRecord } from "./admin-importer.js";
import { showModal } from "./modal.js";

const auth = getAuth();
const db = getFirestore();

// ============================================================================
// 1. AUTH GATEWAY & ACCESS CONTROL
// ============================================================================
onAuthStateChanged(auth, async (user) => {
  if (!user || user.isAnonymous) {
    document.body.innerHTML = `
      <div style="padding: 4rem 2rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; min-height: 100vh; color: #f8fafc;">
        <h2 style="font-size: 1.75rem; margin-bottom: 12px; color: #38bdf8;">Sign In Required</h2>
        <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 24px;">This console is restricted to administrators.</p>
        <a href="login.html" style="display: inline-block; background: #0284c7; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Sign In</a>
      </div>
    `;
    return;
  }

  try {
    const adminSnap = await getDoc(doc(db, "admins", user.uid));
    if (!adminSnap.exists()) {
      document.body.innerHTML = `
        <div style="padding: 4rem 2rem; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; min-height: 100vh; color: #f8fafc;">
          <h2 style="font-size: 1.75rem; margin-bottom: 12px; color: #f87171;">Access Restricted</h2>
          <p style="color: #94a3b8; font-size: 1rem; margin-bottom: 24px;">Your account (${user.email || user.uid}) does not have administrator access.</p>
          <a href="index.html" style="display: inline-block; background: #334155; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Return to Home</a>
        </div>
      `;
      return;
    }

    // Authenticated admin verified — boot the dashboard
    refreshAdminDashboard();
  } catch (err) {
    console.error("Admin verification error:", err);
  }
});

// ============================================================================
// 2. DASHBOARD DATA FETCHING & RENDERING
// ============================================================================

export async function fetchAdminCourseCatalog() {
  try {
    const snap = await getDocs(collection(db, "courses"));
    if (!snap.empty) {
      const courses = [];
      snap.forEach(docSnap => {
        courses.push({ id: docSnap.id, ...docSnap.data() });
      });
      return courses;
    }
  } catch (firestoreErr) {
    console.warn("Firestore course query failed:", firestoreErr);
  }

  try {
    const res = await fetch("/data/courses.json", { cache: "no-cache" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (jsonErr) {
    console.warn("Could not read local /data/courses.json:", jsonErr);
  }

  return [];
}

function renderCourseTable(courses) {
  const tbody = document.getElementById("courses-tbody");
  const kpiCount = document.getElementById("kpi-course-count");

  if (kpiCount) {
    kpiCount.textContent = courses ? courses.length : 0;
  }

  if (!tbody) return;

  if (!courses || !courses.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 24px;">No courses indexed. Use the Drag & Drop engine above to upload.</td></tr>`;
    return;
  }

  tbody.innerHTML = courses.map(course => {
    const code = course.code || course.id || "N/A";
    const title = course.title || "Untitled Module";
    const price = Number(course.price || 0).toFixed(2);
    const currency = course.currency || "NZD";
    const status = course.status || "active";
    const launch = course.launchPath || `/courses/${course.id}/index.html`;

    return `
      <tr>
        <td><strong style="color: #38bdf8;">${code}</strong></td>
        <td>${title}</td>
        <td>${currency} $${price}</td>
        <td><span class="badge badge-active">${status}</span></td>
        <td><code>${launch}</code></td>
      </tr>
    `;
  }).join("");
}

async function loadInquiries() {
  const tbody = document.getElementById("inquiries-tbody");
  const kpiInquiries = document.getElementById("kpi-inquiries-count");

  try {
    const q = query(collection(db, "contact_inquiries"), limit(10));
    const snap = await getDocs(q);

    if (kpiInquiries) {
      kpiInquiries.textContent = snap.size;
    }

    if (!tbody) return;

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No inquiries received yet.</td></tr>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const sender = data.name || data.company || data.email || "Anonymous";
      const subject = data.subject || "General Inquiry";
      html += `
        <tr>
          <td><strong>${sender}</strong></td>
          <td>${subject}</td>
          <td><span class="badge badge-pending">New</span></td>
        </tr>
      `;
    });
    tbody.innerHTML = html;

  } catch (err) {
    console.warn("Unable to fetch contact inquiries:", err);
    if (kpiInquiries) kpiInquiries.textContent = "0";
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8;">Inquiries offline / Firestore permission restricted.</td></tr>`;
    }
  }
}

/**
 * Scans all Firestore courses and repairs any zero/missing prices or broken schemas.
 */
export async function repairAndSanitiseDatabase() {
  try {
    const snap = await getDocs(collection(db, "courses"));
    if (snap.empty) {
      showModal({ title: "Database Clean", message: "No courses found in Firestore to sanitise.", type: "info" });
      return;
    }

    // This tool used to silently rewrite any broken price to a flat $250 --
    // wrong for 4 of the 5 real courses ($45/$45/$45/$55), and dangerous
    // because it could quietly change what a customer gets charged with no
    // review. It now only touches records that are genuinely safe to
    // normalise (trimming/defaulting text fields), and instead REPORTS any
    // course with a missing/zero price or missing Stripe Price ID so you can
    // fix the actual number yourself -- it never guesses a price for you.
    const batch = writeBatch(db);
    let normalisedCount = 0;
    const flagged = [];

    snap.forEach(docSnap => {
      const rawData = docSnap.data();
      const id = docSnap.id;
      const priceBroken = !rawData.price || Number(rawData.price) <= 0;
      const missingStripeId = !rawData.stripePriceId;

      if (priceBroken || missingStripeId) {
        const issues = [];
        if (priceBroken) issues.push("missing/zero price");
        if (missingStripeId) issues.push("no stripePriceId (can't be sold)");
        flagged.push(`${id} -- ${issues.join(", ")}`);
        return; // do not write anything for a broken record -- report only
      }

      // Record looks fine -- safe to re-normalise cosmetic fields only.
      const cleaned = normaliseCourseRecord({ id, ...rawData });
      batch.set(doc(db, "courses", id), cleaned, { merge: true });
      normalisedCount++;
    });

    if (normalisedCount > 0) {
      await batch.commit();
    }
    await refreshAdminDashboard();

    const message = flagged.length
      ? `Audited ${snap.size} records. ${normalisedCount} were fine and re-synced. ${flagged.length} need your attention:\n\n${flagged.join("\n")}`
      : `Audited ${snap.size} records. All ${normalisedCount} have a valid price and Stripe Price ID.`;

    showModal({
      title: flagged.length ? "Review Needed" : "Database Sanitised",
      message,
      type: flagged.length ? "error" : "success"
    });
  } catch (err) {
    console.error("Database repair failed:", err);
    showModal({ title: "Repair Error", message: err.message, type: "error" });
  }
}

export async function refreshAdminDashboard() {
  try {
    const courses = await fetchAdminCourseCatalog();
    renderCourseTable(courses);
    await loadInquiries();
  } catch (err) {
    console.error("Dashboard refresh error:", err);
  }
}

// Attach UI Button Handlers
const syncBtn = document.getElementById("btn-manual-sync");
if (syncBtn) {
  syncBtn.addEventListener("click", () => {
    syncBtn.disabled = true;
    syncBtn.textContent = "Refreshing...";
    refreshAdminDashboard().finally(() => {
      syncBtn.disabled = false;
      syncBtn.textContent = "Reload Cloud Data";
    });
  });
}

const repairBtn = document.getElementById("btn-repair-db");
if (repairBtn) {
  repairBtn.addEventListener("click", () => {
    repairAndSanitiseDatabase();
  });
}