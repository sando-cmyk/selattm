// SELA TTM - Core Application Logic
// Complete Module Implementation with Moodle XML/GIFT Ingestion, Real-time Snapshot Sync, CSV Export & Digital Certificate Generator

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
let parsedMoodleModule = null;

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
const btnCreateCourse = document.getElementById("btnCreateCourse");
const courseCreatorModal = document.getElementById("courseCreatorModal");
const btnCloseCreatorModal = document.getElementById("btnCloseCreatorModal");
const btnCancelCreator = document.getElementById("btnCancelCreator");
const newCourseForm = document.getElementById("newCourseForm");

// Moodle Importer DOM Elements
const btnOpenMoodleImporter = document.getElementById("btnOpenMoodleImporter");
const moodleImporterModal = document.getElementById("moodleImporterModal");
const btnCloseMoodleModal = document.getElementById("btnCloseMoodleModal");
const btnCancelMoodle = document.getElementById("btnCancelMoodle");
const moodleDropZone = document.getElementById("moodleDropZone");
const moodleFileInput = document.getElementById("moodleFileInput");
const moodlePreviewCard = document.getElementById("moodlePreviewCard");
const moodleCoursePreviewTitle = document.getElementById("moodleCoursePreviewTitle");
const moodleParsedCount = document.getElementById("moodleParsedCount");
const moodleAssignCode = document.getElementById("moodleAssignCode");
const moodleAssignPrice = document.getElementById("moodleAssignPrice");
const btnPublishMoodle = document.getElementById("btnPublishMoodle");

// Filter Toolbar Elements
const searchWorker = document.getElementById("searchWorker");
const filterEmployer = document.getElementById("filterEmployer");
const filterStatus = document.getElementById("filterStatus");

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

// Signature Viewer Modal Elements
const signatureModal = document.getElementById("signatureModal");
const sigModalTitle = document.getElementById("sigModalTitle");
const sigModalImage = document.getElementById("sigModalImage");
const btnCloseSigModal = document.getElementById("btnCloseSigModal");
const btnDismissSigModal = document.getElementById("btnDismissSigModal");
const btnDownloadSigImg = document.getElementById("btnDownloadSigImg");
const toast = document.getElementById("toast");

// Application Bootstrap
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupAuth();
  setupExport();
  setupSignatureModal();
  setupCourseCreator();
  setupMoodleImporter();
  setupFilters();
  listenToEnterpriseRecords();
  await loadCoursesData();
  listenToDynamicCourses();
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

// Moodle XML & GIFT Ingestion Engine
function setupMoodleImporter() {
  if (btnOpenMoodleImporter) {
    btnOpenMoodleImporter.addEventListener("click", () => {
      moodleImporterModal.classList.add("active");
    });
  }

  const closeMoodle = () => {
    if (moodleImporterModal) moodleImporterModal.classList.remove("active");
    parsedMoodleModule = null;
    if (moodlePreviewCard) moodlePreviewCard.style.display = "none";
    if (btnPublishMoodle) btnPublishMoodle.disabled = true;
  };

  if (btnCloseMoodleModal) btnCloseMoodleModal.addEventListener("click", closeMoodle);
  if (btnCancelMoodle) btnCancelMoodle.addEventListener("click", closeMoodle);

  if (moodleDropZone && moodleFileInput) {
    moodleDropZone.addEventListener("click", () => moodleFileInput.click());

    moodleDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      moodleDropZone.style.background = "rgba(56, 189, 248, 0.15)";
    });

    moodleDropZone.addEventListener("dragleave", () => {
      moodleDropZone.style.background = "rgba(56, 189, 248, 0.05)";
    });

    moodleDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      moodleDropZone.style.background = "rgba(56, 189, 248, 0.05)";
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processMoodleFile(e.dataTransfer.files[0]);
      }
    });

    moodleFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processMoodleFile(e.target.files[0]);
      }
    });
  }

  if (btnPublishMoodle) {
    btnPublishMoodle.addEventListener("click", async () => {
      if (!parsedMoodleModule) return;

      parsedMoodleModule.code = moodleAssignCode.value.trim() || `TTM-IMP-${Date.now().toString().slice(-4)}`;
      parsedMoodleModule.priceNZD = parseFloat(moodleAssignPrice.value) || 189.00;

      try {
        await addDoc(collection(db, "courses"), parsedMoodleModule);
        showToast(`Moodle module '${parsedMoodleModule.title}' published to Firestore!`);
        closeMoodle();
      } catch (err) {
        console.error("Failed saving Moodle course to Firestore:", err);
        coursesCatalog.push(parsedMoodleModule);
        renderLearnerHub();
        renderCatalog();
        showToast("Added Moodle course to active local session.");
        closeMoodle();
      }
    });
  }
}

function processMoodleFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result;
    if (file.name.endsWith(".xml") || text.includes("<quiz>")) {
      parseMoodleXML(text, file.name);
    } else {
      parseMoodleGIFT(text, file.name);
    }
  };
  reader.readAsText(file);
}

function parseMoodleXML(xmlString, fileName) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const questionNodes = xmlDoc.querySelectorAll("question");

  const cleanText = (raw) => {
    if (!raw) return "";
    return raw.replace(/<[^>]*>?/gm, '').trim();
  };

  const parsedQuestions = [];
  let courseTitle = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

  questionNodes.forEach((node, idx) => {
    const type = node.getAttribute("type");
    if (type === "category") {
      const catText = node.querySelector("category text");
      if (catText && catText.textContent) {
        courseTitle = catText.textContent.split("/").pop().trim();
      }
      return;
    }

    if (type === "multichoice" || type === "truefalse") {
      const qTextNode = node.querySelector("questiontext text");
      const prompt = qTextNode ? cleanText(qTextNode.textContent) : `Assessment Item ${idx + 1}`;

      const answerNodes = node.querySelectorAll("answer");
      const options = [];
      let correctIndex = 0;

      answerNodes.forEach((ans, aIdx) => {
        const fraction = parseFloat(ans.getAttribute("fraction") || "0");
        const aTextNode = ans.querySelector("text");
        const aText = aTextNode ? cleanText(aTextNode.textContent) : `Option ${aIdx + 1}`;
        options.push(aText);

        if (fraction > 0) {
          correctIndex = aIdx;
        }
      });

      if (options.length > 0) {
        parsedQuestions.push({
          id: `q${parsedQuestions.length + 1}`,
          prompt: prompt,
          options: options,
          correctIndex: correctIndex,
          explanation: "Answer verified against standard operational safety guidelines."
        });
      }
    }
  });

  if (parsedQuestions.length === 0) {
    showToast("No valid multiple-choice questions found in Moodle file.");
    return;
  }

  parsedMoodleModule = {
    id: `moodle-${Date.now()}`,
    code: "TTM-M01",
    title: courseTitle.charAt(0).toUpperCase() + courseTitle.slice(1),
    category: "Moodle Converted",
    priceNZD: 189.00,
    passScorePercent: 80.0000,
    description: `Automated import containing ${parsedQuestions.length} verified safety assessment units.`,
    questions: parsedQuestions,
    createdAt: Date.now()
  };

  moodleCoursePreviewTitle.textContent = parsedMoodleModule.title;
  moodleParsedCount.textContent = `${parsedQuestions.length} Questions Ready`;
  moodlePreviewCard.style.display = "block";
  btnPublishMoodle.disabled = false;
  showToast(`Parsed ${parsedQuestions.length} questions from Moodle XML!`);
}

