// ============================================================================
// File: public/js/course-map.js
// Folder under /public/courses/ -> catalog course (ids/codes match
// courses-import.json). Shared by attempt-logger.js, course-sequence.js and
// sequence-guard.js. Add a line here when a new course goes live.
// ============================================================================
export const COURSES = {
  "ttm-portable-traffic-signals": { courseId: "pts-01", courseCode: "PTS-01", courseTitle: "Working with Portable Traffic Signals" },
  "basic-barrier-safety-course": { courseId: "basic-barrier-safety", courseCode: "TTM-BBS-01", courseTitle: "Working Safely Near Barrier Systems" },
  "tmw-side-road-safety": { courseId: "tmw-side-road-safety", courseCode: "TTM-TMW-01", courseTitle: "Staging & Vehicles on Side Roads" },
  "40233-ttm-road-reserve": { courseId: "40233-ttm-road-reserve", courseCode: "US-40233", courseTitle: "Assist with Temporary Traffic Management within the Road Reserve" },
  "nzgttm-essentials": { courseId: "nzgttm-01", courseCode: "NZGTTM-01", courseTitle: "NZGTTM Essentials" },
  "nzgttm-roles-responsibilities": { courseId: "ttm-roles-01", courseCode: "TTM-ROLES-01", courseTitle: "Roles & Responsibilities for TTM in New Zealand" },
  "ttm-engineering-essentials": { courseId: "ttm-eng-01", courseCode: "TTM-ENG-01", courseTitle: "Core Engineering Concepts of TTM in New Zealand" },
  "ashtas-01": { courseId: "ashtas-01", courseCode: "ASHTAS-01", courseTitle: "ASHTAS Operative" },
};

export function courseForPath(pathname = location.pathname) {
  const m = pathname.match(/\/courses\/([^\/]+)\//);
  const folder = m ? m[1] : "unknown";
  return COURSES[folder] || { courseId: folder, courseCode: "", courseTitle: folder };
}

// Normalise any record's courseId/courseCode (older pages record their own
// folder name as courseId) to the catalog course id.
export function catalogIdFor(rec) {
  const id = String(rec.courseId || "").toLowerCase();
  const code = String(rec.courseCode || "").toLowerCase();
  for (const [folder, c] of Object.entries(COURSES)) {
    if (c.courseId.toLowerCase() === id || folder === id || (code && c.courseCode.toLowerCase() === code)) return c.courseId;
  }
  return rec.courseId || "";
}

export function titleFor(courseId) {
  const c = Object.values(COURSES).find(x => x.courseId === courseId);
  return c ? c.courseTitle : courseId;
}
