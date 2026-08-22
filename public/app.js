/**
 * SELA TTM Training & Compliance Client Application
 * Handles module rendering, quiz evaluation, signature capture, and data persistence.
 */

// Configuration: Replace with your deployed Google Apps Script Web App URL
const GAS_ENDPOINT_URL = "const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxxv6WyPIUy3TPSBP0b7DYYgs6fnrbHnPD4fMB8vx1rHDIRm0idB_NxxNCMOqkXdBOIqg/exec";";

// Application State
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
 * 1. Initialize Application: Load JSON Course Data
 */
document.addEventListener("DOMContentLoaded", async () => {
  setupSignaturePad();
  setupEventListeners();

  try {
    const response = await fetch("data/courses.json");
    if (!response.ok) {
      throw new Error(`Failed to load course modules (HTTP ${response.status})`);
    }
    courseData = await response.json();
    populateModuleDropdown(courseData.modules);
  } catch (err) {
    console.error("Initialization Error:", err);
    alert("Unable to load training modules. Check your local server or network connection.");
  }
});

/**
 * 2. Populate Dropdown with Available Modules
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
 * 3. Render Selected Module Details & Questions
 */
function renderModule(moduleId) {
  if (!moduleId || !courseData) {
    moduleContent.classList.add("hidden");
    return;
  }

  currentModule = courseData.modules.find(m => m.id === moduleId);
  if (!currentModule) return;

  // Header Info
  moduleInfoHeader.innerHTML = `
    <h3>${currentModule.title}</h3>
    <p>${currentModule.description} (Est. ${currentModule.estimatedMinutes} mins)</p>
  `;

  // Reading Sections
  moduleReadingMaterial.innerHTML = currentModule.sections.map(sec => `
    <div>
      <strong>${sec.heading}</strong>
      <p style="font-size: 0.95rem; color: #cbd5e1; margin-top: 4px;">${sec.content}</p>
    </div>
  `).join("");

  // Quiz Questions
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
 * 4. Canvas Signature Pad Listeners (Mouse & Touch Support)
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
    e.preventDefault();
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
 * 5. Assessment Processing & Submission
 */
async function handleSubmit() {
  const workerId = workerIdInput.value.trim();
  const fullName = fullNameInput.value.trim();

  // Basic Validation
  if (!workerId || !fullName) {
    alert("Please enter both Worker ID and Full Name before submitting.");
    return;
  }

  if (isSignatureBlank()) {
    alert("Please provide a digital signature declaration before submitting.");
    return;
  }

  // Evaluate Quiz Answers
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

  // Calculate Precision Score (4 decimal places stored, 2 displayed)
  const scorePercentRaw = (correctCount / totalQuestions) * 100;
  const scorePercentFixed = parseFloat(scorePercentRaw.toFixed(4));
  const isPassed = scorePercentFixed >= courseData.passingScorePercent;
  const status = isPassed ? "PASSED" : "FAILED";

  // Build Payload
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

  // Show Visual Loading State
  showStatusBanner("Submitting compliance record to Google Cloud...");

  try {
    if (GAS_ENDPOINT_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
      // Offline / Local Simulation Mode
      await new Promise(res => setTimeout(res, 1200));
      console.log("Mock Payload Generated:", payloadData);
    } else {
      // Live Google Apps Script Bridge
      await fetch(GAS_ENDPOINT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadData)
      });
    }

    // Display Result Modal
    showResultModal(isPassed, scorePercentFixed);
  } catch (err) {
    console.error("Submission Error:", err);
    alert("Network error: Failed to sync with Google Sheet. Please retry.");
  } finally {
    hideStatusBanner();
  }
}

/**
 * 6. UI Helpers & Modals
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