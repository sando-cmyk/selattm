/*!
 * Course content data
 * Roles & Responsibilities in the NZGTTM Ecosystem
 * Sela Civil Advisory Ltd
 *
 * Content adapted from: New Zealand Guide to Temporary Traffic Management
 * (NZGTTM), Waka Kotahi NZ Transport Agency, published April 2023
 * (ISBN 978-1-99-004430-4). Used here for training purposes to support the
 * TTM industry's understanding of roles and responsibilities under the
 * risk-based framework.
 *
 * Each of the nine topics below is now taught as a video ("type: video")
 * followed immediately by a short recap-and-reflect slide ("type: content")
 * that condenses the key points and asks the learner to connect the topic
 * to their own role in the TTM ecosystem.
 */

// Small inline SVG icons shown at the top of each slide, in the brand
// palette. Kept as plain strings so they can be dropped straight into
// innerHTML alongside the rest of the slide markup.
var ICONS = {
  welcome:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle class=\"icon-pulse-ring\" cx=\"24\" cy=\"13\" r=\"9\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"2\"/>" +
    "<line x1=\"21\" y1=\"18\" x2=\"13\" y2=\"31\" stroke=\"#10233b\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>" +
    "<line x1=\"27\" y1=\"18\" x2=\"35\" y2=\"31\" stroke=\"#10233b\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>" +
    "<line x1=\"24\" y1=\"19\" x2=\"24\" y2=\"31\" stroke=\"#10233b\" stroke-width=\"2.5\" stroke-linecap=\"round\"/>" +
    "<circle cx=\"24\" cy=\"13\" r=\"7\" fill=\"#10233b\"/>" +
    "<circle cx=\"12\" cy=\"35\" r=\"6\" fill=\"#e2661b\"/>" +
    "<circle cx=\"24\" cy=\"35\" r=\"6\" fill=\"#e2661b\"/>" +
    "<circle cx=\"36\" cy=\"35\" r=\"6\" fill=\"#e2661b\"/>" +
    "</svg>",

  objectives:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"21\" cy=\"27\" r=\"15\" fill=\"none\" stroke=\"#10233b\" stroke-width=\"3\"/>" +
    "<circle cx=\"21\" cy=\"27\" r=\"9\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"3\"/>" +
    "<circle cx=\"21\" cy=\"27\" r=\"3\" fill=\"#e2661b\"/>" +
    "<path d=\"M27 21L36 6\" stroke=\"#10233b\" stroke-width=\"3\" stroke-linecap=\"round\"/>" +
    "<path d=\"M29 4.5L38 3L36.5 12Z\" fill=\"#10233b\"/>" +
    "</svg>",

  whyRolesMatter:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M24 4L40 10V21C40 31.5 33.2 39.6 24 43C14.8 39.6 8 31.5 8 21V10L24 4Z\" fill=\"#10233b\"/>" +
    "<circle cx=\"24\" cy=\"19\" r=\"5\" fill=\"#ffffff\"/>" +
    "<path d=\"M14 32C14 25 18.5 22 24 22C29.5 22 34 25 34 32Z\" fill=\"#ffffff\"/>" +
    "</svg>",

  contractingChain:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<rect x=\"5\" y=\"14\" width=\"20\" height=\"20\" rx=\"10\" fill=\"none\" stroke=\"#10233b\" stroke-width=\"4.5\"/>" +
    "<rect x=\"23\" y=\"14\" width=\"20\" height=\"20\" rx=\"10\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"4.5\"/>" +
    "</svg>",

  tao:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle class=\"icon-pulse-ring\" cx=\"24\" cy=\"22\" r=\"15\" fill=\"none\" stroke=\"#1f8a4c\" stroke-width=\"2\"/>" +
    "<circle cx=\"24\" cy=\"22\" r=\"13\" fill=\"#10233b\"/>" +
    "<path class=\"icon-check\" d=\"M17 22.5L21.5 27L31.5 15.5\" stroke=\"#ffffff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" +
    "<path d=\"M16 34L24 30L32 34L29 44H19Z\" fill=\"#e2661b\"/>" +
    "</svg>",

  responsibilitiesModel:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"18\" cy=\"18\" r=\"12\" fill=\"#10233b\" opacity=\"0.82\"/>" +
    "<circle cx=\"30\" cy=\"18\" r=\"12\" fill=\"#e2661b\" opacity=\"0.82\"/>" +
    "<circle cx=\"24\" cy=\"29\" r=\"12\" fill=\"#1f8a4c\" opacity=\"0.82\"/>" +
    "</svg>",

  stmsRole:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<rect x=\"10\" y=\"6\" width=\"28\" height=\"38\" rx=\"3\" fill=\"#10233b\"/>" +
    "<rect x=\"16\" y=\"2\" width=\"16\" height=\"8\" rx=\"2\" fill=\"#e2661b\"/>" +
    "<path d=\"M24 16C19 16 16 19.6 16 23.8C16 29 24 37 24 37C24 37 32 29 32 23.8C32 19.6 29 16 24 16Z\" fill=\"#ffffff\"/>" +
    "<circle cx=\"24\" cy=\"23.5\" r=\"3.4\" fill=\"#10233b\"/>" +
    "</svg>",

  widerWorkforce:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"12\" cy=\"16\" r=\"5\" fill=\"#10233b\"/>" +
    "<path d=\"M4 38C4 30 7.5 26 12 26C16.5 26 20 30 20 38Z\" fill=\"#10233b\"/>" +
    "<circle cx=\"24\" cy=\"12\" r=\"6\" fill=\"#e2661b\"/>" +
    "<path d=\"M14.5 40C14.5 30 18.7 25 24 25C29.3 25 33.5 30 33.5 40Z\" fill=\"#e2661b\"/>" +
    "<circle cx=\"36\" cy=\"16\" r=\"5\" fill=\"#10233b\"/>" +
    "<path d=\"M28 38C28 30 31.5 26 36 26C40.5 26 44 30 44 38Z\" fill=\"#10233b\"/>" +
    "</svg>",

  framework:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<g class=\"icon-spin\">" +
    "<path d=\"M24 4L27.5 4.5L28.5 9.5L33 11.3L37 8.4L40.6 12L37.7 16L39.5 20.5L44.5 21.5L44.5 26.5L39.5 27.5L37.7 32L40.6 36L37 39.6L33 36.7L28.5 38.5L27.5 43.5L22.5 43.5L21.5 38.5L17 36.7L13 39.6L9.4 36L12.3 32L10.5 27.5L5.5 26.5L5.5 21.5L10.5 20.5L12.3 16L9.4 12L13 8.4L17 11.3L21.5 9.5L22.5 4.5Z\" fill=\"#10233b\"/>" +
    "<circle cx=\"25\" cy=\"24\" r=\"7.5\" fill=\"#eef1f4\"/>" +
    "</g>" +
    "</svg>",

  quizIntro:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<rect x=\"10\" y=\"6\" width=\"28\" height=\"38\" rx=\"3\" fill=\"#10233b\"/>" +
    "<rect x=\"16\" y=\"2\" width=\"16\" height=\"8\" rx=\"2\" fill=\"#e2661b\"/>" +
    "<path class=\"icon-check\" d=\"M16 25L21.5 30.5L33 18\" stroke=\"#ffffff\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" +
    "</svg>",

  summary:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M16 8H32V20C32 26 28.5 30 24 30C19.5 30 16 26 16 20V8Z\" fill=\"#e2661b\"/>" +
    "<path d=\"M16 10H10V14C10 18 13 21 16 21.5\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"2.5\"/>" +
    "<path d=\"M32 10H38V14C38 18 35 21 32 21.5\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"2.5\"/>" +
    "<rect x=\"21\" y=\"30\" width=\"6\" height=\"6\" fill=\"#10233b\"/>" +
    "<path d=\"M15 40H33L30 36H18Z\" fill=\"#10233b\"/>" +
    "<circle class=\"icon-sparkle\" cx=\"7\" cy=\"14\" r=\"1.7\" fill=\"#f2994a\"/>" +
    "<circle class=\"icon-sparkle\" cx=\"41\" cy=\"18\" r=\"1.7\" fill=\"#f2994a\"/>" +
    "<circle class=\"icon-sparkle\" cx=\"24\" cy=\"3\" r=\"1.7\" fill=\"#f2994a\"/>" +
    "</svg>"
};

