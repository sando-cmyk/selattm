/* Slide content for the narrated SCORM version of the
   "Core Engineering Concepts of TTM in New Zealand" deck.
   Mirrors sela-ttm-engineering-essentials.pptx slide-for-slide (23 slides). */

var COURSE_TITLE = "Core Engineering Concepts of TTM in New Zealand";
var ICON = function (name) { return "assets/icons/" + name + ".png"; };
var LOGO = "assets/sela-logo-transparent.png";

// Each slide: { id, audio, theme: 'light'|'dark', kicker, title, subtitle, blocks: [...] }
// audio maps to audio/<audio>.mp3 — if the file is missing the player hides itself gracefully.

var SLIDES = [
  // 1 ---------------------------------------------------------------- Title
  {
    id: "title", nav: "Welcome", audio: "01-title", theme: "dark", kind: "title",
    eyebrow: "ESSENTIALS PRIMER  ·  NZGTTM (2023)",
    title: "Core Engineering Concepts of TTM in New Zealand",
    subtitle: "A working guide to the engineering thinking behind Temporary Traffic Management — and where each requirement comes from.",
  },

  // 2 -------------------------------------------------------------- Roadmap
  {
    id: "roadmap", nav: "Roadmap", audio: "02-roadmap", theme: "light",
    kicker: "Where we're going", title: "Seven concepts, five quick checks",
    subtitle: "This session works through the engineering logic of NZGTTM in order — each concept builds on the one before it. Along the way, five short knowledge checks let you test what's landing.",
    blocks: [
      { type: "numberedIconList", items: [
        ["1", "clipboard-check", "Risk-Based Design"],
        ["2", "road", "TTM as Temporary Road Design"],
        ["3", "ruler", "Geometric Design Principles"],
        ["4", "traffic-light", "Traffic Engineering Principles"],
        ["5", "shield", "Safety Engineering & Positive Protection"],
        ["6", "tools", "Equipment Engineering"],
        ["7", "train", "Specialist Projects & Complex Sites"],
      ]},
      { type: "sidebarNote", heading: "Quick checks", icon: "question",
        text: "Five short questions are woven through the deck — after Concepts 1, 2, 5 and 7, and one final wrap-up check before the close.",
        note: "Pick your answer, then move to the next slide to see if you were right and why." },
    ],
  },

  // 3 --------------------------------------------------- What NZGTTM is
  {
    id: "what-is-nzgttm", nav: "What NZGTTM Is", audio: "03-what-is-nzgttm", theme: "light",
    kicker: "Getting oriented", title: "What NZGTTM actually is",
    blocks: [
      { type: "richText", html: "NZGTTM (2023) is a <b>best-practice guide</b> — not a mandatory code of practice — intended for PCBUs who fund, plan, or engage in activities on or near roads. It moves the industry from the old, prescriptive Code of Practice for Temporary Traffic Management (COPTTM, 4th edition) to a <b>risk-based system.</b>" },
      { type: "subhead", text: "It is designed to be read alongside other frameworks, not instead of them:" },
      { type: "iconList", items: [
        ["hard-hat", "WorkSafe's Good Practice Guide (2022)"],
        ["gavel", "Health and Safety at Work Act 2015"],
        ["bullseye", "Road to Zero strategy"],
        ["book", "Land Transport Management Act 2003 & Local Government Act 2002"],
      ]},
      { type: "sidePanel", heading: "Reading the guide's language", dark: true, items: [
        ["MUST", "Legal requirement — has to be complied with.", "green"],
        ["SHOULD / COULD", "Recommended practice or approach.", "blue"],
      ], footnote: "Every “must” in this deck is a legal requirement, not a suggestion." },
    ],
  },

  // 4 ------------------------------------------------- Concept 1
  {
    id: "concept1", nav: "1. Risk-Based Design", audio: "04-concept1-risk-based-design", theme: "light",
    pill: "Concept 1 of 7", title: "Risk-Based Design",
    subtitle: "NZGTTM replaces prescriptive layouts with a full risk-based approach: every engineering decision must be justified, not copied from a template.",
    blocks: [
      { type: "cardGrid", columns: 2, cards: [
        { icon: "map-marker", heading: "Site-specific hazards", body: "Sight lines, gradients, intersections, adjacent hazards actually present." },
        { icon: "walking", heading: "Road user behaviour", body: "How drivers, cyclists and pedestrians actually behave — not just how they should." },
        { icon: "hard-hat", heading: "Worker exposure", body: "How close workers are to live traffic, and for how long." },
        { icon: "wind", heading: "Environment & activity conditions", body: "Weather, lighting, traffic volumes, and the nature of the work itself." },
      ]},
    ],
  },

  // 5-6 ------------------------------------------------- Quick Check 1
  { id: "qc1-q", nav: "Quick Check 1", audio: "05-quickcheck1-question", theme: "dark", kind: "question", quizIndex: 0 },
  { id: "qc1-a", nav: "Answer 1", audio: "06-quickcheck1-answer", theme: "light", kind: "answer", quizIndex: 0 },

  // 7 ------------------------------------------------- Concept 2
  {
    id: "concept2", nav: "2. TTM as Road Design", audio: "07-concept2-ttm-as-road-design", theme: "dark",
    pill: "Concept 2 of 7", title: "TTM as Temporary Road Design",
    blocks: [
      { type: "quote", text: "“TTM is permanent road design delivered temporarily.”", cite: "— Waka Kotahi NZ Transport Agency, NZGTTM Part 3" },
      { type: "subhead", text: "Because of this, TTM borrows its engineering concepts directly from three established road-design disciplines:", light: true },
      { type: "tripleCol", cards: [
        { icon: "ruler", heading: "Geometric design", body: "Lane widths, tapers, alignment, sight distance." },
        { icon: "traffic-light", heading: "Traffic engineering", body: "Capacity, flow, speed environment, conflict points." },
        { icon: "shield", heading: "Safety engineering", body: "Positive protection, crash attenuation, vulnerable road user protection." },
      ]},
    ],
  },

  // 8 ------------------------------------------------- Concept 3
  {
    id: "concept3", nav: "3. Geometric Design", audio: "08-concept3-geometric-design", theme: "light",
    pill: "Concept 3 of 7", title: "Geometric Design Principles",
    subtitle: "TTM layouts must maintain the same geometric discipline as permanent roads, so drivers experience a consistent, predictable environment through the worksite:",
    blocks: [
      { type: "checklist", items: [
        "Safe and consistent geometry through the worksite",
        "Predictable alignment — no surprise changes in direction",
        "Adequate sight distances to see hazards in time to react",
        "Safe taper lengths and lane shifts, matched to operating speed",
        "Appropriate lane widths for the actual vehicle mix, including heavy vehicles",
      ]},
      { type: "taperDiagram", caption: "Geometry adapted from permanent design standards — a taper that's too short fails for the same physics-based reasons here as it would on a permanent road." },
    ],
  },

  // 9 ------------------------------------------------- Concept 4
  {
    id: "concept4", nav: "4. Traffic Engineering", audio: "09-concept4-traffic-engineering", theme: "light",
    pill: "Concept 4 of 7", title: "Traffic Engineering Principles",
    subtitle: "A geometrically sound layout still has to work under real traffic conditions — not just light, best-case traffic.",
    blocks: [
      { type: "cardGrid", columns: 3, small: true, cards: [
        { icon: "traffic-light", heading: "Operating speeds & speed management" },
        { icon: "clipboard-check", heading: "Traffic volumes & peak flows" },
        { icon: "hard-hat", heading: "Queue lengths & delay modelling" },
        { icon: "walking", heading: "Pedestrian & cyclist movements" },
        { icon: "road", heading: "Intersection control & temporary signalisation" },
        { icon: "truck-moving", heading: "Safe interaction with work vehicles" },
      ]},
    ],
  },

  // 10-11 ------------------------------------------------- Quick Check 2
  { id: "qc2-q", nav: "Quick Check 2", audio: "10-quickcheck2-question", theme: "dark", kind: "question", quizIndex: 1 },
  { id: "qc2-a", nav: "Answer 2", audio: "11-quickcheck2-answer", theme: "light", kind: "answer", quizIndex: 1 },

  // 12 ------------------------------------------------- Concept 5
  {
    id: "concept5", nav: "5. Safety Engineering", audio: "12-concept5-safety-engineering", theme: "light",
    pill: "Concept 5 of 7", title: "Safety Engineering & Positive Protection",
    subtitle: "NZGTTM aligns with Road to Zero and HSWA 2015, requiring engineering controls that actively minimise harm — not just warn about it.",
    blocks: [
      { type: "iconList", bold: true, icon: "shield", items: [
        ["shield", "Truck-Mounted Attenuators (TMAs) & crash attenuators"],
        ["shield", "Barriers and channelisation devices"],
        ["shield", "Worker separation from live traffic"],
        ["shield", "Vehicle intrusion mitigation measures"],
        ["shield", "Vulnerable road user protection"],
      ]},
      { type: "hierarchy", heading: "Hierarchy of controls", tiers: [
        { label: "Engineering controls", sub: "Barriers, TMAs, channelisation", color: "green" },
        { label: "Administrative controls", sub: "Signage, training, procedures", color: "blue" },
        { label: "PPE", sub: "High-visibility clothing — least effective on its own", color: "grey" },
      ], footnote: "Most effective, engineered controls sit above administrative measures and PPE — NZGTTM notes hi-vis clothing is the least effective control on its own." },
    ],
  },

  // 13 ------------------------------------------------- Concept 6
  {
    id: "concept6", nav: "6. Equipment Engineering", audio: "13-concept6-equipment-engineering", theme: "light",
    pill: "Concept 6 of 7", title: "Equipment Engineering",
    subtitle: "A well-designed layout only protects people if the equipment implementing it actually performs as intended.",
    blocks: [
      { type: "cardGrid", columns: 2, cards: [
        { icon: "cone", heading: "Delineation & channelising", body: "Cones, tubular delineators, barrels, cone bars, traffic separators." },
        { icon: "truck-moving", heading: "Barriers & TMAs", body: "Temporary road safety barriers and truck-/trailer-mounted attenuators, crash-tested to the AASHTO MASH protocol." },
        { icon: "lightbulb", heading: "Warning & control devices", body: "Beacons, arrow boards, light arrow systems, advanced warning VMS, hazard covers, sign supports." },
        { icon: "lock", heading: "Access control", body: "Fences and other access-prevention devices, plus temporary traffic control systems." },
      ]},
      { type: "footnote", text: "All equipment must comply with the Waka Kotahi M23 specification and guidelines for road safety hardware and devices; equipment outside M23 must be submitted for review and acceptance." },
    ],
  },

  // 14-15 ------------------------------------------------- Quick Check 3
  { id: "qc3-q", nav: "Quick Check 3", audio: "14-quickcheck3-question", theme: "dark", kind: "question", quizIndex: 2 },
  { id: "qc3-a", nav: "Answer 3", audio: "15-quickcheck3-answer", theme: "light", kind: "answer", quizIndex: 2 },

  // 16 ------------------------------------------------- Concept 7
  {
    id: "concept7", nav: "7. Specialist Projects", audio: "16-concept7-specialist-projects", theme: "light",
    pill: "Concept 7 of 7", title: "Specialist Projects & Complex Sites",
    subtitle: "Some sites and some equipment fall outside what the standard toolbox anticipates — three distinct situations, three distinct answers:",
    blocks: [
      { type: "specialistCols", cards: [
        { icon: "cone", color: "blue", heading: "Specialist equipment", body: "Hostile vehicle mitigation, race end gantries, banners/bunting, portable lighting — use must be backed by a detailed risk assessment.", tag: "NZGTTM Part 3" },
        { icon: "project-diagram", color: "navy", heading: "Complex geometric sites", body: "Major capital works with temporary road alignments, high-speed interchanges and roundabouts — addressed by pointing straight to permanent design guides (Austroads).", tag: "Part 3 → Austroads" },
        { icon: "train", color: "green", heading: "Rail level crossings", body: "Sit outside NZGTTM itself. A road-only layout can compromise sighting of an approaching train or cause vehicles to queue across the crossing.", tag: "KiwiRail guidance" },
      ]},
    ],
  },

  // 17-18 ------------------------------------------------- Quick Check 4
  { id: "qc4-q", nav: "Quick Check 4", audio: "17-quickcheck4-question", theme: "dark", kind: "question", quizIndex: 3 },
  { id: "qc4-a", nav: "Answer 4", audio: "18-quickcheck4-answer", theme: "light", kind: "answer", quizIndex: 3 },

  // 19 ------------------------------------------------- Sources
  {
    id: "sources", nav: "Sources", audio: "19-sources", theme: "light",
    kicker: "Tying it together", title: "Where These Concepts Come From",
    blocks: [
      { type: "sourceGrid", cards: [
        { icon: "book", color: "green", heading: "NZGTTM (2023)", body: "The primary source. Part 1 (why), Part 2 (the risk-based system), Part 3 (the toolbox — geometrics, equipment, specialist projects), Part 4 (glossary)." },
        { icon: "road", color: "blue", heading: "Permanent road-design standards", body: "Austroads Guide to Road Design and related guidance, referenced directly rather than duplicated, for geometric design and traffic engineering." },
        { icon: "gavel", color: "blue", heading: "Health and Safety at Work Act 2015", body: "Eliminate or minimise risk, apply the hierarchy of controls, and demonstrate due diligence in engineering decisions." },
        { icon: "bullseye", color: "blue", heading: "Road to Zero strategy", body: "New Zealand's national road-safety strategy: system-level harm reduction, safe speeds, safe road design." },
        { icon: "hard-hat", color: "blue", heading: "WorkSafe's Good Practice Guide", body: "“Keeping healthy and safe while working on the road or roadside” (2022) — worker safety engineering, separation distances, safe plant operation." },
      ]},
    ],
  },

  // 20-21 ------------------------------------------------- Quick Check 5
  { id: "qc5-q", nav: "Quick Check 5", audio: "20-quickcheck5-question", theme: "dark", kind: "question", quizIndex: 4 },
  { id: "qc5-a", nav: "Answer 5", audio: "21-quickcheck5-answer", theme: "light", kind: "answer", quizIndex: 4 },

  // 22 ------------------------------------------------- Summary
  {
    id: "summary", nav: "Summary", audio: "22-summary", theme: "dark",
    kicker: "Bringing it together", title: "Summary",
    subtitle: "The engineering concepts of TTM in New Zealand combine permanent road-design engineering, a risk-based approach to safety, HSWA compliance, and alignment with Road to Zero. They come from five places:",
    blocks: [
      { type: "summaryCards", items: [
        "NZGTTM (primary source)",
        "Permanent road-design standards",
        "Health and Safety at Work Act 2015",
        "Road to Zero strategy",
        "WorkSafe guidance",
      ]},
      { type: "keyCallout", heading: "Carry this forward",
        text: "Every TTM layout you plan, review, or sign off should be able to answer: what hazard, behaviour, exposure, or condition justifies this decision — and which of these five sources backs it up?" },
    ],
  },

  // 23 -------------------------------------------- Final Test intro
  {
    id: "finaltest-intro", nav: "Final Test", theme: "dark",
    kicker: "Before you finish", title: "Final Knowledge Check",
    subtitle: "10 questions drawn from across the whole course. You need 8 out of 10 (80%) correct to complete the course — and you can retake the test as many times as you need.",
    blocks: [
      { type: "checklist", items: [
        "10 questions covering all seven engineering concepts and the five sources",
        "Answer every question — you'll see your result at the end",
        "80% (8 out of 10) is the pass mark required to complete the course",
        "No limit on attempts — retake the test as many times as you need",
      ]},
    ],
  },

  // 24-33 -------------------------------------------- Final Test questions
  { id: "finaltest-q1", nav: "Test — Q1", theme: "dark", kind: "finaltest-question", testIndex: 0 },
  { id: "finaltest-q2", nav: "Test — Q2", theme: "dark", kind: "finaltest-question", testIndex: 1 },
  { id: "finaltest-q3", nav: "Test — Q3", theme: "dark", kind: "finaltest-question", testIndex: 2 },
  { id: "finaltest-q4", nav: "Test — Q4", theme: "dark", kind: "finaltest-question", testIndex: 3 },
  { id: "finaltest-q5", nav: "Test — Q5", theme: "dark", kind: "finaltest-question", testIndex: 4 },
  { id: "finaltest-q6", nav: "Test — Q6", theme: "dark", kind: "finaltest-question", testIndex: 5 },
  { id: "finaltest-q7", nav: "Test — Q7", theme: "dark", kind: "finaltest-question", testIndex: 6 },
  { id: "finaltest-q8", nav: "Test — Q8", theme: "dark", kind: "finaltest-question", testIndex: 7 },
  { id: "finaltest-q9", nav: "Test — Q9", theme: "dark", kind: "finaltest-question", testIndex: 8 },
  { id: "finaltest-q10", nav: "Test — Q10", theme: "dark", kind: "finaltest-question", testIndex: 9 },

  // 34 -------------------------------------------- Final Test result
  { id: "finaltest-result", nav: "Test Result", theme: "light", kind: "finaltest-result" },

  // 35 ------------------------------------------------- Closing
  {
    id: "closing", nav: "Thank You", audio: "23-closing", theme: "dark", kind: "closing",
    title: "Thank you",
    subtitle: "Questions and discussion welcome. A companion slide deck of this same course is also available for team briefings and live delivery.",
    courseInvite: {
      heading: "Keep learning with Sela Civil Advisory",
      text: "This is one of a growing range of TTM and civil advisory training courses from Sela Civil Advisory Limited. Ask your training coordinator, or get in touch with Sela Civil Advisory, to see what other courses are available.",
    },
  },
];

