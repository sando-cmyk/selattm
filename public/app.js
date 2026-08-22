// SELA TTM - Core Application Logic
// Complete Module Implementation with Real-time Firestore Sync, CSV Export, and Digital Certificate Generator

import { 
  auth, 
  db, 
  googleProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from "./firebase-config.js";

import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Global Application State
let coursesCatalog = [];
let cachedSubmissions = [];
let currentUser = {
  uid: "guest-user",
  name: "Craig Sanders",
  email: "craig@sandos.co.nz",
  employer: "Fulton Hogan",
  isEnterprise: true
};

let activeCourse = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let isDrawing = false;
let sigCanvas, sigCtx;

// Core DOM Elements
const authUserName = document.getElementById("authUserName");
const authUserOrg = document.getElementById("authUserOrg");
const btnGoogleAuth = document.getElementById("btnGoogleAuth");
const btnSwitchContext = document.getElementById("btnSwitchContext");
const btnExportCsv = document.getElementById("btnExportCsv");
const btnSyncRecords = document.getElementById("btnSyncRecords");
const tabButtons = document.querySelectorAll(".tab-btn");
const viewSections = document.querySelectorAll(".view-section");
const enrolledCoursesList = document.getElementById("enrolledCoursesList");
const availableCoursesCatalog = document.getElementById("availableCoursesCatalog");
const enterpriseTableBody = document.getElementById("enterpriseTableBody");
const assessmentModal = document.getElementById("assessmentModal");
const modalCourseTitle = document.getElementById("modalCourseTitle");
const modalContentArea = document.getElementById("modalContentArea");
const modalProgressBar = document.getElementById("modalProgressBar");
const btnCloseModal = document.getElementById("btnCloseModal");
const toast = document.getElementById("toast");

// Application Bootstrap
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupAuth();
  setupExport();
  listenToEnterpriseRecords();
  await loadCoursesData();
  renderLearnerHub();
  renderCatalog();
});

// User Feedback Notification
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3500);
}

// Navigation Tabs Handler
function setupNavigation() {
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      viewSections.forEach(s => s.classList.remove("active"));

      btn.classList.add("active");
      const targetSection = document.getElementById(`${btn.dataset.tab}-section`);
      if (targetSection) targetSection.classList.add("active");
    });
  });

  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => {
      assessmentModal.classList.remove("active");
    });
  }

  if (btnSyncRecords) {
    btnSyncRecords.addEventListener("click", () => {
      showToast("Syncing records from Firestore...");
      listenToEnterpriseRecords();
    });
  }
}

