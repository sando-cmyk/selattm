// ============================================================================
// File: public/js/progress-sync.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Saves where each signed-in learner is up to in a course to
//              Firestore, so admin.html's Learners panel can show it.
//
//   Every course engine already keeps its own progress in the learner's
//   browser (localStorage). This file reads that saved progress -- it never
//   changes it -- and copies a short summary up to:
//
//     course_progress/{uid}__{courseId}
//       done / total        -- screens (slides + quizzes) completed
//       percent             -- 0-100
//       position            -- where they are now, e.g. "Slide 21"
//       quizzesPassed / quizzesTotal (where the course has scored quizzes)
//       contentComplete     -- finished all the content
//       startedAt / updatedAt
//
//   Loaded by home-button.js, which is on every course page, so no course
//   page needs editing. Writes only when the summary actually changes.
//   done/percent only ever go UP, so opening the course on a second device
//   (with no local progress yet) never wipes out real progress.
//
//   Engines handled (see summarise() below):
//     window.Course          -- slide decks with js/course.js (BBS, TMW,
//                               40233, RA, VRU, FB, SA, SAT)
//     window.CourseProgress  -- shared kit, js/course-progress.js (PTS-01)
//     window.CourseNav       -- ASHTAS-01
//     COURSE + SCORM         -- NZGTTM Essentials, Roles & Responsibilities
//     SLIDES + SCORM         -- TTM Engineering Essentials
// ============================================================================

import { auth, db, doc, getDoc, setDoc, onAuthStateChanged } from "./firebase-init.js";
import { courseForPath } from "./course-map.js";

const COURSE_INFO = courseForPath();
const SENT_KEY = "sela_progress_sync::v1::";
const OWN_KEYS = /^(sela_progress_sync|sela_last_seen|sela_attempts_seen)/;

function readJSON(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}
const pct = (done, total) => (total ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0);

// ---------------------------------------------------------------- engines
function fromSlideDeck(api, totalSlides, quizIds) {
  const st = api.getState() || { visited: [], quizzes: {} };
  const visited = (st.visited || []).filter(n => !totalSlides || n <= totalSlides).length;
  const quizzes = st.quizzes || {};
  const passed = quizIds.filter(id => quizzes[id] && quizzes[id].passed).length;
  const pageSlide = (location.pathname.match(/slide(\d+)\.html$/) || [])[1];
  const pageQuiz = document.body && document.body.getAttribute("data-quiz");
  const pageQuizFile = (location.pathname.match(/\/(quiz\w*|final\w*)\.html$/) || [])[1];
  let position = "";
  if (pageSlide) position = `Slide ${pageSlide}`;
  else if (pageQuiz || pageQuizFile) position = `Quiz (${pageQuiz || pageQuizFile})`;
  else if (/complete\.html$/.test(location.pathname)) position = "Completion page";
  else if (api.lastVisitedSlide && api.lastVisitedSlide()) position = `Slide ${api.lastVisitedSlide()} (furthest)`;
  return {
    done: Math.min(visited, totalSlides) + passed,
    total: totalSlides + quizIds.length,
    percent: typeof api.overallPercent === "function" ? api.overallPercent() : pct(visited + passed, totalSlides + quizIds.length),
    position,
    quizzesPassed: passed,
    quizzesTotal: quizIds.length,
    contentComplete: typeof api.isComplete === "function" ? !!api.isComplete() : false,
  };
}

function fromAshtas() {
  const st = readJSON("ashtas_operative_training_v6_progress");
  if (!st) return null;
  // 56 slides + 4 check-in quizzes. menu/complete/welcome don't count.
  const counted = (st.visited || []).filter(p => /^(slide\d+|quiz\d+)$/.test(p));
  const total = 60;
  const loc = st.location || "";
  const position = /^slide\d+$/.test(loc) ? `Slide ${loc.slice(5)} of 56`
    : /^quiz\d+$/.test(loc) ? `Check-in quiz ${loc.slice(4)}`
    : loc === "complete" ? "Completion page" : loc === "menu" ? "Course menu" : loc;
  return {
    done: Math.min(counted.length, total),
    total,
    percent: pct(counted.length, total),
    position,
    contentComplete: !!st.completed,
  };
}

