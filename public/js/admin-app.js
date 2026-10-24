// ============================================================================
// File: public/js/admin-app.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Secured operations console -- course catalog, contact inquiries,
//              and manually-granted course access (no payment required).
// ============================================================================

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  deleteDoc,
  arrayUnion,
  collection, 
  getDocs, 
  query, 
  limit,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showModal } from "./modal.js";

const auth = getAuth();
const db = getFirestore();
let currentCourses = []; // cache for course-title lookups (grant emails)

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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">No courses indexed. Use the Drag & Drop engine above to upload.</td></tr>`;
    return;
  }

  tbody.innerHTML = courses.map(course => {
    const code = course.code || course.id || "N/A";
    const title = course.title || "Untitled Module";
    const price = Number(course.price || 0).toFixed(2);
    const currency = course.currency || "NZD";
    const status = course.status || "active";
    const launch = course.launchPath || `/courses/${course.id}/index.html`;
    const priceIdValue = String(course.stripePriceId || "").replace(/"/g, "&quot;");

    return `
      <tr>
        <td><strong style="color: #38bdf8;">${code}</strong></td>
        <td>${title}</td>
        <td>${currency} $${price}</td>
        <td><span class="badge badge-active">${status}</span></td>
        <td><code>${launch}</code></td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <input
              type="text"
              class="price-id-input"
              data-course-id="${course.id}"
              value="${priceIdValue}"
              placeholder="price_..."
              style="flex:1; min-width:170px; background:#0f172a; border:1px solid #334155; color:#f8fafc; border-radius:4px; padding:6px 8px; font-family:monospace; font-size:0.8rem;"
            />
            <button class="btn-action btn-save-price-id" data-course-id="${course.id}" style="padding:6px 10px; font-size:0.8rem; white-space:nowrap;">Save</button>
          </div>
        </td>
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

export async function refreshAdminDashboard() {
  try {
    const courses = await fetchAdminCourseCatalog();
    currentCourses = courses;
    renderCourseTable(courses);
    populateGrantCourseSelect(courses);
    await loadInquiries();
    await loadGrants();
    await loadSubmissions();
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


// ============================================================================
// 3. INLINE STRIPE PRICE ID EDITING
// Lets an admin repoint a course at a new Stripe Price straight from this
// table -- no file edits, no redeploy. Writes only the stripePriceId field
// (merge: true) so nothing else on the course record is touched. The store
// page reads this same Firestore doc live, so a save here takes effect on
// selattm.com immediately.
// ============================================================================
const coursesTbodyEl = document.getElementById("courses-tbody");
if (coursesTbodyEl) {
  coursesTbodyEl.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-save-price-id");
    if (!btn) return;

    const courseId = btn.dataset.courseId;
    const row = btn.closest("tr");
    const input = row ? row.querySelector(".price-id-input") : null;
    if (!courseId || !input) return;

    const newPriceId = input.value.trim();
    const originalLabel = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = "Saving...";
      await setDoc(
        doc(db, "courses", courseId),
        { stripePriceId: newPriceId, lastUpdated: new Date().toISOString() },
        { merge: true }
      );
      btn.textContent = "Saved";
      setTimeout(() => {
        btn.textContent = originalLabel;
        btn.disabled = false;
      }, 1200);
    } catch (err) {
      console.error("Failed to save Stripe Price ID for", courseId, err);
      btn.disabled = false;
      btn.textContent = originalLabel;
      showModal({ title: "Save Failed", message: err.message, type: "error" });
    }
  });
}
// ============================================================================
// 4. MANUAL COURSE ACCESS GRANTS
// Gives someone a course directly, bypassing Stripe entirely -- for people
// Craig or Joseph know personally (trade shows, referrals, staff). Grants
// are keyed by lowercased email in the "grants" collection; learner.html
// checks this in addition to actual Stripe payments before showing a course.
// Billing note is free text -- there's no separate "codes" system, it's
// just a label so grants can be eyeballed and collated for a manual invoice
// at the end of the month.
// ============================================================================

function courseTitleFor(courseId) {
  const c = currentCourses.find(x => x.id === courseId);
  return c ? (c.title || c.code || c.id) : courseId;
}

// Builds a mailto: link with a pre-written subject/body so Joseph (or
// Craig) can review it in their own phone/email app and just hit Send --
// nothing is emailed automatically by the system itself.
function buildGrantEmailLink(email, accessDescription) {
  const subject = "Your Sela Civil Advisory training access is ready";
  const body = [
    "Hi,",
    "",
    `You've been given ${accessDescription} on our training platform.`,
    "",
    "To get started, go to:",
    "https://selattm.com",
    "",
    "- If you already have an account with us, click Sign In and then",
    "  'Forgot your password?' to set a new password.",
    `- If you don't have an account yet, click Create Account and register`,
    `  using this email address (${email}).`,
    "",
    'Once you\'re signed in, your course(s) will appear automatically under',
    "My Learning -- no payment needed, access has already been arranged.",
    "",
    "If you run into any trouble, just reply to this email.",
    "",
    "Thanks,",
    "Sela Civil Advisory Ltd",
    "www.selacivil.co.nz",
  ].join("\n");

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function populateGrantCourseSelect(courses) {
  const select = document.getElementById("grant-course-select");
  if (!select) return;

  if (!courses || !courses.length) {
    select.innerHTML = `<option value="">No courses available</option>`;
    return;
  }

  select.innerHTML = courses
    .map(c => `<option value="${c.id}">${c.title || c.code || c.id}</option>`)
    .join("");
}

async function loadGrants() {
  const tbody = document.getElementById("grants-tbody");
  if (!tbody) return;

  try {
    const snap = await getDocs(collection(db, "grants"));

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">No manual grants yet.</td></tr>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const email = data.email || docSnap.id;
      const access = data.allCourses
        ? `<span class="badge badge-active">ALL COURSES</span>`
        : (Array.isArray(data.courseIds) ? data.courseIds.join(", ") : "--");
      const note = data.billingNote || "--";
      const grantedBy = data.lastGrantedBy || "--";

      html += `
        <tr>
          <td>${email}</td>
          <td>${access}</td>
          <td>${note}</td>
          <td>${grantedBy}</td>
          <td style="white-space:nowrap;">
            <button class="btn-action btn-email-grant" data-email="${docSnap.id}" data-all-courses="${data.allCourses ? '1' : ''}" data-course-ids="${Array.isArray(data.courseIds) ? data.courseIds.join(',') : ''}" style="padding:6px 10px; font-size:0.8rem; margin-right:6px;">Draft Email</button>
            <button class="btn-action btn-revoke-grant" data-email="${docSnap.id}" style="padding:6px 10px; font-size:0.8rem;">Revoke All</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    console.warn("Unable to fetch grants:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8;">Grants offline / Firestore permission restricted.</td></tr>`;
  }
}

const grantBtn = document.getElementById("btn-grant-access");
if (grantBtn) {
  grantBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById("grant-email");
    const courseSelect = document.getElementById("grant-course-select");
    const allCoursesCheckbox = document.getElementById("grant-all-courses");
    const billingNoteInput = document.getElementById("grant-billing-note");
    const statusMsg = document.getElementById("grant-status-msg");

    const email = (emailInput?.value || "").trim().toLowerCase();
    const courseId = courseSelect?.value || "";
    const grantAll = !!allCoursesCheckbox?.checked;
    const billingNote = (billingNoteInput?.value || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (statusMsg) { statusMsg.textContent = "Enter a valid email address."; statusMsg.style.color = "#f87171"; }
      return;
    }
    if (!grantAll && !courseId) {
      if (statusMsg) { statusMsg.textContent = 'Pick a course, or tick "Grant every course".'; statusMsg.style.color = "#f87171"; }
      return;
    }

    const originalLabel = grantBtn.textContent;
    try {
      grantBtn.disabled = true;
      grantBtn.textContent = "Granting...";
      if (statusMsg) statusMsg.textContent = "";

      const payload = {
        email,
        lastGrantedBy: auth.currentUser?.email || "unknown",
        lastGrantedAt: new Date().toISOString(),
      };
      if (grantAll) {
        payload.allCourses = true;
      } else {
        payload.courseIds = arrayUnion(courseId);
      }

      await setDoc(doc(db, "grants", email), payload, { merge: true });

      if (statusMsg) { statusMsg.textContent = `Access granted to ${email}. Opening a pre-filled email for you to send...`; statusMsg.style.color = "#22c55e"; }

      // Auto-draft the "here's how to log in" email in the admin's own
      // mail app -- Joseph/Craig review and hit Send themselves, the
      // system never sends anything on its own.
      const grantedCourseTitle = courseSelect?.options[courseSelect.selectedIndex]?.text || "";
      const accessDescription = grantAll
        ? "access to all of our TTM training courses"
        : `access to the "${grantedCourseTitle}" course`;
      window.location.href = buildGrantEmailLink(email, accessDescription);

      if (emailInput) emailInput.value = "";
      if (billingNoteInput) billingNoteInput.value = "";
      if (allCoursesCheckbox) allCoursesCheckbox.checked = false;

      await loadGrants();
    } catch (err) {
      console.error("Failed to grant access:", err);
      if (statusMsg) { statusMsg.textContent = "Failed: " + err.message; statusMsg.style.color = "#f87171"; }
    } finally {
      grantBtn.disabled = false;
      grantBtn.textContent = originalLabel;
    }
  });
}

