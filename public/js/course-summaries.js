// ============================================================================
// File: public/js/course-summaries.js
// Project: Sela Skills Hub (Sela Civil Advisory Ltd)
// What each course covers and what the learner demonstrates. Used by:
//   - store.html (Sela Course Library): "Course outline" on each card
//   - learner.html (Your Courses): downloadable Record of Learning PDF
// Keyed by catalog course id (courses-import.json). Written from each
// course's own menu, learning objectives and assessment -- update this file
// whenever a course's content changes.
// ============================================================================

export const COURSE_SUMMARIES = {
  "basic-barrier-safety": {
    format: "Online, self-paced · 10 narrated slides · approx. 10–15 minutes",
    audience: "Crew, subcontractors and site visitors working on or near temporary or permanent barrier systems.",
    overview: "A site safety awareness module on why barrier systems are on site, the hazards around them and how to work safely when a barrier line is part of the job.",
    covers: [
      "Why barrier systems matter and the protection they give",
      "Types of barrier systems: water-filled, concrete, guardrail and temporary fencing",
      "Key hazards around barrier lines",
      "Safe work practices near barriers",
      "What to do when a barrier is damaged or displaced",
      "Emergency response if an incident occurs",
    ],
    demonstrates: [
      "Identifies common barrier types and the hazards each one separates people from",
      "Describes safe behaviour when working near a barrier line",
      "Knows not to move or alter barriers without authorisation and how to report damage",
      "Knows the correct response to a barrier strike or emergency",
    ],
    assessment: "10-question knowledge check, 80% (8/10) required to pass. Every slide must be viewed before completion.",
  },

  "tmw-side-road-safety": {
    format: "Online toolbox talk · 10 narrated slides · approx. 10–12 minutes",
    audience: "STMS, TCs and crew setting up and running worksites that use a side road for staging, parking or plant.",
    overview: "A toolbox talk built around a real overnight site health check that did not pass. Every issue traced back to how the side road was staged and checked before the site opened to traffic.",
    covers: [
      "Why the site failed its health check, and why every issue was avoidable",
      "Setting up staging on the side road",
      "Parking and operating vehicles and plant from the side road",
      "Hazards of plant loading in the live lane, using site photos",
      "Hazards of workers on foot in the live lane, using site photos",
      "The staging and parking checklist",
      "What to do if something isn't right",
    ],
    demonstrates: [
      "Recognises staging, parking and plant positions that put people or vehicles in the live lane",
      "Spots side-road hazards in real site photos",
      "Applies the staging and parking checklist before the site opens",
      "Knows how to raise and fix a problem on the night",
    ],
    assessment: "9-question knowledge check, 80% required to pass. Every slide must be viewed before completion.",
  },

  "pts-01": {
    format: "Online, self-paced · 30 narrated slides in 5 modules",
    audience: "TTM workers who set up, operate, monitor or pack down portable traffic signals.",
    overview: "Safe and compliant use of portable traffic signals, from the regulatory framework and equipment standards through to placement, operation, fail-safe behaviour and handover.",
    covers: [
      "Module 1: Terminology and the regulatory framework, roles and responsibilities, and why the term is \"portable traffic signals\"",
      "Module 2: Equipment and signal head standards (AS 4191), types of portable systems, key components, and signals versus Stop/Go",
      "Module 3: Site assessment, placement and orientation, required signage, timing and phasing, vulnerable road users, and fitting the TMP",
      "Module 4: Daily inspection, monitoring during the shift, fail-safe behaviour, communication protocols, and incidents and near misses",
      "Module 5: End-of-works removal, records and documentation, and handover between shifts and crews",
    ],
    demonstrates: [
      "Explains the compliance framework for portable traffic signals under AS 4191 and NZGTTM",
      "Checks that equipment and signal heads meet the standard before use",
      "Positions, signs and times an installation correctly against the TMP",
      "Operates, monitors and responds to a fault or fail-safe event during a shift",
      "Completes pack-down, records and a safe handover",
    ],
    assessment: "A self-check quiz at the end of Modules 1–4, 80% required to pass each one.",
  },

  "nzgttm-01": {
    format: "Online, self-paced · approx. 15 minutes",
    audience: "Anyone working in or around TTM who needs to understand the move from CoPTTM to NZGTTM.",
    overview: "An introduction to New Zealand's shift from a prescriptive, compliance-based code (CoPTTM) to the risk-based New Zealand Guide to Temporary Traffic Management (NZGTTM).",
    covers: [
      "Why temporary traffic management exists",
      "The transition from CoPTTM to NZGTTM",
      "What \"risk\" means in a TTM context",
      "Planning under the Risk Based Approach",
      "Choosing controls with the hierarchy of controls",
      "The Safe System Approach and survivable speeds",
      "How the TTM framework fits together",
    ],
    demonstrates: [
      "Explains why NZ moved from a prescriptive code to a risk-based guide",
      "Describes the Risk Based Approach, including the hierarchy of controls and lowest total risk",
      "Explains the Safe System Approach and how it applies on a TTM site",
      "Recognises how the frameworks work together and where responsibility sits in the contracting chain",
    ],
    assessment: "Final knowledge check, 80% required to pass.",
  },

  "ttm-roles-01": {
    format: "Online, self-paced · approx. 20 minutes",
    audience: "TTM workers, supervisors, planners and client representatives who need to know who is responsible for what.",
    overview: "How the NZGTTM frames roles and responsibilities across the whole TTM system, from the contracting chain and Transport Access Organisations to the STMS and the wider workforce.",
    covers: [
      "Why clear roles and responsibilities matter",
      "The contracting chain and the three PCBUs",
      "Transport Access Organisations (TAOs), including Road Controlling Authorities",
      "The TTM responsibilities model",
      "The Site Traffic Management Supervisor (STMS)",
      "The wider TTM workforce and capability functions",
    ],
    demonstrates: [
      "Identifies the PCBUs in a typical TTM contracting chain and each one's core responsibility",
      "Explains the role of TAOs, including their peer review and veto powers",
      "Explains how responsibility for TTM safety is shared, not identical, across the chain",
      "Describes the handoff from planning to on-site delivery and the three primary functions of the STMS",
      "Recognises the wider TTM workforce the sector needs to deliver TTM safely",
    ],
    assessment: "Final knowledge check, 80% required to pass.",
  },

  "ttm-eng-01": {
    format: "Online narrated deck · 35 slides · 7 concepts with 5 quick checks",
    audience: "Planners, designers, STMS and engineers who need the engineering reasoning behind NZGTTM requirements.",
    overview: "A working guide to the engineering thinking behind temporary traffic management in New Zealand, and where each requirement comes from.",
    covers: [
      "What the NZGTTM is",
      "Concept 1: Risk-based design",
      "Concept 2: TTM as temporary road design",
      "Concept 3: Geometric design principles",
      "Concept 4: Traffic engineering principles",
      "Concept 5: Safety engineering and positive protection",
      "Concept 6: Equipment engineering",
      "Concept 7: Specialist projects and complex sites",
      "The five sources these requirements come from",
    ],
    demonstrates: [
      "Justifies TTM decisions on risk instead of copying a template layout",
      "Applies road-design, geometric and traffic engineering thinking to a temporary layout",
      "Explains when positive protection and engineered controls are needed under HSWA and Road to Zero",
      "Recognises when equipment, sites or projects fall outside the standard toolbox, and what to do",
    ],
    assessment: "10-question final test, 80% required to pass. Every narrated slide must be listened to or read first.",
  },

  "40233-ttm-road-reserve": {
    format: "Online learning (3 modules) plus an on-site practical sign-off · Skill Standard 40233 (NZQA Level 3, 5 credits)",
    audience: "Workers assisting with temporary traffic management within the road reserve.",
    overview: "Built against Skill Standard 40233, Assist with temporary traffic management within the road reserve. The online modules cover the underpinning knowledge; a supervisor or assessor then observes and signs you off on site.",
    covers: [
      "Module 1: The road reserve and its legal boundaries, the TTM zone, how hazards cause harm, six common onsite hazards, and WorkSafe good-practice guidance",
      "Module 2: Risk assessments and the TMP, the hierarchy of controls and lowest total risk, on-site risk checks, spotting when conditions move away from the TMP, and organisational requirements",
      "Module 3: Driving, parking and positioning safely, the SAFE installation sequence, communicating with crew and supervisor, actively controlling vehicles, protecting vulnerable road users, and handling changes, incidents and emergencies",
    ],
    demonstrates: [
      "Defines the road reserve and TTM zone and explains how common hazards cause harm",
      "Checks the risk assessment and TMP onsite and recognises when the site no longer matches the plan",
      "Installs and works within TTM safely, communicating clearly with crew and supervisor",
      "Actively controls vehicle movements and protects vulnerable road users",
      "Responds correctly to changes, incidents and emergencies onsite",
    ],
    assessment: "A knowledge check at the end of each module (80% to pass), then a Practical Sign-Off & Assessment Booklet completed and signed on site with a supervisor or assessor.",
  },

  "ashtas-01": {
    format: "Online, 56 slides in 4 modules with presenter notes · Austroads and Lantra, Operative level",
    audience: "Operatives installing, maintaining or repairing road safety barrier systems.",
    overview: "The ASHTAS Operative training for road safety hardware and barrier systems, delivered slide by slide with the presenter notes, followed by the formal course test.",
    covers: [
      "Module 1: Course overview",
      "Module 2: Introduction to road safety barrier systems",
      "Module 3: System performance",
      "Module 4: Terminology",
      "Close-out: data protection, reminders and preparing for the course test",
    ],
    demonstrates: [
      "Understands how road safety barrier systems perform and why correct installation matters",
      "Uses the correct ASHTAS terminology for barrier systems and components",
      "Is prepared for the formal ASHTAS Operative course test and e-logbook",
    ],
    assessment: "A check-in question after each module. The formal course test (30 multiple-choice questions, open book, 60 minutes, 80% pass mark) is taken separately in Moodle, followed by an e-logbook and interview for the Lantra qualification.",
  },
};

const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// HTML outline used on the Course Library cards.
export function courseOutlineHtml(courseId) {
  const s = COURSE_SUMMARIES[courseId];
  if (!s) return "";
  return `
    <details class="course-outline">
      <summary>Course outline: what you'll cover and demonstrate</summary>
      <div class="course-outline-body">
        <p class="co-overview">${esc(s.overview)}</p>
        <p class="co-meta"><strong>Format:</strong> ${esc(s.format)}<br><strong>Who it's for:</strong> ${esc(s.audience)}</p>
        <h4>What you'll cover</h4>
        <ul>${s.covers.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>What you'll demonstrate</h4>
        <ul>${s.demonstrates.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <h4>Assessment</h4>
        <p>${esc(s.assessment)}</p>
      </div>
    </details>`;
}
