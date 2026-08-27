import { auth, db, doc, collection, addDoc, onSnapshot } from "./firebase-init.js";

/**
 * Initiates Stripe Checkout Session with full error logging
 */
export async function initiateCheckout(priceId, showToast = console.log) {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    showToast("Please sign in or register before checking out.");
    return;
  }

  if (!priceId || priceId.includes("placeholder")) {
    showToast("Error: Invalid or unconfigured Stripe Price ID.");
    return;
  }

  showToast("Initializing secure Stripe checkout...");

  try {
    const userUid = auth.currentUser.uid;
    const checkoutSessionsRef = collection(db, "customers", userUid, "checkout_sessions");

    const sessionDocRef = await addDoc(checkoutSessionsRef, {
      price: priceId,
      success_url: `${window.location.origin}/learner.html?session=success`,
      cancel_url: `${window.location.origin}/store.html?session=cancelled`,
      mode: "payment",
      allow_promotion_codes: true,
      createdAt: new Date().toISOString()
    });

    onSnapshot(sessionDocRef, (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.error) {
        console.error("Stripe Extension Error:", data.error);
        showToast(`Checkout Error: ${data.error.message}`);
      } else if (data.url) {
        window.location.assign(data.url);
      } else if (data.sessionId) {
        showToast("Redirecting to Stripe payment gateway...");
      }
    });

  } catch (err) {
    console.error("Stripe Checkout Dispatch Error:", err);
    showToast(`Payment gateway error: ${err.message}`);
  }
}