const grantsTbodyEl = document.getElementById("grants-tbody");
if (grantsTbodyEl) {
  grantsTbodyEl.addEventListener("click", async (e) => {
    const emailBtn = e.target.closest(".btn-email-grant");
    if (emailBtn) {
      const email = emailBtn.dataset.email;
      if (!email) return;
      const grantAll = emailBtn.dataset.allCourses === "1";
      const courseIds = (emailBtn.dataset.courseIds || "").split(",").filter(Boolean);
      const accessDescription = grantAll
        ? "access to all of our TTM training courses"
        : `access to the ${courseIds.map(courseTitleFor).map(t => `"${t}"`).join(", ")} course${courseIds.length > 1 ? "s" : ""}`;
      window.location.href = buildGrantEmailLink(email, accessDescription);
      return;
    }

    const btn = e.target.closest(".btn-revoke-grant");
    if (!btn) return;

    const email = btn.dataset.email;
    if (!email) return;
    if (!confirm(`Revoke all manually-granted access for ${email}?`)) return;

    const originalLabel = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = "Revoking...";
      await deleteDoc(doc(db, "grants", email));
      await loadGrants();
    } catch (err) {
      console.error("Failed to revoke grant for", email, err);
      btn.disabled = false;
      btn.textContent = originalLabel;
      showModal({ title: "Revoke Failed", message: err.message, type: "error" });
    }
  });
}
// ============================================================================
// 5. COURSE RESULTS & CERTIFICATES
// Every genuine course completion (all slides viewed + all quizzes passed)
// gets written to Firestore's "submissions" collection by the course page
// itself the moment the learner clicks "Mark Course Content Complete" --
// see e.g. public/courses/ttm-portable-traffic-signals/complete.html.
// This section reads that collection back so Craig/Joseph can see who
// passed what, and lets them issue a certificate for a pass once they've
// personally checked it -- nothing is emailed automatically, the PDF just
// downloads for them to send on themselves.
//
// The learner's full name isn't collected at signup yet, so it's captured
// here at certificate time and saved to "learner_profiles/{email}" --
// that way the same email doesn't have to be typed in again for their
// next course.
// ============================================================================