// The 5 quick-check questions, referenced by quizIndex from question/answer slides above.
var QUIZ = [
  {
    q: "What does a risk-based TTM decision need to be justified by?",
    options: [
      "Matching the nearest standard diagram in the old code of practice",
      "Site-specific hazards, road user behaviour, worker exposure, and environment/activity conditions",
      "Whichever layout is fastest to set up",
      "The contractor's usual preferred layout",
    ],
    correct: 1,
    explain: "NZGTTM's risk-based approach requires justification against site hazards, road user behaviour, worker exposure, and environment/activity conditions — not simply following a standard diagram.",
  },
  {
    q: "Waka Kotahi describes TTM as:",
    options: [
      "A temporary inconvenience with no formal design basis",
      "A subset of construction site safety only",
      "Permanent road design delivered temporarily",
      "An administrative permitting process",
    ],
    correct: 2,
    explain: "TTM is explicitly described as permanent road design delivered temporarily — which is why it borrows its engineering concepts from established road-design disciplines.",
  },
  {
    q: "Positive protection measures such as TMAs and barriers are an example of:",
    options: [
      "Administrative controls",
      "Higher-order engineering controls that minimise harm",
      "Optional extras with no link to legislation",
      "Traffic engineering rather than safety engineering",
    ],
    correct: 1,
    explain: "Safety engineering — including TMAs, barriers, channelisation, and vulnerable road user protection — represents higher-order controls, aligning with HSWA's preference for controls above administrative measures and PPE.",
  },
  {
    q: "Why might a rail level crossing near a TTM site require extra engineering attention?",
    options: [
      "Level crossings never require any additional consideration",
      "A standard road-only layout could compromise sighting of an approaching train or cause vehicles to queue across the crossing",
      "KiwiRail does not have any TTM-related guidance",
      "NZGTTM's Part 3 toolbox already covers level crossing design in full detail",
    ],
    correct: 1,
    explain: "Level crossings sit outside NZGTTM's own toolbox — KiwiRail's supplementary safety guidance, used alongside NZGTTM, warns that TTM must not compromise sighting of an approaching train or cause vehicles to queue across the crossing.",
  },
  {
    q: "How does NZGTTM describe its own legal status?",
    options: [
      "It is a mandatory code of practice with no exceptions",
      "It is a best-practice guide (not a mandatory code of practice), but its “must” statements are legal requirements",
      "It has no connection to any legislation",
      "It only applies to rail level crossings",
    ],
    correct: 1,
    explain: "NZGTTM states it is a best-practice guide rather than a mandatory code of practice, intended for use by PCBUs. Within it, “must” denotes a legal requirement, while “should”/“could” denote recommended practice.",
  },
];