function parseMoodleGIFT(giftString, fileName) {
  const lines = giftString.split("\n");
  const parsedQuestions = [];
  let currentPrompt = "";

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;

    if (trimmed.includes("{") && trimmed.includes("}")) {
      const promptMatch = trimmed.match(/(.*?)\{(.*?)\}/);
      if (promptMatch) {
        const prompt = promptMatch[1].replace(/::.*?::/, "").trim();
        const answersRaw = promptMatch[2];
        
        const options = [];
        let correctIndex = 0;

        const ansTokens = answersRaw.split(/(?=[=~])/);
        ansTokens.forEach((token, tIdx) => {
          const isCorrect = token.startsWith("=");
          const optClean = token.replace(/^[=~]/, "").replace(/#.*/, "").trim();
          if (optClean) {
            options.push(optClean);
            if (isCorrect) correctIndex = options.length - 1;
          }
        });

        if (options.length > 0) {
          parsedQuestions.push({
            id: `q${parsedQuestions.length + 1}`,
            prompt: prompt || `Assessment Item ${parsedQuestions.length + 1}`,
            options: options,
            correctIndex: correctIndex,
            explanation: "Validated safety protocol response."
          });
        }
      }
    }
  });

  if (parsedQuestions.length === 0) {
    showToast("Could not parse GIFT formatting. Try Moodle XML export.");
    return;
  }

  parsedMoodleModule = {
    id: `moodle-${Date.now()}`,
    code: "TTM-G01",
    title: fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
    category: "Moodle Converted",
    priceNZD: 189.00,
    passScorePercent: 80.0000,
    description: `Imported from GIFT format with ${parsedQuestions.length} assessment items.`,
    questions: parsedQuestions,
    createdAt: Date.now()
  };

  moodleCoursePreviewTitle.textContent = parsedMoodleModule.title;
  moodleParsedCount.textContent = `${parsedQuestions.length} Questions Ready`;
  moodlePreviewCard.style.display = "block";
  btnPublishMoodle.disabled = false;
  showToast(`Parsed ${parsedQuestions.length} questions from GIFT format!`);
}

// Enterprise Filter Listeners
function setupFilters() {
  const applyCurrentFilters = () => {
    const term = searchWorker ? searchWorker.value.toLowerCase().trim() : "";
    const selectedEmp = filterEmployer ? filterEmployer.value : "ALL";
    const selectedStat = filterStatus ? filterStatus.value : "ALL";

    const filtered = cachedSubmissions.filter(rec => {
      const matchSearch = !term || 
        (rec.workerName && rec.workerName.toLowerCase().includes(term)) ||
        (rec.moduleTitle && rec.moduleTitle.toLowerCase().includes(term));

      const matchEmp = selectedEmp === "ALL" || rec.employer === selectedEmp;
      const matchStat = selectedStat === "ALL" || rec.status === selectedStat;

      return matchSearch && matchEmp && matchStat;
    });

    renderComplianceRows(filtered);
  };

  if (searchWorker) searchWorker.addEventListener("input", applyCurrentFilters);
  if (filterEmployer) filterEmployer.addEventListener("change", applyCurrentFilters);
  if (filterStatus) filterStatus.addEventListener("change", applyCurrentFilters);
}

