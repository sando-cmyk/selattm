// ============================================================================
// File: public/js/site-analytics.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Google Analytics (via Firebase Analytics) for selattm.com.
//
// Loaded once by js/navigation.js, so every page with the global header is
// counted. Uses the measurementId already in firebase-init.js
// (G-Z7DJL0S72S, Firebase project selattm-ba765). Reports appear in the
// Firebase Console -> Analytics, or analytics.google.com.
//
// Course pages that don't load navigation.js are not counted yet.
// Skipped on localhost so local testing doesn't count as visits.
// ============================================================================

import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const host = window.location.hostname;
const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");

if (!isLocal) {
  isSupported()
    .then((ok) => {
      if (!ok) return;
      // getApp() is the app firebase-init.js already initialised on this page
      getAnalytics(getApp());
    })
    .catch((err) => console.warn("[analytics] not started:", err && err.message));
}
