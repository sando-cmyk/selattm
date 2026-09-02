// ============================================================================
// add-admins.js — Grants admin-console access (public/admin.html) to one or
// more people by email, using this project's own service account.
//
// Why this has to be a script and not a button in admin.html: firestore.rules
// deliberately blocks ALL client writes to the "admins" collection, even from
// an existing admin ("allow write: if false;") -- see FIRESTORE-LOCKDOWN-PLAN.md.
// That's the whole point of the lock: the on/off switch for admin access has
// to live somewhere a browser can never reach. This script uses the service
// account's elevated credentials instead, which bypass security rules the
// same way sync-courses.js already does for the course catalog.
//
// Requirement: each person must have already signed up / logged in at least
// once at selattm.com/login.html -- Firebase Auth has to know their email
// before a UID can be looked up for it. If someone hasn't signed up yet,
// this script will say so and skip them; run it again for that person once
// they have an account.
//
// Usage:
//   node scripts/add-admins.js craig@selacivil.co.nz joseph@selacivil.co.nz
// ============================================================================
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const path = require("path");

const SA_PATH = path.join(__dirname, "..", "service-account-key.json");

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let parsed;
        try { parsed = data ? JSON.parse(data) : {}; } catch (e) { parsed = { raw: data }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken(sa, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(sa.private_key).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${unsigned}.${signature}`;

  const postData = `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`;
  const { status, body } = await httpsRequest({
    hostname: "oauth2.googleapis.com",
    path: "/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  }, postData);

  if (status !== 200 || !body.access_token) {
    throw new Error("Failed to get access token: " + JSON.stringify(body));
  }
  return body.access_token;
}

async function main() {
  const emails = process.argv.slice(2).map(e => e.trim()).filter(Boolean);
  if (emails.length === 0) {
    console.error("Usage: node scripts/add-admins.js <email1> [email2] ...");
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(SA_PATH, "utf8"));
  const projectId = sa.project_id;
  // cloud-platform is a broad scope, but the two things this script needs --
  // looking up an Auth account by email, and writing to Firestore -- live in
  // separate narrower scopes ("identitytoolkit" and "datastore"); this covers
  // both without needing to guess which narrower one the service account's
  // IAM role actually grants.
  const token = await getAccessToken(sa, "https://www.googleapis.com/auth/cloud-platform");
  console.log("Authenticated OK. Project:", projectId);

  // 1. Look up each email's Firebase Auth UID
  const lookupBody = JSON.stringify({ email: emails, targetProjectId: projectId });
  const lookupRes = await httpsRequest({
    hostname: "identitytoolkit.googleapis.com",
    path: "/v1/accounts:lookup",
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(lookupBody),
    },
  }, lookupBody);

  if (lookupRes.status !== 200) {
    console.error("Account lookup request failed:", JSON.stringify(lookupRes.body));
    console.error(
      "\nIf this says permission denied: the service account may be missing the " +
      "'Firebase Authentication Admin' IAM role in Google Cloud Console (IAM & Admin " +
      "-> find the service account -> Edit -> Add role)."
    );
    process.exit(1);
  }

  const found = lookupRes.body.users || [];
  const foundEmails = new Set(found.map(u => u.email));
  const missing = emails.filter(e => !foundEmails.has(e));

  if (missing.length) {
    console.warn(
      "\nNo account found yet for:", missing.join(", "),
      "\n-- they need to sign up / log in at selattm.com/login.html at least once " +
      "first, then re-run this script for them."
    );
  }

  if (found.length === 0) {
    console.error("\nNo matching accounts found for any of the given emails. Nothing to do.");
    process.exit(1);
  }

  // 2. Write admins/{uid} for each found user (this is the actual grant --
  //    a document existing here at all is what firestore.rules checks for)
  const authHeader = { Authorization: `Bearer ${token}` };
  for (const user of found) {
    const uid = user.localId;
    const body = JSON.stringify({
      fields: {
        email: { stringValue: user.email },
        addedBy: { stringValue: "add-admins.js" },
        addedAt: { stringValue: new Date().toISOString() },
      },
    });
    const setRes = await httpsRequest({
      hostname: "firestore.googleapis.com",
      path: `/v1/projects/${projectId}/databases/(default)/documents/admins/${uid}`,
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, body);
    console.log(
      `Granted admin access to ${user.email} (uid ${uid}):`,
      setRes.status === 200 ? "OK" : JSON.stringify(setRes.body)
    );
  }

  console.log("\nDone. They may need to sign out and back in at selattm.com for it to take effect immediately.");
}

main().catch(err => { console.error("SCRIPT FAILED:", err.message); process.exit(1); });