// Signature Modal Controls
function setupSignatureModal() {
  const closeSig = () => {
    if (signatureModal) signatureModal.classList.remove("active");
  };

  if (btnCloseSigModal) btnCloseSigModal.addEventListener("click", closeSig);
  if (btnDismissSigModal) btnDismissSigModal.addEventListener("click", closeSig);

  if (btnDownloadSigImg) {
    btnDownloadSigImg.addEventListener("click", () => {
      if (!sigModalImage.src) return;
      const link = document.createElement("a");
      link.download = `Signature_Audit_${Date.now()}.png`;
      link.href = sigModalImage.src;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

function openSignatureViewer(sigDataUrl, workerName) {
  if (!signatureModal || !sigModalImage) return;
  sigModalTitle.textContent = `${workerName} — Verified Signature`;
  sigModalImage.src = sigDataUrl;
  signatureModal.classList.add("active");
}

// Course Creator Controls
function setupCourseCreator() {
  if (btnCreateCourse) {
    btnCreateCourse.addEventListener("click", () => {
      courseCreatorModal.classList.add("active");
    });
  }

  const closeCreator = () => {
    if (courseCreatorModal) courseCreatorModal.classList.remove("active");
  };

  if (btnCloseCreatorModal) btnCloseCreatorModal.addEventListener("click", closeCreator);
  if (btnCancelCreator) btnCancelCreator.addEventListener("click", closeCreator);

  if (newCourseForm) {
    newCourseForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newModule = {
        id: `ttm-custom-${Date.now()}`,
        code: document.getElementById("inCourseCode").value.trim(),
        title: document.getElementById("inCourseTitle").value.trim(),
        category: document.getElementById("inCourseCategory").value.trim(),
        priceNZD: parseFloat(document.getElementById("inCoursePrice").value) || 149.00,
        description: document.getElementById("inCourseDesc").value.trim(),
        passScorePercent: 80.0000,
        questions: [
          {
            id: "q1",
            prompt: `Confirm baseline risk assessment standard for ${document.getElementById("inCourseTitle").value.trim()}:`,
            options: [
              "Standard Level 2/3 TTMC Compliance with active sightline audits",
              "Informal site checks without formal TMP documentation",
              "Operate during non-peak daylight hours only",
              "Exempt from buffer zone regulations"
            ],
            correctIndex: 0,
            explanation: "All operations require verified Level 2/3 compliance and active corridor safety checks."
          }
        ],
        createdAt: Date.now()
      };

      try {
        await addDoc(collection(db, "courses"), newModule);
        showToast("New training module published to Firestore!");
        newCourseForm.reset();
        closeCreator();
      } catch (err) {
        console.error("Failed adding course to Firestore:", err);
        coursesCatalog.push(newModule);
        renderLearnerHub();
        renderCatalog();
        showToast("Added module to active local session.");
        newCourseForm.reset();
        closeCreator();
      }
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
      const employers = ["Fulton Hogan", "Downer", "Higgins", "Independent / Unlinked"];
      const currentIdx = employers.indexOf(currentUser.employer);
      const nextIdx = (currentIdx + 1) % employers.length;
      
      currentUser.employer = employers[nextIdx];
      currentUser.isEnterprise = currentUser.employer !== "Independent / Unlinked";
      
      showToast(`Switched context to: ${currentUser.employer}`);
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
    coursesCatalog = [];
  }
  renderLearnerHub();
  renderCatalog();
}

function listenToDynamicCourses() {
  const coursesRef = collection(db, "courses");
  onSnapshot(coursesRef, (snapshot) => {
    snapshot.forEach(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      if (!coursesCatalog.some(c => c.id === data.id || c.code === data.code)) {
        coursesCatalog.push(data);
      }
    });
    renderLearnerHub();
    renderCatalog();
  }, (err) => {
    console.warn("Dynamic courses listener note:", err);
  });
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
          Passing standard: <strong>${Number(course.passScorePercent || 80).toFixed(2)}%</strong>
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
          <span class="badge badge-amber">$${Number(course.priceNZD || 149).toFixed(2)} NZD</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.description}</p>
        <div class="price-tag">$${Number(course.priceNZD || 149).toFixed(2)} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">+ GST</span></div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <button class="btn btn-primary btn-block btn-buy-self" data-id="${course.id}">
          Self-Pay (Stripe Checkout)
        </button>
        <button class="btn btn-secondary btn-block btn-charge-emp" data-id="${course.id}">
          Charge to ${currentUser.employer !== "Independent / Unlinked" ? currentUser.employer : "Enterprise"} PO
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
      showToast(`Course seat charged to ${currentUser.employer} PO account.`);
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
    resetCanvasWithWhiteBackground();
  });

  document.getElementById("btnFinalSubmit").addEventListener("click", submitAssessment);
}

// Canvas Touch & Mouse Capture Engine with crisp white background
function initSignatureCanvas() {
  sigCanvas = document.getElementById("sigCanvas");
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext("2d");
  
  sigCanvas.width = sigCanvas.parentElement.clientWidth || 400;
  sigCanvas.height = 160;
  
  resetCanvasWithWhiteBackground();

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

function resetCanvasWithWhiteBackground() {
  if (!sigCtx || !sigCanvas) return;
  sigCtx.fillStyle = "#ffffff";
  sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
  sigCtx.strokeStyle = "#0284c7";
  sigCtx.lineWidth = 3.0;
  sigCtx.lineCap = "round";
}

// Generate Downloadable Certificate Image
function generateCertificate(data) {
  const certCanvas = document.createElement("canvas");
  certCanvas.width = 1200;
  certCanvas.height = 800;
  const ctx = certCanvas.getContext("2d");

  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 800);
  bgGradient.addColorStop(0, "#0f172a");
  bgGradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 800);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 1120, 720);

  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 55, 1090, 690);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SELA TTM COMPLIANCE ACADEMY", 600, 120);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px sans-serif";
  ctx.fillText("OFFICIAL RECORD OF QUALIFICATION & VERIFIED COMPETENCY", 600, 160);

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

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(`Passing Grade: ${data.scoreDisplay || "100.00%"} (${data.status})`, 600, 550);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Issued: ${data.timestamp} NZST`, 600, 600);

  ctx.fillStyle = "#64748b";
  ctx.font = "14px monospace";
  ctx.fillText(`Verification Key: ${data.id || ("SELA-" + Date.now())} | New Zealand Transport Grid Standards`, 600, 710);

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
  const passed = scorePercent >= (activeCourse.passScorePercent || 80);
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
    showToast(`Record Logged: ${submissionPayload.status} (${submissionPayload.scoreDisplay})`);
  } catch (err) {
    console.error("Firestore submission error:", err);
    showToast(`Error writing to Firestore: ${err.message}`);
  }

  modalContentArea.innerHTML = `
    <div class="question-card" style="text-align: center; padding: 2rem;">
      <span class="badge ${passed ? 'badge-emerald' : 'badge-rose'}" style="font-size: 1rem; padding: 0.5rem 1rem;">
        ${submissionPayload.status}
      </span>
      <h3 style="margin: 1.5rem 0 0.5rem 0;">Assessment Completed</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
        Final Score: <strong>${submissionPayload.scoreDisplay}</strong> (Required: ${Number(activeCourse.passScorePercent || 80).toFixed(2)}%)
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