function buildCertificateNumber(courseCode) {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SELA-${courseCode || "CERT"}-${ymd}-${rand}`;
}

async function loadImageAsDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateCertificatePdf({ fullName, courseTitle, scorePercent, completedAt, certificateNumber, download = true }) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();   // 842
  const pageHeight = pdf.internal.pageSize.getHeight(); // 595
  const centerX = pageWidth / 2;

  // Brand colours taken from the Sela SkillsHub certificate artwork.
  const NAVY = [22, 50, 110];
  const GREEN = [62, 140, 46];
  const SLATE = [58, 65, 80];
  const GREY = [95, 100, 110];

  // Full-page background (Sela SkillsHub logo, swooshes, watermark and the
  // dotted signature line are all part of the artwork, so nothing else is drawn
  // for them here). Text positions below are fitted to that artwork.
  try {
    const bgData = await loadImageAsDataUrl("img/certificate-bg.jpg");
    pdf.addImage(bgData, "JPEG", 0, 0, pageWidth, pageHeight);
  } catch (e) {
    console.warn("Certificate: background failed to load, falling back to plain layout.", e);
    try {
      const logoData = await loadImageAsDataUrl("img/sela-logo-transparent.png");
      pdf.addImage(logoData, "PNG", 40, 40, 120, 60);
    } catch (_) { /* continue without imagery */ }
  }

  pdf.setFont("times", "bold");
  pdf.setFontSize(34);
  pdf.setTextColor(...NAVY);
  pdf.text("Certificate of Completion", centerX, 210, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(...GREY);
  pdf.text("This certifies that", centerX, 248, { align: "center" });

  pdf.setFont("times", "bolditalic");
  let nameSize = 30;
  pdf.setFontSize(nameSize);
  while (pdf.getTextWidth(fullName) > 520 && nameSize > 18) {
    nameSize -= 1;
    pdf.setFontSize(nameSize);
  }
  pdf.setTextColor(...SLATE);
  pdf.text(fullName, centerX, 290, { align: "center" });

  pdf.setDrawColor(...GREEN);
  pdf.setLineWidth(1.5);
  pdf.line(centerX - 160, 302, centerX + 160, 302);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(...GREY);
  pdf.text("has successfully completed the course", centerX, 330, { align: "center" });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.setTextColor(...NAVY);
  const titleLines = pdf.splitTextToSize(courseTitle || "", 500).slice(0, 2);
  titleLines.forEach((line, i) => pdf.text(line, centerX, 362 + i * 23, { align: "center" }));
  const afterTitleY = 362 + (titleLines.length - 1) * 23;

  const completedDate = completedAt
    ? new Date(completedAt).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })
    : "--";
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12);
  pdf.setTextColor(...GREY);
  const scoreText = typeof scorePercent === "number" ? `${scorePercent}%` : "--";
  pdf.text(`Score: ${scoreText}   |   Completed: ${completedDate}`, centerX, afterTitleY + 32, { align: "center" });

  // Signature block sits on the artwork's dotted line (bottom right, ~x 466-801, y ~518).
  const sigX = 633;
  try {
    const sigData = await loadImageAsDataUrl("img/signature-joseph.png");
    const sigW = 96, sigH = sigW * (126 / 248); // signature-joseph.png is 248x126
    pdf.addImage(sigData, "PNG", sigX - sigW / 2, 514 - sigH, sigW, sigH);
  } catch (e) {
    console.warn("Certificate: signature failed to load, continuing without it.", e);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...SLATE);
  pdf.text("Joseph Rosendaal", sigX, 536, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...GREY);
  pdf.text("Training Manager, Sela Civil Advisory Ltd", sigX, 550, { align: "center" });

  // Footer in the clear strip below the artwork.
  pdf.setFontSize(8.5);
  pdf.setTextColor(130, 130, 130);
  pdf.text(`Certificate No. ${certificateNumber}`, pageWidth - 40, 572, { align: "right" });
  pdf.text("Sela Civil Advisory Ltd  |  NZBN 9429053816207  |  www.selacivil.co.nz", pageWidth - 40, 584, { align: "right" });

  if (download) pdf.save(`Certificate-${certificateNumber}.pdf`);
  return pdf;
}

// Certificate emails are sent from the admin's own email app, the same way
// as the "Draft Email" button for access grants: the PDF downloads, then a
// pre-written email (To / Subject / message) opens in Outlook via mailto:.
// mailto: links cannot carry attachments, so the admin drags the downloaded
// PDF into the draft and presses Send. (The Trigger Email extension route
// was blocked because SMTP AUTH is disabled on the Microsoft 365 tenant.)
function buildCertificateEmailLink({ email, fullName, courseTitle, certificateNumber }) {
  const firstName = (fullName || "").split(" ")[0] || "there";
  const subject = `Your certificate: ${courseTitle}`;
  const body = [
    `Kia ora ${firstName},`,
    "",
    `Congratulations on completing ${courseTitle}. Your certificate (No. ${certificateNumber}) is attached.`,
    "",
    "Ngā mihi,",
    "Joseph Rosendaal",
    "Training Manager, Sela Civil Advisory Ltd",
    "joseph@selacivil.co.nz | 027 267 7264",
    "https://selattm.com",
  ].join("\n");
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Small dialog with a real link to click (browsers only open the email app
// reliably from a direct click, not after the async certificate work).
function showCertificateEmailDialog({ email, fullName, courseTitle, certificateNumber, note = "" }) {
  const existing = document.getElementById("sela-cert-email-dialog");
  if (existing) existing.remove();
  const href = buildCertificateEmailLink({ email, fullName, courseTitle, certificateNumber });
  const safe = v => String(v || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const overlay = document.createElement("div");
  overlay.id = "sela-cert-email-dialog";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.75);backdrop-filter:blur(6px);" +
    "display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;";
  overlay.innerHTML = `
    <div style="background:#1e293b;border:1px solid rgba(255,255,255,.15);border-radius:12px;max-width:460px;width:100%;
      padding:26px 24px;color:#f8fafc;font-family:inherit;box-shadow:0 20px 40px rgba(0,0,0,.4);text-align:center;">
      <h3 style="margin:0 0 10px;color:${note ? "#fbbf24" : "#4ade80"};font-size:1.25rem;">${note ? "Send it from Outlook instead" : "Certificate ready"}</h3>
      ${note ? `<p style="margin:0 0 10px;color:#fca5a5;font-size:.88rem;line-height:1.4;">${safe(note)}</p>` : ""}
      <p style="margin:0 0 6px;color:#cbd5e1;line-height:1.5;">
        <strong>Certificate-${safe(certificateNumber)}.pdf</strong> has downloaded.</p>
      <p style="margin:0 0 18px;color:#cbd5e1;line-height:1.5;">
        Click below to open the email to <strong>${safe(email)}</strong>, drag the PDF from your
        Downloads folder into it, then press Send.</p>
      <a href="${href}" id="sela-cert-email-open" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;
        font-weight:700;padding:11px 20px;border-radius:8px;">Open email draft</a>
      <div><button type="button" id="sela-cert-email-close" style="margin-top:14px;background:none;border:none;
        color:#94a3b8;cursor:pointer;font-size:.9rem;">Close</button></div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#sela-cert-email-close").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#sela-cert-email-open").addEventListener("click", () => setTimeout(() => overlay.remove(), 400));
}

