import { auth, db, doc, collection, addDoc, onSnapshot } from "./firebase-init.js";

/**
 * Initiates Stripe Checkout Session with full error logging.
 *
 * Includes a hard timeout: if the firestore-stripe-payments extension
 * never writes a response (error OR url) back to the checkout_sessions
 * document — e.g. because its Cloud Function crashed before it could
 * report an error — this rejects with a clear message instead of
 * leaving the caller (and the button) stuck forever with no feedback.
 */
export async function initiateCheckout(priceId, showToast = console.log, timeoutMs = 20000) {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    showToast("Please sign in or register before checking out.");
    return;
  }

  if (!priceId || priceId.includes("placeholder")) {
    showToast("Error: Invalid or unconfigured Stripe Price ID.");
    return;
  }

  showToast("Initializing secure Stripe checkout...");

  const userUid = auth.currentUser.uid;
  const checkoutSessionsRef = collection(db, "customers", userUid, "checkout_sessions");

  let sessionDocRef;
  try {
    sessionDocRef = await addDoc(checkoutSessionsRef, {
      price: priceId,
      success_url: `${window.location.origin}/learner.html?session=success`,
      cancel_url: `${window.location.origin}/store.html?session=cancelled`,
      mode: "payment",
      allow_promotion_codes: true,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Stripe Checkout Dispatch Error:", err);
    showToast(`Payment gateway error: ${err.message}`);
    throw err;
  }

  await new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      const detail = `No response from the payment system after ${Math.round(timeoutMs / 1000)}s. ` +
        `Check Firestore at customers/${userUid}/checkout_sessions/${sessionDocRef.id}, ` +
        `or the Stripe extension's Cloud Functions logs, for the real error.`;
      console.error("Stripe Checkout Timeout:", sessionDocRef.id);
      showToast("Checkout timed out — no response from Stripe. Please try again.");
      reject(new Error(detail));
    }, timeoutMs);

    const unsubscribe = onSnapshot(sessionDocRef, (snap) => {
      const data = snap.data();
      if (!data || settled) return;

      if (data.error) {
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        console.error("Stripe Extension Error:", data.error);
        showToast(`Checkout Error: ${data.error.message}`);
        reject(new Error(data.error.message || "Stripe checkout failed."));
      } else if (data.url) {
        settled = true;
        clearTimeout(timer);
        unsubscribe();
        showToast("Redirecting to Stripe payment gateway...");
        window.location.assign(data.url);
        resolve();
      }
    }, (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.error("Firestore Listener Error:", err);
      showToast("Lost connection while waiting for checkout.");
      reject(new Error("Firestore listener error: " + err.message));
    });
  });
}