// Helper to build a "watch the video" screen and its follow-up recap/reflect
// screen for one topic, keeping the pairing obvious and easy to re-order.
function videoScreen(id, videoFile, title, eyebrow) {
  return {
    id: id,
    type: "video",
    title: title,
    eyebrow: eyebrow,
    videoSrc: "assets/video/" + videoFile
  };
}

var COURSE = {
  meta: {
    title: "TTM Roles & Responsibilities",
    subtitle: "How the NZGTTM Frames Roles Across the Temporary Traffic Management Ecosystem",
    duration: "20 minutes",
    provider: "Sela Civil Advisory Ltd",
    passmark: 80
  },

  summaryIcon: ICONS.summary,

  summaryText: "You've covered the contracting chain of PCBUs, the peer review and veto role of Transport Access Organisations, how responsibility overlaps across the TTM responsibilities model, the handoff from TTM planner to STMS, and the wider workforce and capability functions the NZGTTM relies on.",

  screens: [

    // 0 - video ------------------------------------------------------
    videoScreen("welcome-video", "welcome.mp4", "Welcome", "Sela Civil Advisory presents"),

    // 1 - recap & reflect ---------------------------------------------
    {
      id: "welcome",
      type: "content",
      minSeconds: 10,
      icon: ICONS.welcome,
      title: "Welcome",
      eyebrow: "Recap & reflect",
      body: [
        "<p>This course maps out who does what in temporary traffic management (TTM) under the <strong>New Zealand Guide to Temporary Traffic Management (NZGTTM)</strong> — from the PCBUs who commission and deliver the work, through to the Transport Access Organisations that peer review it, and the Site Traffic Management Supervisor who runs the site day to day.</p>",
        "<div class=\"callout\"><strong>Key principle:</strong> “if you create the risk, you manage the risk” — everyone in the contracting chain shares responsibility for safety.</div>",
        "<div class=\"vision-banner\">“All workers and road users go home safe every day.”</div>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Before you go further, think about where you sit in this ecosystem today. Which of these roles — PCBU, TAO, STMS, or wider workforce — do you interact with most in your day-to-day work?</p></div>"
      ]
    },

    // 2 - video ------------------------------------------------------
    videoScreen("objectives-video", "objectives.mp4", "What you'll be able to do", "Learning objectives"),

    // 3 - recap & reflect ---------------------------------------------
    {
      id: "objectives",
      type: "content",
      minSeconds: 10,
      icon: ICONS.objectives,
      title: "What you'll be able to do",
      eyebrow: "Recap & reflect",
      body: [
        "<p>By the end of this module, you will be able to:</p>",
        "<ul class=\"obj-list\">" +
          "<li>Identify the PCBUs in a typical TTM contracting chain and describe each one's core responsibility</li>" +
          "<li>Explain the role of <strong>Transport Access Organisations (TAOs)</strong> — including Road Controlling Authorities — and their peer review and veto powers</li>" +
          "<li>Explain how responsibility for TTM safety is <strong>shared, not identical</strong>, across the contracting chain</li>" +
          "<li>Describe the handoff between planning and on-site delivery, and the three primary functions of the <strong>Site Traffic Management Supervisor (STMS)</strong></li>" +
          "<li>Recognise the wider TTM workforce and the capability functions the sector needs to deliver TTM safely</li>" +
        "</ul>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Which of these five objectives are you most confident about already, and which one do you most want to focus on as you work through this course?</p></div>"
      ]
    },

    // 4 - video ------------------------------------------------------
    videoScreen("why-roles-matter-video", "why-roles-matter.mp4", "Why roles and responsibilities matter", "Setting the scene"),

    // 5 - recap & reflect ---------------------------------------------
    {
      id: "why-roles-matter",
      type: "content",
      minSeconds: 15,
      icon: ICONS.whyRolesMatter,
      title: "Why roles and responsibilities matter",
      eyebrow: "Recap & reflect",
      body: [
        "<p>Under the <strong>Health and Safety at Work Act 2015 (HSWA)</strong>, any person conducting a business or undertaking (PCBU) has a duty of care to do everything reasonably practicable to keep workers and road users safe.</p>",
        "<div class=\"callout\"><strong>Key principle:</strong> if you create the risk, you manage the risk — and everyone in the contracting chain is responsible for safety and health. You can consult, cooperate and coordinate with other PCBUs, but you can never contract out of your own health and safety duties.</div>",
        "<p>PCBUs in a contracting chain don't all carry the same duties — but the more influence and control an organisation has over a health and safety matter, the more responsibility it's likely to carry.</p>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Think of a recent site you've worked on. Did every organisation involved act like it owned the risks it created — or did some assume someone else had it covered?</p></div>"
      ]
    },

    // 6 - video ------------------------------------------------------
    videoScreen("contracting-chain-video", "contracting-chain.mp4", "The contracting chain: three PCBUs", "The commissioning side"),

    // 7 - recap & reflect ---------------------------------------------
    {
      id: "contracting-chain",
      type: "content",
      minSeconds: 15,
      icon: ICONS.contractingChain,
      title: "The contracting chain: three PCBUs",
      eyebrow: "Recap & reflect",
      body: [
        "<p>Most road and roadside work is delivered through a contracting chain: a <strong>contracting PCBU</strong> (the client) hires a <strong>contractor PCBU</strong> to do the work, who may in turn hire a <strong>subcontractor PCBU</strong>.</p>",
        "<div class=\"trio\">" +
          "<div class=\"trio-card\"><h4>Contracting PCBU</h4><p>The client. Must ensure the project can be delivered, maintained and operated safely, and use procurement practices that promote safety</p></div>" +
          "<div class=\"trio-card\"><h4>Contractor PCBU</h4><p>Prepares the site risk assessment and Traffic Management Plan (TMP), consults with other PCBUs, and approves the TMP</p></div>" +
          "<div class=\"trio-card\"><h4>Subcontractor PCBU</h4><p>Contributes to the TMP design so their own workers' needs and risks are covered</p></div>" +
        "</div>",
        "<p class=\"meta-line\">For road construction and maintenance work, the RCA and the contracting PCBU are usually the same organisation. For non-road activities, there are often three separate organisations sharing responsibility.</p>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>In the contracting chains you usually work in, which PCBU role do you play — client, contractor, or subcontractor — and where have you seen handoffs between them go wrong?</p></div>"
      ]
    },

    // 8 - video ------------------------------------------------------
    videoScreen("tao-video", "tao.mp4", "Transport Access Organisations (TAOs)", "The independent check"),

    // 9 - recap & reflect ---------------------------------------------
    {
      id: "tao",
      type: "content",
      minSeconds: 15,
      icon: ICONS.tao,
      title: "Transport Access Organisations (TAOs)",
      eyebrow: "Recap & reflect",
      body: [
        "<p>A <strong>Transport Access Organisation (TAO)</strong> is the umbrella term for the authorities that peer review and authorise TTM activity on their network — including the RCA, Rail Access Authority (RAA) and Public Transport Authority (PTA).</p>",
        "<ul class=\"obj-list\">" +
          "<li>Peer reviews risk assessments to make sure the needs of the parties they represent are recognised and addressed</li>" +
          "<li>Coordinates competing requests from multiple contracting PCBUs wanting to occupy the same network</li>" +
          "<li>Discharges regulatory duties, such as authorising traffic control devices, temporary speed limits and road closures</li>" +
          "<li>Holds <strong>veto rights</strong> — it can stop a TMP being implemented if it considers the plan too risky for road users</li>" +
        "</ul>",
        "<div class=\"callout\">A TAO is responsible for the safety of road users, while the contractor PCBU is responsible for the safety of workers and the public onsite. Both duties operate at the same time.</div>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Have you dealt with a TAO exercising its veto rights, or coordinating competing requests for the same corridor? What would you do differently now that you know its duty to road users runs alongside — not instead of — the contractor's duty onsite?</p></div>"
      ]
    },

    // 10 - video -------------------------------------------------------
    videoScreen("responsibilities-model-video", "responsibilities-model.mp4", "The TTM responsibilities model", "How the duties overlap"),

    // 11 - recap & reflect ----------------------------------------------
    {
      id: "responsibilities-model",
      type: "content",
      minSeconds: 15,
      icon: ICONS.responsibilitiesModel,
      title: "The TTM responsibilities model",
      eyebrow: "Recap & reflect",
      body: [
        "<p>All organisations across a TTM site must consult, coordinate and cooperate — but each one's core responsibility is different:</p>",
        "<table class=\"compare-table\"><thead><tr><th>Organisation</th><th>Core responsibility</th></tr></thead><tbody>" +
        "<tr><td>Contracting PCBU (client)</td><td>Safety in design; ensures the project can be delivered, maintained and operated safely</td></tr>" +
        "<tr><td>Contractor PCBU</td><td>Prepares and approves the site risk assessment and TMP</td></tr>" +
        "<tr><td>Subcontractor PCBU</td><td>Feeds site-specific needs and risks into the TMP</td></tr>" +
        "<tr><td>Transport Access Organisation (TAO)</td><td>Peer reviews, coordinates network access, and can veto an unsafe plan</td></tr>" +
        "</tbody></table>",
        "<p>Because these duties overlap rather than stack in a strict hierarchy, no single organisation can simply hand off safety to another.</p>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Find your own role in the table (or the closest match). Whose responsibility overlaps with yours, and how do you currently consult, cooperate and coordinate with them?</p></div>"
      ]
    },

    // 12 - video -------------------------------------------------------
    videoScreen("stms-role-video", "stms-role.mp4", "The Site Traffic Management Supervisor (STMS)", "From plan to site"),

    // 13 - recap & reflect ----------------------------------------------
    {
      id: "stms-role",
      type: "content",
      minSeconds: 15,
      icon: ICONS.stmsRole,
      title: "The Site Traffic Management Supervisor (STMS)",
      eyebrow: "Recap & reflect",
      body: [
        "<p>Once a TMP is approved, responsibility moves from the TTM planner who designed it to the <strong>Site Traffic Management Supervisor (STMS)</strong> who delivers it on the ground. The STMS has three primary functions:</p>",
        "<ol class=\"workflow-list\">" +
          "<li><strong>Establish</strong> the site — set it up consistent with the approved TMP, including driving, walking and cycling checks</li>" +
          "<li><strong>Monitor</strong> the site — check controls are working as expected throughout the shift, and brief everyone onsite on the risks and residual risks</li>" +
          "<li><strong>Uplift</strong> the site — remove or adjust TTM once the work is finished or conditions change</li>" +
        "</ol>",
        "<div class=\"callout\">The STMS's primary duty of care is the safety of workers and the public. If a new risk appears, the STMS must speak to the TTM planner about updating the TMP, or use their own NZGTTM knowledge to make the safest possible decision and document it.</div>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>If you are, or work closely with, an STMS: which of Establish, Monitor or Uplift do you find hardest to get right — and what would help?</p></div>"
      ]
    },

    // 14 - video -------------------------------------------------------
    videoScreen("wider-workforce-video", "wider-workforce.mp4", "The wider TTM workforce", "Beyond the STMS"),

    // 15 - recap & reflect ----------------------------------------------
    {
      id: "wider-workforce",
      type: "content",
      minSeconds: 15,
      icon: ICONS.widerWorkforce,
      title: "The wider TTM workforce",
      eyebrow: "Recap & reflect",
      body: [
        "<p>The STMS leads the team onsite, but NZGTTM recognises a much broader set of roles feeding the system — including the <strong>Temporary Traffic Management Planner (TTMP)</strong>, corridor managers, project and contract managers, and TTM operatives.</p>",
        "<p>To deliver TTM safely, the sector needs capability across six functions:</p>",
        "<div class=\"framework-grid\">" +
          "<div class=\"fw-card\"><h4>Planning</h4><p>Risk assessment and engineering / geometric design</p></div>" +
          "<div class=\"fw-card\"><h4>Network access coordination</h4><p>Managing competing requests to occupy the same corridor</p></div>" +
          "<div class=\"fw-card\"><h4>Risk peer review</h4><p>Independent checking carried out by TAOs</p></div>" +
          "<div class=\"fw-card\"><h4>Regulatory functions</h4><p>Authorising closures, speed limits and traffic control devices</p></div>" +
          "<div class=\"fw-card\"><h4>Operations</h4><p>Operational leadership (STMS) and operational team members onsite</p></div>" +
          "<div class=\"fw-card\"><h4>Quality assurance</h4><p>Checking that delivery matches the approved plan</p></div>" +
        "</div>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Which of these six capability functions does your own role sit inside? Which one do you rely most on other people to deliver?</p></div>"
      ]
    },

    // 16 - video -------------------------------------------------------
    videoScreen("framework-video", "framework.mp4", "Roles inside the TTM framework", "How it all fits"),

    // 17 - recap & reflect ----------------------------------------------
    {
      id: "framework",
      type: "content",
      minSeconds: 15,
      icon: ICONS.framework,
      title: "Roles inside the TTM framework",
      eyebrow: "Recap & reflect",
      body: [
        "<p>NZGTTM frames a successful TTM system around four elements: people, process and guides, equipment, and contracts — all in service of one vision.</p>",
        "<div class=\"framework-grid\">" +
          "<div class=\"fw-card\"><h4>People</h4><p>Leadership, training, competency assessments</p></div>" +
          "<div class=\"fw-card\"><h4>Process &amp; guides</h4><p>NZGTTM, practice notes, planning, approval, QA &amp; control</p></div>" +
          "<div class=\"fw-card\"><h4>Equipment</h4><p>Plant, static equipment, intelligent transport systems</p></div>" +
          "<div class=\"fw-card\"><h4>Contracts</h4><p>Terms, specifications — including roles and responsibilities — and payment terms</p></div>" +
        "</div>",
        "<div class=\"vision-banner\">“All workers and road users go home safe every day.”</div>",
        "<div class=\"reflect-box\"><div class=\"reflect-label\">Reflect</div><p>Of people, process &amp; guides, equipment and contracts — which element do you think your organisation most needs to strengthen to make roles and responsibilities work in practice on your sites?</p></div>"
      ]
    },

    // 18 -----------------------------------------------------------
    {
      id: "quiz-intro",
      type: "content",
      minSeconds: 10,
      icon: ICONS.quizIntro,
      title: "Knowledge check",
      eyebrow: "Almost there",
      body: [
        "<p>Let's check that the key roles and responsibilities have landed. You'll be asked 8 short questions covering the contracting chain, TAOs, the responsibilities model and the STMS.</p>",
        "<p>You need <strong>80% (7 out of 8)</strong> to pass. If needed, you can retake the check — your best attempt this session will be recorded.</p>"
      ]
    },

    // 19 quiz screen - handled specially by app.js
    {
      id: "quiz",
      type: "quiz",
      title: "Knowledge check",
      eyebrow: "Knowledge check"
    },

    // 20 summary
    {
      id: "summary",
      type: "summary",
      title: "Course complete",
      eyebrow: "Well done"
    }
  ],

  quiz: [
    {
      q: "Under the risk-based approach, what's the fundamental shift in responsibility described in the NZGTTM?",
      options: [
        "Responsibility sits solely with the subcontractor PCBU",
        "If you create the risk, you manage the risk — and everyone in the contracting chain shares responsibility for safety",
        "PCBUs can contract out of their health and safety duties",
        "Only the Transport Access Organisation is responsible for safety"
      ],
      correct: 1
    },
    {
      q: "In a typical contracting chain, which PCBU prepares the site risk assessment, prepares the TMP, and approves it?",
      options: [
        "Transport Access Organisation",
        "Subcontractor PCBU",
        "Contracting PCBU",
        "Contractor PCBU"
      ],
      correct: 3
    },
    {
      q: "For non-road construction activities such as events, how many organisations are typically responsible for safety outcomes?",
      options: [
        "Three — the contracting PCBU, contractor PCBU, and the RCA",
        "Two — the contracting PCBU and the RCA only",
        "One — the contracting PCBU only",
        "None — responsibility sits with WorkSafe"
      ],
      correct: 0
    },
    {
      q: "What does “TAO” stand for in the NZGTTM, and what powers does it hold?",
      options: [
        "Traffic Access Officer — issues fines to non-compliant contractors",
        "Temporary Access Order — a legal document, not an organisation",
        "Transport Access Organisation — peer reviews risk assessments and can veto an unsafe TMP",
        "Traffic Authority Office — only handles payment disputes"
      ],
      correct: 2
    },
    {
      q: "Which statement best describes how a TAO's responsibility and a contractor PCBU's responsibility relate to each other onsite?",
      options: [
        "The contractor PCBU can direct the TAO on how to manage its duties",
        "Only one of the two organisations carries any responsibility at a time",
        "The TAO's responsibility replaces the contractor PCBU's once a TMP is approved",
        "The TAO is responsible for road user safety while the contractor PCBU is responsible for worker and public safety onsite — both apply at the same time"
      ],
      correct: 3
    },
    {
      q: "Once a TMP is approved, who does responsibility for on-the-ground delivery move to?",
      options: [
        "WorkSafe New Zealand",
        "The Site Traffic Management Supervisor (STMS)",
        "The subcontractor PCBU's head office",
        "The Transport Access Organisation"
      ],
      correct: 1
    },
    {
      q: "Which of the following are the STMS's three primary functions, according to the NZGTTM?",
      options: [
        "Design, approve, and audit the TMP",
        "Recruit, train, and roster TTM staff",
        "Establish, monitor, and uplift the site",
        "Plan, price, and invoice the works"
      ],
      correct: 2
    },
    {
      q: "Which of these is one of the six TTM capability functions the NZGTTM says the sector needs?",
      options: [
        "Marketing and communications",
        "Vehicle fleet leasing",
        "Payroll administration",
        "Network access coordination"
      ],
      correct: 3
    }
  ]
};