function renderResultsTable(rows) {
  const tbody = document.getElementById("results-tbody");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No course results recorded yet.</td></tr>`;
    return;
  }

  let html = "";
  rows.forEach(r => {
    const completedDate = r.completedAt ? new Date(r.completedAt).toLocaleDateString("en-NZ") : "--";
    const scoreText = typeof r.scorePercent === "number" ? `${r.scorePercent}%` : "--";
    const resultBadge = r.passed
      ? `<span class="badge badge-active">PASS</span>`
      : `<span class="badge badge-fail">FAIL</span>`;

    let certCell;
    if (r.certificateIssued) {
      const draftedAt = r.certificateEmailDraftedAt || r.certificateEmailQueuedAt;
      const emailedNote = r.certificateEmailedAt
        ? `<div style="font-size:0.72rem;color:#4ade80;margin-top:4px;">Emailed ${new Date(r.certificateEmailedAt).toLocaleDateString("en-NZ")}</div>`
        : draftedAt ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Outlook draft ${new Date(draftedAt).toLocaleDateString("en-NZ")}</div>` : "";
      certCell = `<span class="badge badge-pending" style="text-transform:none;">${r.certificateNumber || "Issued"}</span>
        <button class="btn-action btn-resend-cert" data-id="${r._id}" style="padding:4px 8px; font-size:0.75rem; margin-left:6px;">${r.certificateEmailedAt ? "Resend email" : "Email certificate"}</button>${emailedNote}`;
    } else if (r.passed) {
      certCell = `<button class="btn-action btn-issue-cert" data-id="${r._id}" style="padding:6px 10px; font-size:0.8rem;">Issue Certificate</button>`;
    } else {
      certCell = `--`;
    }

    html += `
      <tr>
        <td>${r.email || "--"}</td>
        <td>${r.courseTitle || r.courseId || "--"}</td>
        <td>${scoreText}</td>
        <td>${resultBadge}</td>
        <td>${completedDate}</td>
        <td>${certCell}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

async function loadSubmissions() {
  const tbody = document.getElementById("results-tbody");
  if (!tbody) return;

  try {
    const snap = await getDocs(collection(db, "submissions"));
    const rows = [];
    snap.forEach(docSnap => rows.push({ _id: docSnap.id, ...docSnap.data() }));
    rows.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    renderResultsTable(rows);
  } catch (err) {
    console.warn("Unable to fetch course results:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Results offline / Firestore permission restricted.</td></tr>`;
  }
}

