// ============================================================================
// assign-learner-ids.js — gives everyone already in the system a learner ID.
//
//   SELA1000  craig@selacivil.co.nz
//   SELA1001+ everyone else, earliest joined first
//
// "Joined" = when their selattm.com account was created (Firebase Auth). For
// people with no account yet (e.g. pre-paid by an admin), the earliest date
// found on their grant, results, quiz attempts or course progress is used.
// Anyone with no date at all goes last, in email order.
//
// IDs are saved on learner_profiles/{email}.learnerId. The next free number
// is kept in counters/learnerIds, which the assignLearnerIdOnSignup and
// assignLearnerIdOnGrant Cloud Functions use for everyone who joins later.
//
// Safe to run again: anyone who already has an ID keeps it, and only people
// still missing one are numbered (on the end, in join order).
//
// Usage (from the repo folder):
//   node scripts/assign-learner-ids.js            preview only, writes nothing
//   node scripts/assign-learner-ids.js --apply    assign and save the IDs
//
// Uses service-account-key.json and the firebase-admin package already
// installed under functions/node_modules (run `cd functions && npm install`
// first if that folder is missing).
// ============================================================================
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const SA_PATH = path.join(ROOT, "service-account-key.json");
const ADMIN_PKG = path.join(ROOT, "functions", "node_modules", "firebase-admin");

const FIRST_EMAIL = "craig@selacivil.co.nz";
const FIRST_NUMBER = 1000;
const PREFIX = "SELA";
const APPLY = process.argv.includes("--apply");

if (!fs.existsSync(SA_PATH)) { console.error(`Missing ${SA_PATH}`); process.exit(1); }
if (!fs.existsSync(ADMIN_PKG)) { console.error("firebase-admin not found. Run: cd functions && npm install && cd .."); process.exit(1); }

const admin = require(ADMIN_PKG);
admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });
const db = admin.firestore();
const auth = admin.auth();

const lower = (v) => String(v || "").trim().toLowerCase();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function main() {
  const people = new Map(); // email -> { email, joined: Date|null, hasAccount }
  const seen = (email, when, hasAccount = false) => {
    const e = lower(email);
    if (!validEmail(e)) return;
    const p = people.get(e) || { email: e, joined: null, hasAccount: false };
    const d = when ? new Date(when) : null;
    if (hasAccount) {
      // Account creation date wins over anything else.
      if (d && !isNaN(d)) p.joined = d;
      p.hasAccount = true;
    } else if (!p.hasAccount && d && !isNaN(d) && (!p.joined || d < p.joined)) {
      p.joined = d;
    }
    people.set(e, p);
  };

  // 1. Every account (skips anonymous sign-ins, which have no email).
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    page.users.forEach((u) => { if (u.email) seen(u.email, u.metadata.creationTime, true); });
    pageToken = page.pageToken;
  } while (pageToken);

  // 2. Everyone else the admin Learners tab knows about.
  const all = async (name) => (await db.collection(name).get()).docs;
  const [users, grants, plans, subs, attempts, progress, profiles] = await Promise.all(
    ["users", "grants", "learner_plans", "submissions", "attempts", "course_progress", "learner_profiles"].map(all));
  users.forEach((d) => seen(d.data().email, d.data().profileCompletedAt));
  grants.forEach((d) => seen(d.id, d.data().lastGrantedAt));
  plans.forEach((d) => seen(d.id, d.data().updatedAt));
  subs.forEach((d) => seen(d.data().email, d.data().completedAt));
  attempts.forEach((d) => seen(d.data().email, d.data().attemptedAt));
  progress.forEach((d) => seen(d.data().email, d.data().startedAt || d.data().updatedAt));
  profiles.forEach((d) => seen(d.id, null));
  seen(FIRST_EMAIL, null); // Craig gets SELA1000 even if he isn't in any list yet

  // 3. Who already has an ID.
  const existing = new Map();
  profiles.forEach((d) => { if (d.data().learnerId) existing.set(lower(d.id), d.data().learnerId); });
  const counterRef = db.collection("counters").doc("learnerIds");
  const counterSnap = await counterRef.get();

  // 4. Order: Craig first (only if numbering is starting fresh), then earliest joined.
  const todo = [...people.values()].filter((p) => !existing.has(p.email));
  todo.sort((a, b) => {
    if (a.joined && b.joined) return a.joined - b.joined || a.email.localeCompare(b.email);
    if (a.joined) return -1;
    if (b.joined) return 1;
    return a.email.localeCompare(b.email);
  });
  if (!counterSnap.exists) {
    const i = todo.findIndex((p) => p.email === FIRST_EMAIL);
    if (i > 0) todo.unshift(...todo.splice(i, 1));
  }

  const fmt = (d) => (d ? d.toISOString().slice(0, 10) : "no date");
  console.log(`${people.size} people found, ${existing.size} already have an ID, ${todo.length} to number.`);
  if (existing.size) {
    console.log("\nAlready numbered (unchanged):");
    [...existing].sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true })).forEach(([e, id]) => console.log(`  ${id}  ${e}`));
  }
  if (!todo.length) { console.log("\nNothing to do."); return; }

  let next = counterSnap.exists ? Number(counterSnap.data().next) : FIRST_NUMBER;
  console.log(`\n${APPLY ? "Assigning" : "Would assign"}:`);

  if (!APPLY) {
    todo.forEach((p) => console.log(`  ${PREFIX}${next++}  ${p.email}  (joined ${fmt(p.joined)})`));
    console.log("\nPreview only -- nothing saved. Run again with --apply to save these IDs.");
    return;
  }

  if (!counterSnap.exists) await counterRef.create({ next: FIRST_NUMBER, createdAt: new Date().toISOString() });

  // One transaction per person, same as the Cloud Functions, so a sign-up
  // happening at the same moment can never get a duplicate number.
  for (const p of todo) {
    const id = await db.runTransaction(async (tx) => {
      const profileRef = db.collection("learner_profiles").doc(p.email);
      const [c, prof] = await Promise.all([tx.get(counterRef), tx.get(profileRef)]);
      if (prof.exists && prof.data().learnerId) return prof.data().learnerId + " (already had one)";
      const n = Number(c.data().next);
      const now = new Date().toISOString();
      tx.set(counterRef, { next: n + 1, updatedAt: now }, { merge: true });
      tx.set(profileRef, { email: p.email, learnerId: `${PREFIX}${n}`, learnerIdAssignedAt: now, learnerIdSource: "backfill" }, { merge: true });
      return `${PREFIX}${n}`;
    });
    console.log(`  ${id}  ${p.email}  (joined ${fmt(p.joined)})`);
  }
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
