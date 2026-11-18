// ============================================================================
// File: public/js/tmp-rubric.js
// Project: Sela Skills Hub (Sela Civil Advisory Ltd)
// TMP Design Practical Sign-off (NZGTTM-TMP-PS) -- the marking criteria.
// One source for both sides:
//   - courses/nzgttm-tmp-ps/index.html shows these to the learner before they
//     submit, and shows their marked result against them afterwards.
//   - js/admin-tmp-signoff.js is the assessor's marking tool.
// Change the wording here and both pages update. Never re-use or renumber a
// criterion id that has already been marked -- add a new id instead, so old
// assessments still read correctly.
// ============================================================================

export const SIGNOFF = {
  courseId: "nzgttm-tmp-ps",
  courseCode: "NZGTTM-TMP-PS",
  courseTitle: "TMP Design Practical Sign-off",
  price: 200,
  attemptsAllowed: 3,
  maxNonCriticalGaps: 2,
  maxFileMB: 25,
  maxFiles: 6,
};

// critical: true  -> must be Met to be signed off.
// naAllowed: true -> the assessor may mark it Not applicable for this TMP.
export const RUBRIC = [
  {
    id: "A", title: "TMP structure and general information",
    criteria: [
      { id: "A1", critical: true, text: "Uses the NZGTTM TMP form set: TMP Planning Form, TMP General Form and one TMD Form for each layout (for example attended and unattended, installation and removal).",
        evidence: "All parts present and cross-referenced; TMD numbers match between the forms." },
      { id: "A2", critical: true, text: "Location and road characteristics are complete and accurate: road names and extents, RCA, road category, permanent speed limit, traffic volume (AADT) and vehicle mix.",
        evidence: "Permanent speed matches the National Speed Limit Register; heavy vehicle share stated." },
      { id: "A3", critical: false, text: "Programme and times are clear and consistent: start and end dates, TTM installation and removal times, activity times.",
        evidence: "No conflicts between the General Form and each TMD Form." },
      { id: "A4", critical: false, text: "Transport aspects affected are identified (pedestrians, cyclists, property access, parking, public transport, signals, rail, over-dimension route, traffic lanes) and linked to the TMDs they apply to.",
        evidence: "Every 'yes' has a TMD reference and a matching control." },
    ],
  },
  {
    id: "B", title: "Risk assessment and controls",
    criteria: [
      { id: "B1", critical: true, text: "Activity and environment risks are identified for this site, not copied from a generic list, and described as hazard, exposure and consequence.",
        evidence: "Risks name the real features of the site: speed, alignment, sight lines, users, time of day." },
      { id: "B2", critical: true, text: "Controls are chosen using the hierarchy of controls, with commentary on why each was selected and why the result is the lowest total risk.",
        evidence: "Higher-order options (closure, detour, off-peak, barrier) considered and the decision explained." },
      { id: "B3", critical: false, naAllowed: true, text: "Vulnerable road users (pedestrians, mobility-impaired, cyclists, motorcyclists) have a safe, continuous and accessible route through or around the site.",
        evidence: "Route widths, surfaces, crossings and lighting addressed where they apply." },
      { id: "B4", critical: false, naAllowed: true, text: "Required authorisations and interfaces are identified and evidenced: road closure, public transport, permanent signals, parking, rail corridor (within 100 m), over-dimension route, barrier design.",
        evidence: "Evidence attached or the approval step stated." },
    ],
  },
  {
    id: "C", title: "Dimensions and layout",
    criteria: [
      { id: "C1", critical: true, text: "Design speed is stated and justified: operating speed (85th percentile) against the permanent limit; any temporary speed limit is supported by measures that will achieve it.",
        evidence: "Reaction-time group (1.5 s / 2 s / 2.5 s) matches the design speed." },
      { id: "C2", critical: true, text: "Sign visibility, sign spacing and warning distances are correct for the design speed and allow for expected queue lengths.",
        evidence: "Distances agree with the NZGTTM basis of dimensions; VMS allowed longer visibility." },
      { id: "C3", critical: true, text: "Longitudinal and lateral exclusion zones are correctly sized for the speed, surface, vehicle mix and hazard (including excavation depth), and the decision on a barrier is justified.",
        evidence: "Sealed/unsealed and heavy-vehicle adjustments applied; excavations widened 2 m per 1 m depth." },
      { id: "C4", critical: true, text: "Taper lengths, distance between tapers and temporary lane widths suit the design speed and the vehicles using the road.",
        evidence: "Tapers based on a 1 m/s lateral shift; gap between tapers at least the longitudinal exclusion zone; lane widths workable for heavy vehicles." },
      { id: "C5", critical: false, text: "Delineation spacing, thresholds and curves are correct; no taper sits on a curve tighter than the minimum radius for the speed without specific geometric design.",
        evidence: "5/10/15 m on straights, about 10 devices per taper or curve, 5 devices each side at thresholds; R ≈ V²/26 checked." },
      { id: "C6", critical: false, naAllowed: true, text: "Sight distance for workers on foot (12 seconds clear sight distance) and, for mobile operations, tail pilot and shadow vehicle separations are addressed.",
        evidence: "Distances given for the design speed; mobile separations in seconds and metres." },
    ],
  },
  {
    id: "D", title: "The Traffic Management Diagram (TMD)",
    criteria: [
      { id: "D1", critical: true, text: "Each TMD is legible and complete: road names, north point, legend, every sign and device shown, work area and safety zones marked, drawn to scale or fully dimensioned.",
        evidence: "An STMS could set the site out from the diagram alone." },
      { id: "D2", critical: false, text: "Key dimensions are labelled on the diagram (metres, and seconds of travel where useful) so the set-out can be checked on site.",
        evidence: "Sign spacing, taper, exclusion zones and lane widths shown." },
      { id: "D3", critical: false, text: "Installation, site and removal methodologies match the diagrams and include how the site will be monitored.",
        evidence: "Order of installation and removal protects the crew; monitoring frequency stated." },
    ],
  },
  {
    id: "E", title: "Contingencies and communication",
    criteria: [
      { id: "E1", critical: false, text: "Contingency plans cover the likely events (breakdown, crash, debris, weather, queues, emergency vehicles, reopening before peak), and public notification is planned.",
        evidence: "Each contingency says who does what." },
    ],
  },
];

export const ALL_CRITERIA = RUBRIC.flatMap(s => s.criteria.map(c => ({ ...c, section: s.id, sectionTitle: s.title })));

// marks: { [criterionId]: { mark: "met" | "not_yet" | "na", comment } }
// Returns the outcome the marks support. The assessor still confirms it.
export function evaluate(marks = {}) {
  const missing = [], criticalGaps = [], otherGaps = [];
  for (const c of ALL_CRITERIA) {
    const m = marks[c.id] && marks[c.id].mark;
    if (!m || (m === "na" && !c.naAllowed)) { missing.push(c.id); continue; }
    if (m === "not_yet") (c.critical ? criticalGaps : otherGaps).push(c.id);
  }
  const complete = missing.length === 0;
  const competent = complete && criticalGaps.length === 0 && otherGaps.length <= SIGNOFF.maxNonCriticalGaps;
  return { complete, competent, missing, criticalGaps, otherGaps };
}

export const PASS_RULE =
  `To be signed off, every criterion marked Critical must be met, and no more than ${SIGNOFF.maxNonCriticalGaps} of the other criteria can be "not yet met" (they become corrections to make before you use the TMP).`;
