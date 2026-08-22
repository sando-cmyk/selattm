// SELA TTM - Core Application Logic
// Complete Module Implementation with Real-time Firestore Sync

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

// Global Application State
let coursesCatalog = [];
let currentUser = {
  uid: "demo-user-001",
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
  await loadCoursesData();
  renderLearnerHub();
  renderCatalog();
  listenToEnterpriseRecords();
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
}

// Authentication & Identity Context
function setupAuth() {
  updateUserDisplay();

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener("click", async () => {
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
        showToast(`Welcome back, ${currentUser.name}`);
      } catch (err) {
        console.warn("Auth popup closed or not configured yet. Retaining session.", err);
        showToast("Using active local session.");
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

// Precise Arithmetic Calculation & Firestore Persistence
async function submitAssessment() {
  let correctCount = 0;
  const questions = activeCourse.questions || [];
  const total = questions.length;

  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctIndex) {
      correctCount++;
    }
  });

  // Calculate score with 4-decimal precision internally
  const scorePercent = total > 0 ? (correctCount / total) * 100 : 100.0000;
  const passed = scorePercent >= activeCourse.passScorePercent;
  const signatureDataUrl = sigCanvas ? sigCanvas.toDataURL("image/png") : "";

  // Standard New Zealand Timestamp (DD/MM/YYYY HH:MM:SS)
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timestampNZ = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const submissionPayload = {
    userId: currentUser.uid,
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
    await addDoc(collection(db, "submissions"), submissionPayload);
    showToast(`Record Logged to Firestore: ${submissionPayload.status} (${submissionPayload.scoreDisplay})`);
  } catch (err) {
    console.warn("Firestore sync notice (fallback UI):", err);
    prependComplianceRow(submissionPayload);
    showToast(`Record Logged Locally: ${submissionPayload.status} (${submissionPayload.scoreDisplay})`);
  }

  assessmentModal.classList.remove("active");
}

// Live Compliance Matrix & Table Visualizer
function prependComplianceRow(data) {
  if (!enterpriseTableBody) return;
  const row = document.createElement("tr");
  const badgeClass = data.status === "PASSED" ? "badge-emerald" : "badge-rose";
  
  row.innerHTML = `
    <td>${data.timestamp || "N/A"}</td>
    <td><strong>${data.workerName || "Anonymous"}</strong><br><span style="color: var(--text-muted); font-size: 0.75rem;">${data.employer || "Unlinked"}</span></td>
    <td>${data.moduleTitle || "TTM Module"}</td>
    <td><strong>${data.scoreDisplay || "0.00%"}</strong> <span style="color: var(--text-muted); font-size: 0.75rem;">(${data.scoreInternal !== undefined ? data.scoreInternal : "0.0000"})</span></td>
    <td><span class="badge ${badgeClass}">${data.status || "PENDING"}</span></td>
    <td>
      ${data.signaturePng && data.signaturePng.length > 50 
        ? `<a href="${data.signaturePng}" target="_blank" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600;">View Signature</a>` 
        : `<span style="color: var(--text-muted); font-size: 0.8rem;">Digital Pass</span>`}
    </td>
  `;
  enterpriseTableBody.insertBefore(row, enterpriseTableBody.firstChild);
}

// Real-Time Firestore Snapshot Listener
function listenToEnterpriseRecords() {
  if (!enterpriseTableBody) return;
  const submissionsRef = collection(db, "submissions");

  onSnapshot(submissionsRef, (snapshot) => {
    enterpriseTableBody.innerHTML = "";

    if (snapshot.empty) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No compliance submissions recorded yet. Complete an assessment to see live records.
        </td>
      `;
      enterpriseTableBody.appendChild(emptyRow);
      return;
    }

    const records = [];
    snapshot.forEach(docSnap => {
      records.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by creation time (newest first)
    records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    records.forEach(rec => {
      prependComplianceRow(rec);
    });
  }, (error) => {
    console.warn("Firestore snapshot listener notice (displaying offline view):", error);
  });
}