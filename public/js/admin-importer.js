// ============================================================================
// File: public/js/admin-importer.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Schema-validated Bulk Ingestion Engine for CSV and JSON files.
//              Enforces mandatory numeric prices, ISO timestamps, and clean IDs.
// ============================================================================

import { getFirestore, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

// Standard default pricing if not explicitly provided in upload
const DEFAULT_COURSE_PRICE = 250.00;
const DEFAULT_CURRENCY = "NZD";

/**
 * Validates and normalises a raw course object into a strict schema.
 * @param {Object} raw 
 * @returns {Object} Cleaned course document
 */
export function normaliseCourseRecord(raw) {
  // Generate safe kebab-case ID if missing
  let id = raw.id || raw.code || `course-${Date.now()}`;
  id = String(id).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  // Enforce valid positive float for price
  let price = parseFloat(raw.price ?? raw.cost ?? raw.amount);
  if (isNaN(price) || price < 0) {
    price = DEFAULT_COURSE_PRICE;
  }

  // Format title and code
  const title = String(raw.title || raw.name || "Untitled Course").trim();
  const code = String(raw.code || id.toUpperCase()).trim();
  const description = String(raw.description || "Certified TTM training module.").trim();
  const category = String(raw.category || "TTM Training").trim();
  const currency = String(raw.currency || DEFAULT_CURRENCY).trim().toUpperCase();
  const status = String(raw.status || "active").trim().toLowerCase();
  const launchPath = String(raw.launchPath || `/courses/${id}/index.html`).trim();

  const cleaned = {
    id,
    code,
    title,
    description,
    category,
    price,
    currency,
    status,
    launchPath,
    lastUpdated: new Date().toISOString()
  };

  // Stripe Price ID -- pass through untouched, ONLY when actually provided.
  // This is written via a merge, so omitting the key when it's absent from
  // the upload leaves any existing stripePriceId on the Firestore doc alone
  // instead of silently blanking it on a re-upload that doesn't include it.
  // Without this field at all, a course has no way to be sold: the store
  // page reads it directly to build the checkout button.
  if (raw.stripePriceId && String(raw.stripePriceId).trim()) {
    cleaned.stripePriceId = String(raw.stripePriceId).trim();
  }

  // Legacy Stripe Price IDs -- prices this course used to sell under before
  // being archived and replaced. Same pass-through-only-when-provided rule
  // as stripePriceId above: this is what stops a customer who paid under an
  // old price from silently losing learner.html access the next time this
  // course's price changes. Never dropped or overwritten by a re-upload
  // that omits it.
  if (Array.isArray(raw.legacyStripePriceIds) && raw.legacyStripePriceIds.length) {
    cleaned.legacyStripePriceIds = raw.legacyStripePriceIds.map(id => String(id).trim()).filter(Boolean);
  }

  return cleaned;
}

/**
 * Parses raw CSV text into validated JavaScript objects.
 */
export function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (values.length === headers.length) {
      const rawObj = {};
      headers.forEach((h, idx) => {
        rawObj[h] = values[idx];
      });
      records.push(normaliseCourseRecord(rawObj));
    }
  }
  return records;
}

/**
 * Commits course records to Firestore using safe chunked batch writes.
 * @param {Array<Object>} coursesList 
 * @param {Function} onProgress (percent, currentCount, totalCount)
 */
export async function bulkUploadToFirestore(coursesList, onProgress) {
  if (!Array.isArray(coursesList) || coursesList.length === 0) {
    throw new Error("No course records provided for ingestion.");
  }

  const cleanRecords = coursesList.map(item => normaliseCourseRecord(item));
  const BATCH_SIZE = 400;
  let processed = 0;
  const total = cleanRecords.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = cleanRecords.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(course => {
      const docRef = doc(db, "courses", course.id);
      batch.set(docRef, course, { merge: true });
    });

    await batch.commit();
    processed += chunk.length;

    if (typeof onProgress === 'function') {
      const percent = Math.min(100, Math.round((processed / total) * 100));
      onProgress(percent, processed, total);
    }
  }

  return { success: true, count: total };
}