// CSV Export Handler
function setupExport() {
  if (!btnExportCsv) return;

  btnExportCsv.addEventListener("click", () => {
    if (!cachedSubmissions || cachedSubmissions.length === 0) {
      showToast("No records available to export.");
      return;
    }

    const headers = ["Timestamp", "Worker Name", "Employer", "Module ID", "Module Title", "Internal Score", "Display Score", "Status"];
    const rows = cachedSubmissions.map(r => [
      `"${r.timestamp || ""}"`,
      `"${r.workerName || ""}"`,
      `"${r.employer || ""}"`,
      `"${r.moduleId || ""}"`,
      `"${(r.moduleTitle || "").replace(/"/g, '""')}"`,
      `"${r.scoreInternal !== undefined ? r.scoreInternal : ""}"`,
      `"${r.scoreDisplay || ""}"`,
      `"${r.status || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SELA_Compliance_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Compliance CSV exported successfully.");
  });
}

// Authentication & Identity Context
function setupAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.uid = user.uid;
      if (user.displayName) currentUser.name = user.displayName;
      if (user.email) currentUser.email = user.email;
      if (btnGoogleAuth) btnGoogleAuth.textContent = user.isAnonymous ? "Sign In with Google" : "Sign Out";
      updateUserDisplay();
    } else {
      try {
        const anonCred = await signInAnonymously(auth);
        currentUser.uid = anonCred.user.uid;
        updateUserDisplay();
      } catch (err) {
        console.error("Anonymous authentication error:", err);
      }
    }
  });

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener("click", async () => {
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        await signOut(auth);
        showToast("Signed out successfully.");
        return;
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        currentUser = {
          uid: result.user.uid,
          name: result.user.displayName || "Verified User",
          email: result.user.email,
          employer: "Fulton Hogan",
          isEnterprise: true
        };
        updateUserDisplay();
        btnGoogleAuth.textContent = "Sign Out";
        showToast(`Welcome, ${currentUser.name}`);
      } catch (err) {
        console.warn("Google Auth popup closed or cancelled:", err);
      }
    });
  }

  if (btnSwitchContext) {
    btnSwitchContext.addEventListener("click", () => {
      if (currentUser.employer === "Fulton Hogan") {
        currentUser.employer = "Independent / Unlinked";
        currentUser.isEnterprise = false;
        showToast("Switched to Independent Trainee Context");
      } else {
        currentUser.employer = "Fulton Hogan";
        currentUser.isEnterprise = true;
        showToast("Switched to Fulton Hogan Corporate Context");
      }
      updateUserDisplay();
    });
  }
}

function updateUserDisplay() {
  if (authUserName) authUserName.textContent = currentUser.name;
  if (authUserOrg) authUserOrg.textContent = currentUser.employer;
}

// Course Catalog Loader
async function loadCoursesData() {
  try {
    const res = await fetch("data/courses.json");
    coursesCatalog = await res.json();
  } catch (e) {
    console.error("Failed loading courses.json, applying fallback schema:", e);
    coursesCatalog = [
      {
        id: "ttm-cat-a-foundations",
        code: "TTM-01",
        title: "TTM Category A: Roadway Foundations & Safety",
        category: "Core TTM",
        priceNZD: 149.00,
        description: "Essential safety protocols, hazard identification, and live-lane awareness under CoPTTM and NZGTTM operational frameworks.",
        passScorePercent: 80.0000,
        questions: []
      }
    ];
  }
}

// Render Learner Dashboard Cards
function renderLearnerHub() {
  if (!enrolledCoursesList) return;
  enrolledCoursesList.innerHTML = "";
  
  coursesCatalog.forEach(course => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="badge badge-emerald">Enrolled</span>
          <span class="badge badge-blue">${course.category}</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.description}</p>
      </div>
      <div>
        <div class="user-status-text" style="margin-bottom: 0.75rem;">
          Passing standard: <strong>${Number(course.passScorePercent).toFixed(2)}%</strong>
        </div>
        <button class="btn btn-primary btn-block btn-start" data-id="${course.id}">
          Launch Assessment
        </button>
      </div>
    `;
    enrolledCoursesList.appendChild(card);
  });

  document.querySelectorAll(".btn-start").forEach(b => {
    b.addEventListener("click", () => startAssessment(b.dataset.id));
  });
}

// Render Store & Dual Billing Options
function renderCatalog() {
  if (!availableCoursesCatalog) return;
  availableCoursesCatalog.innerHTML = "";

  coursesCatalog.forEach(course => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div>
        <div class="card-header">
          <span class="badge badge-blue">${course.code}</span>
          <span class="badge badge-amber">$${Number(course.priceNZD).toFixed(2)} NZD</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.description}</p>
        <div class="price-tag">$${Number(course.priceNZD).toFixed(2)} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">+ GST</span></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <button class="btn btn-primary btn-block btn-buy-self" data-id="${course.id}">
          Self-Pay (Stripe Checkout)
        </button>
        <button class="btn btn-secondary btn-block btn-charge-emp" data-id="${course.id}">
          Charge to Fulton Hogan PO
        </button>
      </div>
    `;
    availableCoursesCatalog.appendChild(card);
  });

  document.querySelectorAll(".btn-buy-self").forEach(b => {
    b.addEventListener("click", () => {
      showToast("Redirecting to Stripe secure checkout...");
    });
  });

  document.querySelectorAll(".btn-charge-emp").forEach(b => {
    b.addEventListener("click", () => {
      showToast("Course seat assigned and charged to Fulton Hogan PO #FH-9921.");
    });
  });
}

// Assessment Engine Execution
function startAssessment(courseId) {
  activeCourse = coursesCatalog.find(c => c.id === courseId);
  if (!activeCourse) return;

  currentQuestionIndex = 0;
  userAnswers = {};
  modalCourseTitle.textContent = activeCourse.title;
  assessmentModal.classList.add("active");
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  const total = activeCourse.questions ? activeCourse.questions.length : 0;
  
  if (total > 0 && currentQuestionIndex < total) {
    const q = activeCourse.questions[currentQuestionIndex];
    const pct = ((currentQuestionIndex) / (total + 1)) * 100;
    modalProgressBar.style.width = `${pct}%`;

    let optionsHtml = q.options.map((opt, idx) => `
      <label class="option-label">
        <input type="radio" name="qOption" value="${idx}" ${userAnswers[q.id] === idx ? "checked" : ""}>
        <span>${opt}</span>
      </label>
    `).join("");

    modalContentArea.innerHTML = `
      <div class="question-card">
        <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 0.5rem;">
          QUESTION ${currentQuestionIndex + 1} OF ${total}
        </div>
        <h4 style="margin-bottom: 1rem;">${q.prompt}</h4>
        <div>${optionsHtml}</div>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
        <button id="btnNextQuestion" class="btn btn-primary">
          ${currentQuestionIndex === total - 1 ? "Proceed to Sign-Off" : "Next Question"}
        </button>
      </div>
    `;

    document.querySelectorAll("input[name='qOption']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        userAnswers[q.id] = parseInt(e.target.value, 10);
      });
    });

    document.getElementById("btnNextQuestion").addEventListener("click", () => {
      if (userAnswers[q.id] === undefined) {
        showToast("Please select an answer to continue.");
        return;
      }
      currentQuestionIndex++;
      renderCurrentQuestion();
    });

  } else {
    renderSignOff();
  }
}

function renderSignOff() {
  modalProgressBar.style.width = "100%";
  modalContentArea.innerHTML = `
    <div class="question-card">
      <h4>Assessment Declaration & Sign-off</h4>
      <p style="margin: 0.5rem 0 1rem 0; font-size: 0.85rem; color: var(--text-muted);">
        I confirm that I have completed this assessment independently and understand the required safety compliance measures.
      </p>
      
      <div class="signature-canvas-wrapper">
        <canvas id="sigCanvas"></canvas>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
        <button id="btnClearSig" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">Clear Signature</button>
        <button id="btnFinalSubmit" class="btn btn-primary">Submit Record</button>
      </div>
    </div>
  `;

  initSignatureCanvas();

  document.getElementById("btnClearSig").addEventListener("click", () => {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  });

  document.getElementById("btnFinalSubmit").addEventListener("click", submitAssessment);
}

// Canvas Touch & Mouse Capture Engine
function initSignatureCanvas() {
  sigCanvas = document.getElementById("sigCanvas");
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext("2d");
  
  sigCanvas.width = sigCanvas.parentElement.clientWidth || 400;
  sigCanvas.height = 160;
  
  sigCtx.strokeStyle = "#0284c7";
  sigCtx.lineWidth = 2.5;
  sigCtx.lineCap = "round";

  const getPos = (e) => {
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    isDrawing = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  };

  const stopDraw = () => { isDrawing = false; };

  sigCanvas.addEventListener("mousedown", startDraw);
  sigCanvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDraw);

  sigCanvas.addEventListener("touchstart", startDraw, { passive: false });
  sigCanvas.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", stopDraw);
}

// Generate Downloadable Certificate Image
function generateCertificate(data) {
  const certCanvas = document.createElement("canvas");
  certCanvas.width = 1200;
  certCanvas.height = 800;
  const ctx = certCanvas.getContext("2d");

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 800);
  bgGradient.addColorStop(0, "#0f172a");
  bgGradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 800);

  // Border frame
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 1120, 720);

  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 1090, 690);

  // Header
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SELA TTM COMPLIANCE ACADEMY", 600, 120);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px sans-serif";
  ctx.fillText("OFFICIAL RECORD OF QUALIFICATION & VERIFIED COMPETENCY", 600, 160);

  // Trainee Details
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 22px sans-serif";
  ctx.fillText("This certifies that", 600, 240);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(data.workerName || "Craig Sanders", 600, 310);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Operating under: ${data.employer || "Independent"}`, 600, 360);

  ctx.fillStyle = "#ffffff";
  ctx.font = "22px sans-serif";
  ctx.fillText("has successfully met all assessment requirements for", 600, 430);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(data.moduleTitle || "TTM Safety Module", 600, 490);

  // Score and Timestamp Metadata
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`Passing Grade: ${data.scoreDisplay || "100.00%"} (${data.status})`, 600, 550);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Issued: ${data.timestamp} NZST`, 600, 600);

  // Stamp / Verification Notice
  ctx.fillStyle = "#64748b";
  ctx.font = "14px monospace";
  ctx.fillText(`Verification Key: ${data.id || ("SELA-" + Date.now())} | New Zealand Transport Grid Standards`, 600, 710);

  // Download Action
  const imageUri = certCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `SELA_Certificate_${(data.workerName || "Trainee").replace(/\s+/g, '_')}_${Date.now()}.png`;
  link.href = imageUri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Certificate downloaded successfully.");
}

// Submit Record directly to Firestore
async function submitAssessment() {
  let correctCount = 0;
  const questions = activeCourse.questions || [];
  const total = questions.length;

  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctIndex) {
      correctCount++;
    }
  });

  const scorePercent = total > 0 ? (correctCount / total) * 100 : 100.0000;
  const passed = scorePercent >= activeCourse.passScorePercent;
  const signatureDataUrl = sigCanvas ? sigCanvas.toDataURL("image/png") : "";

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestampNZ = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const currentAuthUid = auth.currentUser ? auth.currentUser.uid : currentUser.uid;

  const submissionPayload = {
    userId: currentAuthUid,
    workerName: currentUser.name,
    employer: currentUser.employer,
    moduleId: activeCourse.id,
    moduleTitle: activeCourse.title,
    scoreInternal: Number(scorePercent.toFixed(4)),
    scoreDisplay: `${Number(scorePercent).toFixed(2)}%`,
    status: passed ? "PASSED" : "RE-TEST REQUIRED",
    timestamp: timestampNZ,
    signaturePng: signatureDataUrl,
    createdAt: Date.now()
  };

  try {
    const docRef = await addDoc(collection(db, "submissions"), submissionPayload);
    submissionPayload.id = docRef.id;
    showToast(`Record Logged to Firestore: ${submissionPayload.status} (${submissionPayload.scoreDisplay})`);
  } catch (err) {
    console.error("Firestore submission error:", err);
    showToast(`Error writing to Firestore: ${err.message}`);
  }

  // Show Completion Summary in Modal
  modalContentArea.innerHTML = `
    <div class="question-card" style="text-align: center; padding: 2rem;">
      <span class="badge ${passed ? 'badge-emerald' : 'badge-rose'}" style="font-size: 1rem; padding: 0.5rem 1rem;">
        ${submissionPayload.status}
      </span>
      <h3 style="margin: 1.5rem 0 0.5rem 0;">Assessment Completed</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
        Final Score: <strong>${submissionPayload.scoreDisplay}</strong> (Required: ${Number(activeCourse.passScorePercent).toFixed(2)}%)
      </p>
      <div style="display: flex; justify-content: center; gap: 1rem;">
        ${passed ? `<button id="btnDownloadCert" class="btn btn-primary">Download Official Certificate</button>` : ''}
        <button id="btnFinishModal" class="btn btn-secondary">Return to Portal</button>
      </div>
    </div>
  `;

  if (passed) {
    document.getElementById("btnDownloadCert").addEventListener("click", () => {
      generateCertificate(submissionPayload);
    });
  }

  document.getElementById("btnFinishModal").addEventListener("click", () => {
    assessmentModal.classList.remove("active");
  });
}

// Table Row Render Function
function renderComplianceRows(records) {
  if (!enterpriseTableBody) return;
  enterpriseTableBody.innerHTML = "";

  if (records.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
        No compliance submissions recorded yet.
      </td>
    `;
    enterpriseTableBody.appendChild(emptyRow);
    return;
  }

  records.forEach(data => {
    const row = document.createElement("tr");
    const badgeClass = data.status === "PASSED" ? "badge-emerald" : "badge-rose";
    
    row.innerHTML = `
      <td>${data.timestamp || "N/A"}</td>
      <td><strong>${data.workerName || "Anonymous"}</strong><br><span style="color: var(--text-muted); font-size: 0.75rem;">${data.employer || "Unlinked"}</span></td>
      <td>${data.moduleTitle || "TTM Module"}</td>
      <td><strong>${data.scoreDisplay || "0.00%"}</strong> <span style="color: var(--text-muted); font-size: 0.75rem;">(${data.scoreInternal !== undefined ? data.scoreInternal : "0.0000"})</span></td>
      <td><span class="badge ${badgeClass}">${data.status || "PENDING"}</span></td>
      <td>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${data.status === "PASSED" ? `<button class="btn btn-secondary btn-cert" data-id="${data.id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Certificate</button>` : ''}
          ${data.signaturePng && data.signaturePng.length > 50 
            ? `<a href="${data.signaturePng}" target="_blank" style="color: var(--accent-cyan); text-decoration: none; font-size: 0.75rem; font-weight: 600;">Sig</a>` 
            : `<span style="color: var(--text-muted); font-size: 0.75rem;">Digital</span>`}
        </div>
      </td>
    `;
    enterpriseTableBody.appendChild(row);
  });

  // Attach Certificate download listeners to table rows
  document.querySelectorAll(".btn-cert").forEach(btn => {
    btn.addEventListener("click", () => {
      const rec = records.find(r => r.id === btn.dataset.id);
      if (rec) generateCertificate(rec);
    });
  });
}

// Real-Time Firestore Snapshot Listener
function listenToEnterpriseRecords() {
  if (!enterpriseTableBody) return;
  const submissionsRef = collection(db, "submissions");

  onSnapshot(submissionsRef, (snapshot) => {
    if (snapshot.empty) {
      cachedSubmissions = [];
      renderComplianceRows([]);
      return;
    }

    const records = [];
    snapshot.forEach(docSnap => {
      records.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort descending by timestamp / creation
    records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cachedSubmissions = records;

    renderComplianceRows(records);
  }, (error) => {
    console.error("Firestore listener error:", error);
  });
}