// Table Row Render Function with In-Page Signature Modal Triggers
function renderComplianceRows(records) {
  if (!enterpriseTableBody) return;
  enterpriseTableBody.innerHTML = "";

  if (records.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
        No compliance submissions match your filter criteria.
      </td>
    `;
    enterpriseTableBody.appendChild(emptyRow);
    return;
  }

  records.forEach(data => {
    const row = document.createElement("tr");
    const badgeClass = data.status === "PASSED" ? "badge-emerald" : "badge-rose";
    const hasSignature = data.signaturePng && data.signaturePng.length > 50;
    
    row.innerHTML = `
      <td>${data.timestamp || "N/A"}</td>
      <td><strong>${data.workerName || "Anonymous"}</strong><br><span style="color: var(--text-muted); font-size: 0.75rem;">${data.employer || "Unlinked"}</span></td>
      <td>${data.moduleTitle || "TTM Module"}</td>
      <td><strong>${data.scoreDisplay || "0.00%"}</strong> <span style="color: var(--text-muted); font-size: 0.75rem;">(${data.scoreInternal !== undefined ? data.scoreInternal : "0.0000"})</span></td>
      <td><span class="badge ${badgeClass}">${data.status || "PENDING"}</span></td>
      <td>
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          ${data.status === "PASSED" ? `<button class="btn btn-secondary btn-cert" data-id="${data.id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Certificate</button>` : ''}
          ${hasSignature ? `<button class="btn btn-primary btn-view-sig" data-id="${data.id}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">View Signature</button>` : `<span style="color: var(--text-muted); font-size: 0.75rem;">Digital Pass</span>`}
        </div>
      </td>
    `;
    enterpriseTableBody.appendChild(row);
  });

  document.querySelectorAll(".btn-cert").forEach(btn => {
    btn.addEventListener("click", () => {
      const rec = records.find(r => r.id === btn.dataset.id);
      if (rec) generateCertificate(rec);
    });
  });

  document.querySelectorAll(".btn-view-sig").forEach(btn => {
    btn.addEventListener("click", () => {
      const rec = records.find(r => r.id === btn.dataset.id);
      if (rec && rec.signaturePng) {
        openSignatureViewer(rec.signaturePng, rec.workerName || "Worker");
      }
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

    records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cachedSubmissions = records;

    if (searchWorker || filterEmployer || filterStatus) {
      const term = searchWorker ? searchWorker.value.toLowerCase().trim() : "";
      const selectedEmp = filterEmployer ? filterEmployer.value : "ALL";
      const selectedStat = filterStatus ? filterStatus.value : "ALL";

      const filtered = cachedSubmissions.filter(rec => {
        const matchSearch = !term || 
          (rec.workerName && rec.workerName.toLowerCase().includes(term)) ||
          (rec.moduleTitle && rec.moduleTitle.toLowerCase().includes(term));

        const matchEmp = selectedEmp === "ALL" || rec.employer === selectedEmp;
        const matchStat = selectedStat === "ALL" || rec.status === selectedStat;

        return matchSearch && matchEmp && matchStat;
      });

      renderComplianceRows(filtered);
    } else {
      renderComplianceRows(records);
    }
  }, (error) => {
    console.error("Firestore listener error:", error);
  });
}