// Automatic certificate email: queued in "mail" for the Trigger Email
// extension (sends via Brevo SMTP as joseph@selacivil.co.nz) with the PDF
// attached. The admin page watches the queued doc for the extension's
// delivery result and, if it fails or takes too long, falls back to the
// Outlook draft dialog above so the certificate still gets sent.
function waitForDelivery(ref, timeoutMs = 75000) {
  return new Promise(resolve => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; clearTimeout(t); unsub(); resolve(r); } };
    const t = setTimeout(() => finish({ state: "TIMEOUT" }), timeoutMs);
    const unsub = onSnapshot(ref, snap => {
      const d = snap.data() && snap.data().delivery;
      if (d && (d.state === "SUCCESS" || d.state === "ERROR")) finish({ state: d.state, error: d.error || "" });
    }, err => finish({ state: "ERROR", error: err.message }));
  });
}

async function sendCertificateAutomatically({ pdf, alreadyDownloaded, docId, email, fullName, courseTitle, certificateNumber }) {
  const firstName = (fullName || "").split(" ")[0] || "there";
  const safe = v => String(v || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  showModal({ title: "Sending certificate...", message: `Emailing certificate ${certificateNumber} to ${email}. This usually takes 10-30 seconds -- please keep this page open.`, type: "info" });
  let outcome;
  try {
    const ref = await addDoc(collection(db, "mail"), {
      to: email,
      message: {
        subject: `Your certificate: ${courseTitle}`,
        text:
          `Kia ora ${firstName},\n\n` +
          `Congratulations on completing ${courseTitle}. Your certificate (No. ${certificateNumber}) is attached.\n\n` +
          `Nga mihi,\nJoseph Rosendaal\nTraining Manager, Sela Civil Advisory Ltd\njoseph@selacivil.co.nz | 027 267 7264\nhttps://selattm.com`,
        html:
          `<p>Kia ora ${safe(firstName)},</p>` +
          `<p>Congratulations on completing <strong>${safe(courseTitle)}</strong>. ` +
          `Your certificate (No. ${safe(certificateNumber)}) is attached to this email.</p>` +
          `<p>Ng&#257; mihi,<br>Joseph Rosendaal<br>Training Manager, Sela Civil Advisory Ltd<br>` +
          `joseph@selacivil.co.nz &nbsp;|&nbsp; 027 267 7264<br><a href="https://selattm.com">selattm.com</a></p>`,
        attachments: [{
          filename: `Certificate-${certificateNumber}.pdf`,
          content: pdf.output("datauristring").split(",")[1],
          encoding: "base64",
          contentType: "application/pdf",
        }],
      },
      meta: { type: "certificate", certificateNumber, submissionId: docId, sentBy: auth.currentUser?.email || "unknown", queuedAt: new Date().toISOString() },
    });
    outcome = await waitForDelivery(ref);
  } catch (err) {
    outcome = { state: "ERROR", error: err.message };
  }
  const existing = document.getElementById("sela-custom-modal");
  if (existing) existing.remove();

  if (outcome.state === "SUCCESS") {
    await setDoc(doc(db, "submissions", docId), {
      certificateEmailedTo: email, certificateEmailedAt: new Date().toISOString(),
    }, { merge: true });
    await loadSubmissions();
    showModal({ title: "Certificate Emailed", message: `Certificate ${certificateNumber} was emailed to ${email}.`, type: "success" });
    return;
  }

  console.error("Automatic certificate email failed:", outcome);
  if (!alreadyDownloaded) pdf.save(`Certificate-${certificateNumber}.pdf`);
  await setDoc(doc(db, "submissions", docId), {
    certificateEmailDraftedTo: email, certificateEmailDraftedAt: new Date().toISOString(),
  }, { merge: true });
  await loadSubmissions();
  showCertificateEmailDialog({
    email, fullName, courseTitle, certificateNumber,
    note: outcome.state === "TIMEOUT"
      ? "The automatic email hasn't been confirmed yet (it may still arrive). To be safe, send it from Outlook."
      : `The automatic email failed: ${outcome.error || "unknown error"}`,
  });
}

// Re-sends an already-issued certificate: rebuilds the same PDF (same
// certificate number and printed name) and queues it to the learner again.
async function resendCertificateEmail(btn) {
  const docId = btn.dataset.id;
  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const subSnap = await getDoc(doc(db, "submissions", docId));
    if (!subSnap.exists()) throw new Error("That result no longer exists -- try refreshing.");
    const sub = subSnap.data();
    const email = (sub.email || "").toLowerCase();
    if (!email) throw new Error("This result has no email address on it.");

    let fullName = sub.certificateName || "";
    if (!fullName) {
      try {
        const p = await getDoc(doc(db, "learner_profiles", email));
        if (p.exists()) fullName = p.data().fullName || "";
      } catch (_) {}
    }
    if (!fullName && sub.userId) {
      try {
        const u = await getDoc(doc(db, "users", sub.userId));
        const d = u.exists() ? u.data() : {};
        if (d.firstName && d.lastName) fullName = `${d.firstName} ${d.lastName}`;
      } catch (_) {}
    }
    fullName = (prompt(`Name on the certificate for ${email}:`, fullName) || "").trim();
    if (!fullName) { btn.disabled = false; btn.textContent = originalLabel; return; }

    const courseTitle = sub.courseTitle || sub.courseId || "Training Course";
    const certificateNumber = sub.certificateNumber || buildCertificateNumber(sub.courseCode);
    const pdf = await generateCertificatePdf({
      fullName, courseTitle, scorePercent: sub.scorePercent, completedAt: sub.completedAt,
      certificateNumber, download: false,
    });
    await setDoc(doc(db, "submissions", docId), { certificateNumber, certificateName: fullName }, { merge: true });
    await sendCertificateAutomatically({ pdf, alreadyDownloaded: false, docId, email, fullName, courseTitle, certificateNumber });
  } catch (err) {
    console.error("Certificate email failed:", err);
    btn.disabled = false;
    btn.textContent = originalLabel;
    showModal({ title: "Certificate Failed", message: err.message, type: "error" });
  }
}

