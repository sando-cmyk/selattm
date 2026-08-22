/**
 * SELA TTM Training & Compliance Client Application
 * Clean rewrite with fallback support for course modules and Google Apps Script bridge.
 */

// Target Google Apps Script Web App Endpoint
const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxxv6WyPIUy3TPSBP0b7DYYgs6fnrbHnPD4fMB8vx1rHDIRm0idB_NxxNCMOqkXdBOIqg/exec";

// Embedded Fallback Course Data (Guarantees zero-blank UI even if network fetch fails)
const FALLBACK_COURSE_DATA = {
  version: "1.0.0",
  passingScorePercent: 80.0000,
  modules: [
    {
      id: "TTM-MOD-01-TAPERS",
      title: "Taper Lengths & Delineation Standards",
      description: "Fundamental principles of visual guidance, taper ratios, and cone spacing per NZGTTM/CoPTTM standards.",
      estimatedMinutes: 15,
      sections: [
        {
          heading: "1. Lateral Shift & Merge Tapers",
          content: "Merge tapers must provide adequate visual lead-in distance for approaching motorists to decelerate or shift lanes smoothly. Always ensure delineation cones are fitted with retro-reflective sleeves in clean condition."
        },
        {
          heading: "2. Buffer Zones & Work Area Separation",
          content: "The longitudinal buffer provides an essential safety clearance between the end of the taper and the active working space. Never park plant or store equipment inside designated buffer zones."
        }
      ],
      questions: [
        {
          id: 1,
          question: "What is the primary function of a longitudinal buffer zone?",
          options: [
            { key: "A", text: "Storage area for site vehicles and surplus cones." },
            { key: "B", text: "Unoccupied safety space separating the taper from the active work crew." },
            { key: "C", text: "Designated parking space for visitor vehicles." },
            { key: "D", text: "Sign placement area." }
          ],
          correctAnswer: "B"
        },
        {
          id: 2,
          question: "Under wet or night-time operational conditions, what requirement applies to cone delineation?",
          options: [
            { key: "A", text: "Cones must be fitted with undamaged retro-reflective sleeves." },
            { key: "B", text: "Cone spacing may be doubled." },
            { key: "C", text: "Any standard unreflective cone is permissible." },
            { key: "D", text: "Reflectorized cones are only required on state highways." }
          ],
          correctAnswer: "A"
        }
      ]
    },
    {
      id: "TTM-MOD-02-SITE-SAFETY",
      title: "Site Hazard Identification & Daily Briefings",
      description: "Standard operating protocols for daily hazard identification, dynamic risk assessments, and crew inductions.",
      estimatedMinutes: 10,
      sections: [
        {
          heading: "1. Dynamic Site Conditions",
          content: "Site conditions can change rapidly due to traffic flow, weather, or work scope creep. Pre-start briefings must be held prior to commencing work and updated if site layout changes occur."
        }
      ],
      questions: [
        {
          id: 1,
          question: "When must a site safety briefing and hazard check be updated?",
          options: [
            { key: "A", text: "Only at the end of each calendar week." },
            { key: "B", text: "Whenever weather conditions, work scope, or layout parameters change significantly." },
            { key: "C", text: "Only if requested by a member of the public." },
            { key: "D", text: "Once per contract regardless of duration." }
          ],
          correctAnswer: "B"
        }
      ]
    }
  ]
};

// Global State
let courseData = null;
let currentModule = null;
let isDrawingSignature = false;

// DOM Elements
const workerIdInput = document.getElementById("worker-id");
const fullNameInput = document.getElementById("full-name");
const moduleSelect = document.getElementById("module-select");
const moduleContent = document.getElementById("module-content");
const moduleInfoHeader = document.getElementById("module-info-header");
const moduleReadingMaterial = document.getElementById("module-reading-material");
const questionsList = document.getElementById("questions-list");
const sigPad = document.getElementById("sig-pad");
const btnClearSig = document.getElementById("btn-clear-sig");
const btnSubmit = document.getElementById("btn-submit-assessment");
const statusBanner = document.getElementById("status-banner");
const statusMessage = document.getElementById("status-message");
const resultModal = document.getElementById("result-modal");
const modalTitle = document.getElementById("modal-title");
const modalScore = document.getElementById("modal-score");
const modalDetails = document.getElementById("modal-details");
const btnModalClose = document.getElementById("btn-modal-close");

// Canvas Context Setup
const ctx = sigPad.getContext("2d");
ctx.strokeStyle = "#000000";
ctx.lineWidth = 2;
ctx.lineCap = "round";

/**
 * 1. Initialize Application
 */
document.addEventListener("DOMContentLoaded", async () => {
  setupSignaturePad();
  setupEventListeners();

  try {
    const response = await fetch("data/courses.json");
    if (response.ok) {
      courseData = await response.json();
    } else {
      console.warn("Loading fallback course dataset (HTTP " + response.status + ")");
      courseData = FALLBACK_COURSE_DATA;
    }
  } catch (err) {
    console.warn("Using embedded fallback data:", err);
    courseData = FALLBACK_COURSE_DATA;
  }

  populateModuleDropdown(courseData.modules);
});

/**
 * 2. Populate Dropdown
 */
function populateModuleDropdown(modules) {
  moduleSelect.innerHTML = '<option value="">-- Choose a Training Module --</option>';
  modules.forEach(mod => {
    const opt = document.createElement("option");
    opt.value = mod.id;
    opt.textContent = `${mod.id}: ${mod.title}`;
    moduleSelect.appendChild(opt);
  });
}