// The 10-question final test, referenced by testIndex from finaltest-question slides.
// 80% (8/10) is the pass mark, checked against imsmanifest.xml's <adlcp:masteryscore>80</adlcp:masteryscore>.
var FINAL_TEST = [
  {
    q: "What replaced the old, prescriptive Code of Practice for Temporary Traffic Management (COPTTM)?",
    options: [
      "A new, even more prescriptive code with stricter standard diagrams",
      "NZGTTM's risk-based system",
      "No replacement — COPTTM is still the current standard",
      "An international ISO road-design standard",
    ],
    correct: 1,
    explain: "NZGTTM (2023) moved the industry from the prescriptive COPTTM (4th edition) to a risk-based system.",
  },
  {
    q: "Which four factors must justify a risk-based TTM decision?",
    options: [
      "Cost, programme, contractor preference, and weather only",
      "Traffic volume alone",
      "Site-specific hazards, road user behaviour, worker exposure, and environment/activity conditions",
      "The nearest matching diagram in the old code of practice",
    ],
    correct: 2,
    explain: "Risk-Based Design requires every decision to be justified against site-specific hazards, road user behaviour, worker exposure, and environment/activity conditions.",
  },
  {
    q: "How does Waka Kotahi describe TTM in NZGTTM Part 3?",
    options: [
      "An administrative permitting exercise",
      "A subset of construction site safety only",
      "A temporary inconvenience with no formal engineering basis",
      "Permanent road design delivered temporarily",
    ],
    correct: 3,
    explain: "NZGTTM Part 3 describes TTM as permanent road design delivered temporarily — the reason it borrows concepts from established road-design disciplines.",
  },
  {
    q: "Which of the following is a geometric design principle applied to TTM layouts?",
    options: [
      "Safe taper lengths and lane shifts, matched to operating speed",
      "Ignoring sight distance where the site is short-term",
      "Allowing sudden, unsignalled changes in alignment",
      "Using whatever lane width is convenient, regardless of vehicle mix",
    ],
    correct: 0,
    explain: "Geometric Design Principles call for consistent alignment, adequate sight distance, and safe taper lengths and lane widths matched to operating speed and the actual vehicle mix.",
  },
  {
    q: "Traffic Engineering Principles for TTM specifically require consideration of:",
    options: [
      "Assuming only light, best-case traffic will occur",
      "Fixed signal timing regardless of demand",
      "Queue lengths and delay modelling under real traffic conditions",
      "Ignoring pedestrian and cyclist movements",
    ],
    correct: 2,
    explain: "Traffic engineering has to account for operating speeds, volumes, queue lengths and delay modelling, and pedestrian/cyclist movements under real conditions — not just light, best-case traffic.",
  },
  {
    q: "In the hierarchy of controls, where do engineering controls such as barriers and TMAs sit relative to PPE?",
    options: [
      "Below PPE in effectiveness",
      "Above administrative controls and PPE",
      "Equal to hi-vis clothing",
      "Outside the hierarchy entirely",
    ],
    correct: 1,
    explain: "Engineering controls (barriers, TMAs, channelisation) sit above administrative controls and PPE — NZGTTM notes hi-vis clothing is the least effective control on its own.",
  },
  {
    q: "What must all TTM equipment comply with — or be submitted for review and acceptance if it doesn't?",
    options: [
      "Any relevant council bylaw",
      "The Waka Kotahi M23 specification for road safety hardware and devices",
      "Manufacturer's marketing claims only",
      "No standard applies to temporary equipment",
    ],
    correct: 1,
    explain: "All equipment must comply with the Waka Kotahi M23 specification and guidelines; equipment outside M23 must be submitted for review and acceptance.",
  },
  {
    q: "Complex geometric sites — such as major capital works with high-speed interchanges — are addressed by:",
    options: [
      "Ignoring geometric design principles altogether",
      "Using only the standard NZGTTM toolbox diagrams",
      "Referring solely to KiwiRail guidance",
      "Pointing directly to permanent design guides, such as Austroads",
    ],
    correct: 3,
    explain: "Complex geometric sites fall outside the standard toolbox and are addressed by referring directly to permanent design guides such as the Austroads Guide to Road Design.",
  },
  {
    q: "Which piece of legislation requires eliminating or minimising risk and applying the hierarchy of controls in engineering decisions?",
    options: [
      "Local Government Act 2002",
      "Land Transport Management Act 2003",
      "Health and Safety at Work Act 2015",
      "Road to Zero strategy",
    ],
    correct: 2,
    explain: "The Health and Safety at Work Act 2015 requires eliminating or minimising risk, applying the hierarchy of controls, and demonstrating due diligence in engineering decisions.",
  },
  {
    q: "What is the central shift that NZGTTM represents for the TTM industry?",
    options: [
      "From a risk-based system back to a prescriptive one",
      "From prescriptive, template-based layouts to a risk-based engineering approach",
      "No meaningful change from COPTTM",
      "Removing the need for any engineering justification",
    ],
    correct: 1,
    explain: "NZGTTM's central shift is from prescriptive, one-size-fits-all layouts to a risk-based approach where every decision is engineered and justified for the specific site.",
  },
];