function fromScreens() {
  // NZGTTM Essentials / Roles: progress-store.js keeps SCORM-style data.
  const folder = (location.pathname.match(/\/courses\/([^\/]+)\//) || [])[1] || "";
  const keys = Object.keys(localStorage).filter(k => k.startsWith("sela_course_progress::"));
  const short = folder.replace(/-responsibilities$/, "");
  const key = keys.find(k => k.includes("::" + folder + "::")) || keys.find(k => k.includes("::" + short + "::"));
  const data = key ? readJSON(key) : null;
  if (!data) return null;
  let susp = null;
  try { susp = JSON.parse(data["cmi.suspend_data"] || "null"); } catch (_) {}
  const screens = (window.COURSE && window.COURSE.screens) || [];
  const total = screens.length;
  const idx = susp && typeof susp.screenIndex === "number" ? susp.screenIndex : 0;
  const status = String(data["cmi.core.lesson_status"] || "");
  const finished = status === "passed" || status === "completed";
  const screen = screens[idx];
  return {
    done: finished ? total : Math.min(idx + 1, total),
    total,
    percent: finished ? 100 : pct(idx + 1, total),
    position: total ? `Step ${idx + 1} of ${total}${screen && screen.title ? ` – ${screen.title}` : ""}` : "",
    quizzesPassed: susp && susp.quizPassed ? 1 : 0,
    quizzesTotal: window.COURSE && Array.isArray(window.COURSE.quiz) && window.COURSE.quiz.length ? 1 : 0,
    contentComplete: finished,
  };
}

function fromSlidesEngine() {
  // TTM Engineering Essentials: SLIDES (slide-data.js) + SCORM bookmark.
  const slides = window.SLIDES;
  const s = window.SCORM;
  const total = slides.length;
  const bm = s.getBookmark ? s.getBookmark() : "";
  const idx = Math.max(0, slides.findIndex(x => x.id === bm));
  const status = s.getStatus ? s.getStatus() : "";
  const finished = status === "passed" || status === "completed";
  const slide = slides[idx];
  return {
    done: finished ? total : (bm ? idx + 1 : 0),
    total,
    percent: finished ? 100 : (bm ? pct(idx + 1, total) : 0),
    position: bm ? `Slide ${idx + 1} of ${total}${slide && (slide.nav || slide.title) ? ` – ${slide.nav || slide.title}` : ""}` : "",
    quizzesPassed: status === "passed" ? 1 : 0,
    quizzesTotal: 1,
    contentComplete: finished,
  };
}

function summarise() {
  try {
    if (window.CourseNav) return fromAshtas();
    if (window.Course && typeof window.Course.getState === "function")
      return fromSlideDeck(window.Course, window.Course.TOTAL_SLIDES || 0, window.Course.QUIZ_IDS || []);
    if (window.CourseProgress && typeof window.CourseProgress.getState === "function") {
      const b = document.body;
      const total = Number(b.getAttribute("data-course-total-slides") || 0);
      const quizIds = (b.getAttribute("data-course-quiz-ids") || "").split(",").map(s => s.trim()).filter(Boolean);
      return fromSlideDeck(window.CourseProgress, total, quizIds);
    }
    if (window.COURSE && Array.isArray(window.COURSE.screens)) return fromScreens();
    if (Array.isArray(window.SLIDES) && window.SCORM) return fromSlidesEngine();
  } catch (e) {
    console.warn("[progress-sync] could not read course progress:", e && e.message);
  }
  return null;
}

// ---------------------------------------------------------------- sync
let user = null;
let remote; // undefined = not fetched yet, null = no doc yet
let timer = null;

async function sync() {
  if (!user || user.isAnonymous || COURSE_INFO.courseId === "unknown") return;
  const snap = summarise();
  if (!snap || !snap.total) return;

  const id = `${user.uid}__${COURSE_INFO.courseId}`;
  const sentKey = SENT_KEY + id;
  const sig = JSON.stringify(snap);
  try { if (localStorage.getItem(sentKey) === sig) return; } catch (_) {}

  const ref = doc(db, "course_progress", id);
  if (remote === undefined) {
    try { const d = await getDoc(ref); remote = d.exists() ? d.data() : null; } catch (_) { remote = null; }
  }
  const now = new Date().toISOString();
  const best = remote && typeof remote.done === "number" && remote.done > snap.done ? remote : null;
  const record = {
    userId: user.uid,
    email: (user.email || "").toLowerCase(),
    ...COURSE_INFO,
    done: best ? best.done : snap.done,
    total: snap.total,
    percent: Math.max(snap.percent, (remote && remote.percent) || 0),
    position: snap.position || "",
    positionPage: location.pathname,
    quizzesPassed: Math.max(snap.quizzesPassed || 0, (remote && remote.quizzesPassed) || 0),
    quizzesTotal: snap.quizzesTotal || 0,
    contentComplete: !!(snap.contentComplete || (remote && remote.contentComplete)),
    updatedAt: now,
    startedAt: (remote && remote.startedAt) || now,
  };
  if (record.contentComplete && !(remote && remote.contentCompletedAt)) record.contentCompletedAt = now;
  else if (remote && remote.contentCompletedAt) record.contentCompletedAt = remote.contentCompletedAt;

  try {
    await setDoc(ref, record, { merge: true });
    remote = record;
    try { localStorage.setItem(sentKey, sig); } catch (_) {}
  } catch (e) {
    console.warn("[progress-sync] not recorded:", e && e.message);
  }
}

function schedule(delay = 3000) {
  clearTimeout(timer);
  timer = setTimeout(sync, delay);
}

// Any course saving its own progress -> resync shortly after.
try {
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    const r = orig.apply(this, arguments);
    try { if (this === window.localStorage && !OWN_KEYS.test(String(k))) schedule(); } catch (_) {}
    return r;
  };
} catch (_) {}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sync(); });

onAuthStateChanged(auth, (u) => {
  user = u;
  if (u && !u.isAnonymous) schedule(2500); // let the course finish starting up first
});