const resultsTbodyEl = document.getElementById("results-tbody");
if (resultsTbodyEl) {
  resultsTbodyEl.addEventListener("click", async (e) => {
    const resendBtn = e.target.closest(".btn-resend-cert");
    if (resendBtn) { await resendCertificateEmail(resendBtn); return; }
    const btn = e.target.closest(".btn-issue-cert");
    if (!btn) return;

    const docId = btn.dataset.id;
    if (!docId) return;

    const originalLabel = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = "Loading...";

      const subSnap = await getDoc(doc(db, "submissions", docId));
      if (!subSnap.exists()) {
        showModal({ title: "Not Found", message: "That result no longer exists -- try refreshing.", type: "error" });
        btn.disabled = false;
        btn.textContent = originalLabel;
        return;
      }
      const sub = subSnap.data();
      const email = (sub.email || "").toLowerCase();

      // Pull any previously-saved name for this email so it carries
      // across courses -- only needs to be typed in once per person.
      // Prefer the name the learner entered themselves on first sign-in
      // (users/{uid}, see js/learner-profile.js), then any name saved here.
      let defaultName = "";
      try {
        if (sub.userId) {
          const userSnap = await getDoc(doc(db, "users", sub.userId));
          const u = userSnap.exists() ? userSnap.data() : {};
          if (u.firstName && u.lastName) defaultName = `${u.firstName} ${u.lastName}`;
        }
      } catch (e) {
        console.warn("Learner user-profile lookup failed:", e.message);
      }
      try {
        if (!defaultName) {
          const profileSnap = await getDoc(doc(db, "learner_profiles", email));
          if (profileSnap.exists()) defaultName = profileSnap.data().fullName || "";
        }
      } catch (e) {
        console.warn("Learner profile lookup failed:", e.message);
      }

      const fullName = (prompt(`Full name to print on the certificate for ${email}:`, defaultName) || "").trim();
      if (!fullName) {
        btn.disabled = false;
        btn.textContent = originalLabel;
        return;
      }

      await setDoc(doc(db, "learner_profiles", email), {
        email,
        fullName,
        lastUpdatedBy: auth.currentUser?.email || "unknown",
        lastUpdatedAt: new Date().toISOString(),
      }, { merge: true });

      const certificateNumber = buildCertificateNumber(sub.courseCode);

      await setDoc(doc(db, "submissions", docId), {
        certificateIssued: true,
        certificateNumber,
        certificateIssuedAt: new Date().toISOString(),
        certificateIssuedBy: auth.currentUser?.email || "unknown",
        certificateName: fullName,
      }, { merge: true });

      const courseTitle = sub.courseTitle || sub.courseId || "Training Course";
      const pdf = await generateCertificatePdf({
        fullName,
        courseTitle,
        scorePercent: sub.scorePercent,
        completedAt: sub.completedAt,
        certificateNumber,
      });

      await loadSubmissions();
      if (email) {
        await sendCertificateAutomatically({ pdf, alreadyDownloaded: true, docId, email, fullName, courseTitle, certificateNumber });
      } else {
        showModal({ title: "Certificate Issued", message: `Certificate ${certificateNumber} downloaded. This result has no email address, so please send it to the learner yourself.`, type: "success" });
      }
    } catch (err) {
      console.error("Failed to issue certificate:", err);
      showModal({ title: "Certificate Failed", message: err.message, type: "error" });
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}
