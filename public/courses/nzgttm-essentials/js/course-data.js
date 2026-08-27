/*!
 * Course content data
 * NZGTTM Essentials: The Transition to a Risk Based Approach
 * Sela Civil Advisory Ltd
 *
 * Content adapted from: New Zealand Guide to Temporary Traffic Management
 * (NZGTTM), Waka Kotahi NZ Transport Agency, published April 2023
 * (ISBN 978-1-99-004430-4), and its supplementary guidance notes
 * (Lowest Total Risk; Identify Risks; Activity and Environment).
 * Used here for training purposes to support the TTM industry's
 * transition to the new risk-based framework.
 */

// Small inline SVG icons shown at the top of each slide, in the brand
// palette. Kept as plain strings so they can be dropped straight into
// innerHTML alongside the rest of the slide markup.
var ICONS = {
  welcome:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M24 4L40 10V21C40 31.5 33.2 39.6 24 43C14.8 39.6 8 31.5 8 21V10L24 4Z\" fill=\"#10233b\"/>" +
    "<path class=\"icon-check\" d=\"M15.5 24L21 29.5L32.5 17.5\" stroke=\"#ffffff\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>" +
    "</svg>",

  objectives:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"21\" cy=\"27\" r=\"15\" fill=\"none\" stroke=\"#10233b\" stroke-width=\"3\"/>" +
    "<circle cx=\"21\" cy=\"27\" r=\"9\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"3\"/>" +
    "<circle cx=\"21\" cy=\"27\" r=\"3\" fill=\"#e2661b\"/>" +
    "<path d=\"M27 21L36 6\" stroke=\"#10233b\" stroke-width=\"3\" stroke-linecap=\"round\"/>" +
    "<path d=\"M29 4.5L38 3L36.5 12Z\" fill=\"#10233b\"/>" +
    "</svg>",

  whyTtm:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"18\" cy=\"24\" r=\"13\" fill=\"#10233b\" opacity=\"0.88\"/>" +
    "<circle cx=\"30\" cy=\"24\" r=\"13\" fill=\"#e2661b\" opacity=\"0.88\"/>" +
    "</svg>",

  transition:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle cx=\"24\" cy=\"24\" r=\"18\" fill=\"none\" stroke=\"#10233b\" stroke-width=\"3\"/>" +
    "<g class=\"icon-compass-needle\"><path d=\"M24 11L28.5 24L24 37L19.5 24Z\" fill=\"#e2661b\"/></g>" +
    "<circle cx=\"24\" cy=\"24\" r=\"2.3\" fill=\"#10233b\"/>" +
    "</svg>",

  whatIsRisk:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<circle class=\"icon-pulse-ring\" cx=\"24\" cy=\"24\" r=\"17\" fill=\"none\" stroke=\"#e2661b\" stroke-width=\"2.5\"/>" +
    "<path d=\"M24 6L44 40H4L24 6Z\" fill=\"#e2661b\"/>" +
    "<rect x=\"22\" y=\"18\" width=\"4\" height=\"11\" rx=\"2\" fill=\"#ffffff\"/>" +
    "<circle cx=\"24\" cy=\"33\" r=\"2.4\" fill=\"#ffffff\"/>" +
    "</svg>",

  planningWorkflow:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M9 38L24 22L39 10\" stroke=\"#10233b\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-dasharray=\"2 5\"/>" +
    "<circle cx=\"9\" cy=\"38\" r=\"4.5\" fill=\"#10233b\"/>" +
    "<circle cx=\"24\" cy=\"22\" r=\"4.5\" fill=\"#10233b\"/>" +
    "<circle cx=\"39\" cy=\"10\" r=\"4.5\" fill=\"#e2661b\"/>" +
    "</svg>",

  hierarchy:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M6 8H42L28 26V38L20 42V26L6 8Z\" fill=\"#10233b\"/>" +
    "</svg>",

  safeSystem:
    "<svg viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
    "<path d=\"M6 30A18 18 0 0 1 18 13.4\" fill=\"none\" stroke=\"#1f8a4c\" stroke-width=\"4\" stroke-linecap=\"round\"/>" +
    "<path d=\"M18 13.4A18 18 0 0 1 30 13.4\" fill=\"none\" stroke=\"#f2994a\" stroke-width=\"4\" stroke-linecap=\"round\"/>" +
    "<path d=\"M30 13.4A18 18 0 0 1 42 30\" fill=\"none\" stroke=\"#c0392b\" stroke-width=\"4\" stroke-linecap=\"round\"/>" +
    "<line class=\"icon-needle\" x1=\"24\" y1=\"26\" x2=\"24\" y2=\"9\" stroke=\"#e2661b\" stroke-width=\"3\" stroke-linecap=\"round\"/>" +
    "<circle cx=\"24\" cy=\"26\" r=\"3.2\" fill=\"#10233b\"/>" +
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

var COURSE = {
  meta: {
    title: "NZGTTM Essentials",
    subtitle: "Understanding the Transition to a Risk Based Approach to Temporary Traffic Management",
    duration: "15 minutes",
    provider: "Sela Civil Advisory Ltd",
    passmark: 80
  },

  summaryIcon: ICONS.summary,

  summaryText: "You've covered the transition from CoPTTM to the NZGTTM, the core of the Risk Based Approach — hazard, exposure, risk, the hierarchy of controls and lowest total risk — and how the Safe System Approach underpins safe speed and design decisions on every TTM site.",

  screens: [

    // 0 -------------------------------------------------------------
    {
      id: "welcome",
      type: "content",
      minSeconds: 20,
      icon: ICONS.welcome,
      title: "Welcome",
      eyebrow: "Sela Civil Advisory presents",
      body: [
        "<p class=\"lead\">This short course introduces the shift from the old, compliance-based Code of Practice for Temporary Traffic Management (CoPTTM) to the <strong>New Zealand Guide to Temporary Traffic Management (NZGTTM)</strong> — a risk-based approach to keeping road workers and road users safe.</p>",
        "<p>Along the way, you'll meet the <strong>Risk Based Approach to TTM</strong> and the <strong>Safe System Approach</strong> that sits underneath it, both of which now shape how every temporary traffic management site in Aotearoa New Zealand is planned and run.</p>",
        "<div class=\"vision-banner\">“All workers and road users go home safe every day.”</div>",
        "<p class=\"meta-line\">Approx. 15 minutes &middot; includes a short knowledge check at the end</p>"
      ]
    },

    // 1 -------------------------------------------------------------
    {
      id: "objectives",
      type: "content",
      minSeconds: 20,
      icon: ICONS.objectives,
      title: "What you'll be able to do",
      eyebrow: "Learning objectives",
      body: [
        "<p>By the end of this module, you will be able to:</p>",
        "<ul class=\"obj-list\">" +
          "<li>Explain why New Zealand's TTM system moved from a prescriptive, compliance-based code to a risk-based guide</li>" +
          "<li>Describe the core principles of the <strong>Risk Based Approach</strong> to TTM, including the hierarchy of controls and lowest total risk</li>" +
          "<li>Explain the <strong>Safe System Approach</strong> and how it applies on a TTM site</li>" +
          "<li>Recognise how these frameworks work together, and where responsibility sits across the contracting chain</li>" +
        "</ul>"
      ]
    },

    // 2 -------------------------------------------------------------
    {
      id: "why-ttm",
      type: "content",
      minSeconds: 25,
      icon: ICONS.whyTtm,
      title: "Why temporary traffic management exists",
      eyebrow: "Setting the scene",
      body: [
        "<p>Anyone working on or near a road creates a risk to themselves and to the people using that road — and road users create a risk to those workers. Temporary traffic management (TTM) exists to manage that two-way risk.</p>",
        "<p>Under the <strong>Health and Safety at Work Act 2015 (HSWA)</strong>, every person conducting a business or undertaking (PCBU) has a duty of care to do all things reasonably practicable to keep workers and road users safe. This sits alongside the Land Transport Management Act 2003, the Local Government Act, and Waka Kotahi's <strong>Road to Zero</strong> road safety strategy (2020–2030).</p>",
        "<div class=\"callout\"><strong>Key principle:</strong> if you create the risk, you manage the risk — and everyone in the contracting chain shares responsibility for safety.</div>"
      ]
    },

    // 3 -------------------------------------------------------------
    {
      id: "transition",
      type: "content",
      minSeconds: 35,
      icon: ICONS.transition,
      title: "The transition: from CoPTTM to NZGTTM",
      eyebrow: "The big change",
      body: [
        "<p>For many years, the industry worked to the <strong>Code of Practice for Temporary Traffic Management (CoPTTM)</strong> — a prescriptive code built around generic, pre-approved plans, fixed site categories (mobile / semi-static / static) and simplified “road levels” used as a stand-in for a proper site-specific risk assessment.</p>",
        "<p>In April 2023, Waka Kotahi published the <strong>New Zealand Guide to Temporary Traffic Management (NZGTTM)</strong> to support the transition “from a government-led, compliance-based model to an industry-led, risk-based model.” It is a guide, not a mandatory code — deliberately so, because no generic approach fits every site.</p>",
        "<figure class=\"slide-figure\"><img src=\"assets/images/transition-infographic.jpg\" alt=\"Diagram comparing the old prescriptive CoPTTM approach - one-size-fits-all layouts, generic signs, compliance-focused - with the new risk-based NZGTTM approach: a risk assessment process (identify hazards, assess risk, select controls, monitor and review), site-specific factors (road type, traffic volume, user mix, work activity), and lowest total risk balancing access and safety\" /><figcaption>The shift from a fixed, one-size-fits-all layout to a site-specific risk assessment that weighs lowest total risk.</figcaption></figure>",
        "<table class=\"compare-table\"><thead><tr><th>CoPTTM (old)</th><th>NZGTTM (new)</th></tr></thead><tbody>" +
        "<tr><td>Prescriptive code, government-led compliance</td><td>Risk-based guide, industry-led responsibility</td></tr>" +
        "<tr><td>Generic, pre-approved plans assumed to fit</td><td>Every site individually assessed — never assume a generic plan is fit for purpose</td></tr>" +
        "<tr><td>Simplified “road levels” as a proxy for risk</td><td>Full risk assessment: identify hazards, exposure and controls for the actual site</td></tr>" +
        "<tr><td>Fixed site categories (mobile / semi-static / static)</td><td>Contractor PCBU selects the most appropriate equipment and control for each unique site</td></tr>" +
        "</tbody></table>",
        "<p class=\"meta-line\">Source: New Zealand Guide to Temporary Traffic Management, Waka Kotahi NZ Transport Agency, April 2023</p>"
      ]
    },

    // 4 -------------------------------------------------------------
    {
      id: "what-is-risk",
      type: "content",
      minSeconds: 30,
      icon: ICONS.whatIsRisk,
      title: "First, what do we mean by “risk”?",
      eyebrow: "Risk Based Approach – the basics",
      body: [
        "<p>The Risk Based Approach starts with three simple ideas:</p>",
        "<div class=\"trio\">" +
          "<div class=\"trio-card\"><h4>Hazard</h4><p>Something that can cause harm</p></div>" +
          "<div class=\"trio-card\"><h4>Exposure</h4><p>Somebody has to interact with the hazard for it to cause harm</p></div>" +
          "<div class=\"trio-card\"><h4>Risk</h4><p>The chance the hazard will cause harm, and how severe that harm could be</p></div>" +
        "</div>",
        "<p><strong>Example:</strong> a washout on the road shoulder is a <em>hazard</em>. If vehicles travel down that road, they interact with it — that's <em>exposure</em>. Together, that creates a <em>risk</em> of harm to whoever is exposed.</p>",
        "<p>Getting the risk assessment right matters: choose the wrong control and you can end up increasing the very risk you were trying to reduce.</p>"
      ]
    },

    // 5 -------------------------------------------------------------
    {
      id: "planning-workflow",
      type: "content",
      minSeconds: 35,
      icon: ICONS.planningWorkflow,
      title: "Planning under the Risk Based Approach",
      eyebrow: "Risk Based Approach – the process",
      body: [
        "<p>Every activity is planned through the same overall workflow, with the level of effort scaled to the level of risk — more risk, more planning:</p>",
        "<ol class=\"workflow-list\">" +
          "<li><strong>Activity &amp; environment context</strong> – understand the proposed activity and the road environment it will affect</li>" +
          "<li><strong>Risk considerations</strong> – determine an initial risk profile and network impact</li>" +
          "<li><strong>Determine level of planning</strong> – common (pre-approved), in-between, or fully site-specific, based on risk</li>" +
          "<li><strong>Risk &amp; peer review</strong> – an independent check by the relevant Transport Access Organisation(s)</li>" +
          "<li><strong>Approval</strong> – network access and/or regulatory approval (e.g. road closures, temporary speed limits)</li>" +
          "<li><strong>Approved plan</strong> – issued to the operational team for implementation</li>" +
        "</ol>",
        "<p>Responsibility is shared but not identical: the <strong>Contractor PCBU</strong> prepares the risk assessment and TMP; the <strong>Contracting PCBU</strong> (client) must ensure the work can be delivered safely; the <strong>Transport Access Organisation (TAO)</strong> peer reviews and can veto a plan it considers too risky. All parties must consult, cooperate and coordinate — none can simply direct the others.</p>"
      ]
    },

    // 6 -------------------------------------------------------------
    {
      id: "hierarchy",
      type: "content",
      minSeconds: 40,
      icon: ICONS.hierarchy,
      title: "Choosing controls: hierarchy of controls",
      eyebrow: "Risk Based Approach – selecting controls",
      body: [
        "<p>Not all controls are equally effective. The Health and Safety at Work Regulations 2016 set out a required order of preference:</p>",
        "<div class=\"pyramid\">" +
          "<div class=\"pyramid-row level-1\">1. Eliminate the risk</div>" +
          "<div class=\"pyramid-row level-2\">2. Substitute / Isolate / Engineer</div>" +
          "<div class=\"pyramid-row level-3\">3. Administrative controls</div>" +
          "<div class=\"pyramid-row level-4\">4. Personal protective equipment (PPE)</div>" +
        "</div>",
        "<p>Applied to TTM, this becomes five fundamental methodologies, from most to least effective: <strong>remove the need to do the work</strong> &rarr; <strong>go around the site</strong> (detour or temporary road) &rarr; <strong>go through the site</strong> (temporary closure with stop/go control) &rarr; <strong>go past the site</strong> (separation, barriers, isolating workers in space or time) &rarr; <strong>in the gaps</strong> (workers rely on gaps between vehicles — the least effective, highest-reliance-on-behaviour option).</p>",
        "<div class=\"callout\"><strong>Lowest total risk:</strong> a control that fixes one group's risk can increase risk for another — for example, closing a road to protect workers but detouring road users onto a less safe route. It is unethical, and inconsistent with HSWA, to simply transfer risk from one group to another. Every control must be assessed for its effect on <em>total</em> risk across everyone affected — workers and all road users.</div>"
      ]
    },

    // 7 -------------------------------------------------------------
    {
      id: "safe-system",
      type: "content",
      minSeconds: 40,
      icon: ICONS.safeSystem,
      title: "The Safe System Approach",
      eyebrow: "A shared philosophy behind Road to Zero",
      body: [
        "<p>The NZGTTM's risk-based approach sits inside Waka Kotahi's wider <strong>Road to Zero</strong> strategy, which is built on the <strong>Safe System Approach</strong> — the international road safety philosophy that no death or serious injury on our roads is acceptable, because humans make mistakes and humans are physically vulnerable.</p>",
        "<p>Three Safe System principles are especially important for TTM:</p>",
        "<div class=\"trio\">" +
          "<div class=\"trio-card\"><h4>Plan for mistakes</h4><p>We promote good choices, but design the system so an honest mistake doesn't end in death or serious injury</p></div>" +
          "<div class=\"trio-card\"><h4>Design for human vulnerability</h4><p>The human body can only survive so much force — so speed, layout and protection must match that limit</p></div>" +
          "<div class=\"trio-card\"><h4>Safety as a priority</h4><p>Safety is given the same weight as any other objective in decision-making — not a nice-to-have</p></div>" +
        "</div>",
        "<p>This plays out directly in TTM speed selection. Research shows survivable impact thresholds of roughly:</p>",
        "<table class=\"speed-table\"><thead><tr><th>Possible crash type</th><th>Target safe system speed</th></tr></thead><tbody>" +
        "<tr><td>Vehicle vs. an unprotected person (worker on foot, pedestrian, cyclist)</td><td>30 km/h</td></tr>" +
        "<tr><td>Side-on crash between vehicles</td><td>50 km/h</td></tr>" +
        "<tr><td>Head-on crash between vehicles</td><td>70 km/h</td></tr>" +
        "</tbody></table>",
        "<p>These thresholds — alongside the environment (loose material, tight curves, poor surfacing) — directly inform the temporary speed limits set at a TTM site. Safe System and the Risk Based Approach are two sides of the same coin: Safe System sets <em>why</em> a survivable outcome matters; the Risk Based Approach sets out <em>how</em> we get there on each individual site.</p>"
      ]
    },

    // 8 -------------------------------------------------------------
    {
      id: "framework",
      type: "content",
      minSeconds: 30,
      icon: ICONS.framework,
      title: "Bringing it together: the TTM framework",
      eyebrow: "How it all fits",
      body: [
        "<p>The NZGTTM frames a successful TTM system around four core elements, all working toward one vision:</p>",
        "<div class=\"framework-grid\">" +
          "<div class=\"fw-card\"><h4>People</h4><p>Leadership, training, competency assessment</p></div>" +
          "<div class=\"fw-card\"><h4>Process &amp; guides</h4><p>NZGTTM, practice notes, planning, approval, QA &amp; control</p></div>" +
          "<div class=\"fw-card\"><h4>Equipment</h4><p>Plant, static equipment, intelligent transport systems</p></div>" +
          "<div class=\"fw-card\"><h4>Contracts</h4><p>Terms, specifications, roles, responsibilities, payment terms</p></div>" +
        "</div>",
        "<div class=\"vision-banner\">“All workers and road users go home safe every day.”</div>",
        "<p>Remember the shift in mindset: it's no longer about following a fixed rulebook — it's about proactively identifying risk on <em>your</em> site, applying the hierarchy of controls, checking the lowest total risk, and being able to explain your reasoning to everyone in the contracting chain.</p>"
      ]
    },

    // 9 -------------------------------------------------------------
    {
      id: "quiz-intro",
      type: "content",
      minSeconds: 10,
      icon: ICONS.quizIntro,
      title: "Knowledge check",
      eyebrow: "Almost there",
      body: [
        "<p>Let's check that the key ideas have landed. You'll be asked 8 short questions covering the transition, the Risk Based Approach and the Safe System Approach.</p>",
        "<p>You need <strong>80% (7 out of 8)</strong> to pass. If needed, you can retake the check — your best attempt this session will be recorded.</p>"
      ]
    },

    // 10 quiz screen - handled specially by app.js
    {
      id: "quiz",
      type: "quiz",
      title: "Knowledge check",
      eyebrow: "Knowledge check"
    },

    // 11 summary
    {
      id: "summary",
      type: "summary",
      title: "Course complete",
      eyebrow: "Well done"
    }
  ],

  quiz: [
    {
      q: "What best describes the shift the NZGTTM represents?",
      options: [
        "A move from an industry-led risk-based model to a government-led compliance model",
        "A move from a government-led, compliance-based model to an industry-led, risk-based model",
        "A minor update to CoPTTM with no change in approach",
        "A move away from Waka Kotahi involvement in TTM altogether"
      ],
      correct: 1
    },
    {
      q: "Under CoPTTM, “road levels” were used mainly to:",
      options: [
        "Record the exact GPS elevation of a worksite",
        "Provide a simplified proxy for a full site-specific risk assessment",
        "Classify the seniority of the STMS required on site",
        "Set the speed limit on state highways only"
      ],
      correct: 1
    },
    {
      q: "In the hazard / exposure / risk model, “exposure” refers to:",
      options: [
        "The severity of an injury after a crash",
        "Somebody interacting with, or being able to interact with, the hazard",
        "The number of years a worker has been in the industry",
        "The distance an advance warning sign is placed from a hazard"
      ],
      correct: 1
    },
    {
      q: "Which order correctly reflects the hierarchy of controls (most to least effective)?",
      options: [
        "PPE → Administrative → Engineering/Isolate/Substitute → Eliminate",
        "Eliminate → Substitute/Isolate/Engineer → Administrative → PPE",
        "Administrative → Eliminate → PPE → Engineer",
        "Engineer → Eliminate → PPE → Administrative"
      ],
      correct: 1
    },
    {
      q: "A contractor closes a road to remove all risk to workers, but this detours traffic onto a narrow, poorly lit rural road with no shoulder. What NZGTTM concept does this raise?",
      options: [
        "Lowest total risk — the control may have simply transferred risk to road users rather than reducing overall risk",
        "This is always the correct choice because worker risk is eliminated",
        "The One Network Framework, which mandates this response",
        "Quality, assurance and control documentation requirements"
      ],
      correct: 0
    },
    {
      q: "Which of these is one of the Safe System principles highlighted in the NZGTTM?",
      options: [
        "We expect perfect compliance and do not plan for mistakes",
        "We design for human vulnerability, because the human body can only withstand limited force in a crash",
        "We prioritise traffic flow over safety wherever possible",
        "We rely on road levels instead of individual risk assessment"
      ],
      correct: 1
    },
    {
      q: "According to the Safe System speed thresholds referenced in the NZGTTM, what is the target safe system speed where a crash could occur between a vehicle and an unprotected worker or pedestrian?",
      options: [
        "70 km/h",
        "50 km/h",
        "30 km/h",
        "100 km/h"
      ],
      correct: 2
    },
    {
      q: "Which statement best reflects the shared-responsibility principle in the NZGTTM?",
      options: [
        "Only the Contractor PCBU carries any responsibility for TTM safety",
        "If you create the risk, you manage the risk — and everyone in the contracting chain shares responsibility",
        "The Transport Access Organisation (TAO) is solely responsible for all site safety outcomes",
        "Responsibility ends once a Traffic Management Plan is approved"
      ],
      correct: 1
    }
  ]
};
