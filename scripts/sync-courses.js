// ============================================================================
// sync-courses.js — Direct Firestore REST sync, no npm dependencies.
// Reads ../courses-import.json and ../service-account-key.json,
// replaces the live "courses" collection with exactly those records
// (deletes anything else, e.g. stale/duplicate placeholder docs).
// ============================================================================
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const path = require("path");

const SA_PATH = path.join(__dirname, "..", "service-account-key.json");
const COURSES_PATH = path.join(__dirname, "..", "courses-import.json");

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

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
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

function toFirestoreValue(v) {
  if (typeof v === "number") return { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  return { stringValue: String(v) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function main() {
  const sa = JSON.parse(fs.readFileSync(SA_PATH, "utf8"));
  const courses = JSON.parse(fs.readFileSync(COURSES_PATH, "utf8"));
  const projectId = sa.project_id;
  const token = await getAccessToken(sa);
  console.log("Authenticated OK. Project:", projectId);

  const base = `/v1/projects/${projectId}/databases/(default)/documents/courses`;
  const authHeader = { Authorization: `Bearer ${token}` };

  // 1. List existing docs
  const listRes = await httpsRequest({
    hostname: "firestore.googleapis.com",
    path: base,
    method: "GET",
    headers: authHeader,
  });
  const existingIds = (listRes.body.documents || []).map(d => d.name.split("/").pop());
  console.log("Existing course doc IDs in Firestore:", existingIds);

  const wantedIds = courses.map(c => c.id);

  // 2. Delete anything not in our clean list
  for (const id of existingIds) {
    if (!wantedIds.includes(id)) {
      const delRes = await httpsRequest({
        hostname: "firestore.googleapis.com",
        path: `${base}/${id}`,
        method: "DELETE",
        headers: authHeader,
      });
      console.log(`Deleted stale doc "${id}":`, delRes.status === 200 ? "OK" : delRes.body);
    }
  }

  // 3. Set/overwrite each correct course
  for (const course of courses) {
    const { id, ...rest } = course;
    const body = JSON.stringify({ fields: toFirestoreFields(rest) });
    const setRes = await httpsRequest({
      hostname: "firestore.googleapis.com",
      path: `${base}/${id}`,
      method: "PATCH",
      headers: { ...authHeader, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, body);
    console.log(`Wrote course "${id}" (${course.title}):`, setRes.status === 200 ? "OK" : JSON.stringify(setRes.body));
  }

  // 4. Confirm final state
  const finalRes = await httpsRequest({
    hostname: "firestore.googleapis.com",
    path: base,
    method: "GET",
    headers: authHeader,
  });
  const finalDocs = (finalRes.body.documents || []).map(d => d.name.split("/").pop());
  console.log("\nFINAL courses collection contents:", finalDocs.sort());
  console.log("Expected:", wantedIds.sort());
  console.log(JSON.stringify(finalDocs.sort()) === JSON.stringify(wantedIds.sort()) ? "MATCH - sync successful" : "MISMATCH - check manually");
}

main().catch(err => { console.error("SCRIPT FAILED:", err.message); process.exit(1); });
