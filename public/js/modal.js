// ============================================================================
// File: public/js/modal.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Frosted glass alert and notification modal controller.
// ============================================================================

/**
 * Displays a custom alert modal or logs quietly to console.
 * @param {Object} options - { title, message, type }
 */
export function showModal({ title = "Notice", message = "", type = "info" }) {
  console.log(`[Modal Alert] [${type.toUpperCase()}] ${title}: ${message}`);

  // Prevent multiple stacked modals
  const existing = document.getElementById("sela-custom-modal");
  if (existing) existing.remove();

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "sela-custom-modal";
  modalOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 20px;
    animation: fadeIn 0.15s ease-out;
  `;

  const modalBox = document.createElement("div");
  modalBox.style.cssText = `
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    max-width: 440px;
    width: 100%;
    padding: 28px 24px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    text-align: center;
    color: #f8fafc;
  `;

  const titleEl = document.createElement("h3");
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: ${type === 'error' ? '#f87171' : type === 'success' ? '#4ade80' : '#38bdf8'};
  `;

  const msgEl = document.createElement("p");
  msgEl.textContent = message;
  msgEl.style.cssText = `
    font-size: 0.95rem;
    color: #cbd5e1;
    line-height: 1.5;
    margin-bottom: 24px;
  `;

  const btn = document.createElement("button");
  btn.textContent = "OK";
  btn.style.cssText = `
    background: #0284c7;
    color: #ffffff;
    border: none;
    padding: 10px 32px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background 0.2s;
  `;
  btn.addEventListener("click", () => modalOverlay.remove());

  modalBox.appendChild(titleEl);
  modalBox.appendChild(msgEl);
  modalBox.appendChild(btn);
  modalOverlay.appendChild(modalBox);
  document.body.appendChild(modalOverlay);
}
/**
 * Convenience wrapper: error-styled modal.
 * @param {string} message
 */
export function showErrorModal(message) {
  showModal({ title: "Error", message, type: "error" });
}

/**
 * Convenience wrapper: generic informational/success modal
 * (e.g. password reset confirmation).
 * @param {Object} options - { title, message, redirectUrl }
 */
export function showAppModal({ title = "Notice", message = "", redirectUrl = "" }) {
  showModal({ title, message, type: "success" });
  if (redirectUrl) {
    const check = setInterval(() => {
      if (!document.getElementById("sela-custom-modal")) {
        clearInterval(check);
        window.location.href = redirectUrl;
      }
    }, 200);
  }
}

/**
 * Convenience wrapper: access-restricted modal (enterprise/admin gating).
 * @param {string} message
 */
export function showUnauthorizedModal(message) {
  showModal({ title: "Access Restricted", message, type: "error" });
}
