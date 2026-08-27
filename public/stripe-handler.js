/**
 * NZGTTM Essentials — Stripe Payment & Access Control Handler
 * Sela Civil Advisory Limited
 */

// Active Stripe Test Price ID
const STRIPE_PRICE_ID = "price_1U7uCE0flJvw3UeNGqKxyjw5";

/**
 * Initiates the Stripe Checkout process using Firebase Anonymous Auth
 * and the 'Run Payments with Stripe' Firestore extension.
 * 
 * @param {string} priceId - Stripe Price ID (defaults to course price)
 * @param {HTMLElement|null} feedbackEl - Optional element to output real-time progress/error text
 */
async function startCheckout(priceId = STRIPE_PRICE_ID, feedbackEl = null) {
  // Helper to update UI feedback status
  const updateFeedback = (message, isError = false) => {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.style.color = isError ? "#c0392b" : "#2980b9";
    }
    console.log(`[Stripe Checkout] ${message}`);
  };

  try {
    updateFeedback("Verifying learner session...");

    // 1. Ensure user is authenticated (signs in anonymously if no account session exists)
    let user = auth.currentUser;
    if (!user) {
      const cred = await auth.signInAnonymously();
      user = cred.user;
    }

    updateFeedback("Creating secure checkout session...");

    // 2. Write document to trigger Firebase Stripe extension Cloud Function
    const sessionDocRef = await db
      .collection("customers")
      .doc(user.uid)
      .collection("checkout_sessions")
      .add({
        price: priceId,
        mode: "payment",
        success_url: `${window.location.origin}${window.location.pathname}?session=success`,
        cancel_url: `${window.location.origin}${window.location.pathname}?session=cancelled`
      });

    updateFeedback("Contacting Stripe gateway...");

    // 3. Listen for the extension to populate the checkout URL
    const unsubscribe = sessionDocRef.onSnapshot(
      (docSnap) => {
        const data = docSnap.data();
        if (!data) return;

        // Check for extension generation errors
        if (data.error) {
          unsubscribe();
          updateFeedback(`Checkout error: ${data.error.message}`, true);
          return;
        }

        // Redirect user to Stripe hosted checkout page when ready
        if (data.url) {
          unsubscribe();
          updateFeedback("Redirecting to secure payment...");
          window.location.assign(data.url);
        }
      },
      (error) => {
        unsubscribe();
        updateFeedback("Database sync failed. Please try again.", true);
        console.error("Firestore Listener Error:", error);
      }
    );

  } catch (err) {
    updateFeedback("Failed to launch checkout. Please retry.", true);
    console.error("Checkout Initialization Error:", err);
  }
}

/**
 * Checks whether the current user holds a succeeded payment record
 * @returns {Promise<boolean>} - True if payment exists, false otherwise
 */
async function checkCourseAccess() {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const paymentRecords = await db
      .collection("customers")
      .doc(user.uid)
      .collection("payments")
      .where("status", "==", "succeeded")
      .get();

    return !paymentRecords.empty;
  } catch (err) {
    console.error("Access verification error:", err);
    return false;
  }
}