/**
 * 3. Render Module Content
 */
function renderModule(moduleId) {
  if (!moduleId || !courseData) {
    moduleContent.classList.add("hidden");
    return;
  }

  currentModule = courseData.modules.find(m => m.id === moduleId);
  if (!currentModule) return;

  moduleInfoHeader.innerHTML = `
    <h3>${currentModule.title}</h3>
    <p>${currentModule.description} (Est. ${currentModule.estimatedMinutes} mins)</p>
  `;

  moduleReadingMaterial.innerHTML = currentModule.sections.map(sec => `
    <div style="margin-bottom: 8px;">
      <strong>${sec.heading}</strong>
      <p style="font-size: 0.95rem; color: #cbd5e1; margin-top: 4px;">${sec.content}</p>
    </div>
  `).join("");

  questionsList.innerHTML = currentModule.questions.map((q, idx) => `
    <div class="question-block" data-question-id="${q.id}">
      <p class="question-text">${idx + 1}. ${q.question}</p>
      <div class="options-group">
        ${q.options.map(opt => `
          <label class="option-item">
            <input type="radio" name="q_${q.id}" value="${opt.key}" />
            <span><strong>${opt.key}.</strong> ${opt.text}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");

  clearSignature();
  moduleContent.classList.remove("hidden");
}

/**
 * 4. Signature Canvas Handlers
 */
function setupSignaturePad() {
  const getCoordinates = (e) => {
    const rect = sigPad.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    isDrawingSignature = true;
    const pos = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawingSignature) return;
    if (e.cancelable) e.preventDefault();
    const pos = getCoordinates(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingSignature) {
      ctx.closePath();
      isDrawingSignature = false;
    }
  };

  sigPad.addEventListener("mousedown", startDrawing);
  sigPad.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", stopDrawing);

  sigPad.addEventListener("touchstart", startDrawing, { passive: false });
  sigPad.addEventListener("touchmove", draw, { passive: false });
  window.addEventListener("touchend", stopDrawing);
}

function clearSignature() {
  ctx.clearRect(0, 0, sigPad.width, sigPad.height);
}

function isSignatureBlank() {
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, sigPad.width, sigPad.height).data.buffer
  );
  return !pixelBuffer.some(color => color !== 0);
}

/**
 * 5. Handle Assessment Submission
 */
async function handleSubmit() {
  const workerId = workerIdInput.value.trim();
  const fullName = fullNameInput.value.trim();

  if (!workerId || !fullName) {
    alert("Please enter both Worker ID and Full Name before submitting.");
    return;
  }

  if (isSignatureBlank()) {
    alert("Please provide a digital signature declaration before submitting.");
    return;
  }

  let correctCount = 0;
  const totalQuestions = currentModule.questions.length;
  const userAnswers = [];

  for (let q of currentModule.questions) {
    const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
    if (!selected) {
      alert(`Please answer Question ${q.id} before submitting.`);
      return;
    }

    const isCorrect = selected.value === q.correctAnswer;
    if (isCorrect) correctCount++;

    userAnswers.push({
      questionId: q.id,
      selected: selected.value,
      isCorrect: isCorrect
    });
  }

  const scorePercentRaw = (correctCount / totalQuestions) * 100;
  const scorePercentFixed = parseFloat(scorePercentRaw.toFixed(4));
  const isPassed = scorePercentFixed >= courseData.passingScorePercent;
  const status = isPassed ? "PASSED" : "FAILED";

  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const payloadData = {
    action: "SUBMIT_TRAINING_RECORD",
    payload: {
      workerId: workerId,
      fullName: fullName,
      moduleId: currentModule.id,
      score: scorePercentFixed,
      status: status,
      answers: userAnswers,
      timestamp: timestamp,
      signatureData: sigPad.toDataURL("image/png")
    }
  };

  showStatusBanner("Submitting compliance record to Google Cloud...");

  try {
    await fetch(GAS_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payloadData)
    });

    console.log("Record pushed successfully to Google Apps Script.");
    showResultModal(isPassed, scorePercentFixed);
  } catch (err) {
    console.error("Submission Error:", err);
    alert("Network communication error. Please retry.");
  } finally {
    hideStatusBanner();
  }
}

/**
 * 6. UI Modals and Banners
 */
function showStatusBanner(msg) {
  statusMessage.textContent = msg;
  statusBanner.classList.remove("hidden");
}

function hideStatusBanner() {
  statusBanner.classList.add("hidden");
}

function showResultModal(isPassed, score) {
  modalTitle.textContent = isPassed ? "Assessment Passed" : "Assessment Failed";
  modalTitle.style.color = isPassed ? "var(--accent-emerald)" : "var(--accent-rose)";
  modalScore.textContent = `Score: ${score.toFixed(2)}%`;
  modalScore.style.color = isPassed ? "var(--accent-emerald)" : "var(--accent-rose)";

  modalDetails.textContent = isPassed
    ? "Your digital declaration and score have been logged to the compliance registry."
    : `A minimum passing standard of ${courseData.passingScorePercent.toFixed(2)}% is required. Please review the course materials and re-attempt.`;

  resultModal.classList.remove("hidden");
}

function setupEventListeners() {
  moduleSelect.addEventListener("change", (e) => renderModule(e.target.value));
  btnClearSig.addEventListener("click", clearSignature);
  btnSubmit.addEventListener("click", handleSubmit);
  btnModalClose.addEventListener("click", () => {
    resultModal.classList.add("hidden");
  });
}