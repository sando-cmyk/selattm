/* Course content data for "Roles and Responsibilities for TTM in New Zealand" */

var COURSE_TITLE = "Roles & Responsibilities for TTM in New Zealand";
var COURSE_SUBTITLE = "Regulatory & Best Practice Primer — NZGTTM Edition";
var PASS_MARK = 80;

/* Legend used throughout the course to tag each duty */
var REG = "regulatory";
var BP = "best-practice";

/* Narration audio per section (id -> file path). Autoplayed by app.js as the learner enters each slide. */
var AUDIO = {
  "welcome": "audio/welcome.m4a",
  "legal-foundation": "audio/legal-foundation.m4a",
  "rca-tao": "audio/rca-tao.m4a",
  "contractor-pcbu": "audio/contractor-pcbu.m4a",
  "ttm-planner-stms": "audio/ttm-planner-stms.m4a",
  "ttm-workers": "audio/ttm-workers.m4a",
  "qa-training": "audio/qa-training.m4a",
  "roles-matrix": "audio/roles-matrix.m4a",
  "summary": "audio/summary.m4a",
  "quiz": "audio/quiz.m4a"
};

var MODULES = [
  {
    id: "welcome",
    kind: "info",
    nav: "Welcome",
    title: "Welcome",
    minutes: 4,
    body: [
      { type: "image", src: "images/course-banner.jpg", alt: "Course: TTM Roles & Responsibilities — Sela Civil Advisory Limited" },
      { type: "p", text: "This course focuses on the New Zealand Guide to Temporary Traffic Management — NZGTTM — because it is now the current framework. The Code of Practice for Temporary Traffic Management (CoPTTM, 4th edition, 2018) has been superseded: Road Controlling Authorities began accepting Corridor Access Requests and Traffic Management Plans prepared under NZGTTM from 1 November 2025, and from 1 July 2026, CoPTTM-based TMPs are no longer accepted anywhere in New Zealand. If you trained under CoPTTM, this course will show you what has carried over, what has changed, and what no longer applies." },
      { type: "p", text: "Temporary Traffic Management (TTM) in New Zealand runs on two layers that work together, but that are not the same thing. The regulatory layer is created directly by an Act of Parliament or a Land Transport Rule — it can be enforced by prosecution, infringement, or a stand-alone statutory power, independently of any contract. The best-practice layer is guidance published by Waka Kotahi NZ Transport Agency — it shapes how well a duty is met, and it often becomes binding in practice because a Road Controlling Authority writes compliance with it into a contract or an authorisation condition. But it was never enacted as law." },
      { type: "list", items: [
        "New Zealand Guide to Temporary Traffic Management (NZGTTM), Version 1 (2023, now the mandatory reference for all TMPs) — Waka Kotahi's risk-based guide, which it explicitly describes as best practice rather than a mandatory code. Inside NZGTTM the word “must” is used to flag a requirement that happens to come from an Act (usually HSWA), not to give the document itself legal force.",
        "CoPTTM, 4th edition (2018) — retired. It is referenced in this course only where it explains a term or expectation practitioners may still recognise (for example, the STMS title), or where NZGTTM deliberately dropped something CoPTTM used to require. Nothing in CoPTTM should be treated as current guidance."
      ]},
      { type: "callout", style: "key", text: "Throughout this course, every duty is tagged Regulatory or Best Practice, with its source. Regulatory means an Act of Parliament or a Land Transport Rule requires it directly. Best Practice means NZGTTM recommends or specifies it — genuinely important for reducing risk, and often made contractually binding by an RCA, but not itself a product of Parliament or a Rule." },
      { type: "p", text: "This is a deliberately sharp line, and it's worth sitting with. Most of the day-to-day apparatus of New Zealand TTM — the STMS's authority on site, TMP content and documentation, risk registers, toolbox talks — is NZGTTM's own best-practice system, successor to CoPTTM's now-retired one. None of it is created by an Act or a Rule. What the law actually requires is much thinner: a PCBU's general duty of care under HSWA 2015, a Road Controlling Authority's power to authorise devices and closures under the Traffic Control Devices Rule and related Acts, and a handful of specific requirements, like written approval for temporary speed limits. NZGTTM exists to give businesses a detailed, workable, risk-based way of meeting that thin legal duty well — and RCAs give it teeth by making compliance a condition of contract or authorisation, not because the document is itself law." },
      { type: "callout", style: "info", text: "This is an essentials-level primer for shared understanding across a TTM team, client, or new starter. It is not a substitute for NZGTTM itself, formal STMS/TTM accreditation training under the new competency-based system, or professional engineering sign-off on complex sites." }
    ],
    objectives: [
      "State why this course focuses on NZGTTM and the date CoPTTM stopped being accepted",
      "Distinguish a regulatory TTM requirement (from an Act or Rule) from a best-practice one (from NZGTTM)",
      "Explain how NZGTTM becomes binding in practice despite not being legislation"
    ]
  },

  {
    id: "legal-foundation",
    kind: "module",
    number: 1,
    nav: "1. Legal Foundation",
    title: "1. The Legal & Regulatory Foundation",
    minutes: 7,
    body: [
      { type: "p", text: "Every role in TTM sits on top of a stack of legislation. This stack — and only this stack — is what this course tags as Regulatory. Understanding it explains why the true legal floor is thinner than most people assume, and why NZGTTM exists to fill the space above it." },
      { type: "subhead", text: "Core regulatory instruments (Acts and Rules) — unaffected by the CoPTTM-to-NZGTTM transition" },
      { type: "duties", items: [
        { text: "Health and Safety at Work Act 2015 (HSWA) — every PCBU (person conducting a business or undertaking) has a duty of care to eliminate, or so far as reasonably practicable minimise, risks to workers and road users. This is the foundation duty underneath every role in this course.", tag: REG, source: "HSWA 2015, ss 36–37" },
        { text: "Traffic Control Devices Rule 2004 — gives Road Controlling Authorities the power (and the duty) to authorise, install, operate, and remove traffic control devices on the roads they control.", tag: REG, source: "Traffic Control Devices Rule 2004, s2.1" },
        { text: "Government Roading Powers Act 1989 — gives Waka Kotahi the power to stop, divert, or close state highways temporarily for works or events.", tag: REG, source: "GRPA 1989, s61" },
        { text: "Local Government Act 1974 / 2002 — gives councils equivalent powers to close or control local roads, and a general duty to take precautions for public and worker safety near roadworks.", tag: REG, source: "LGA 1974 s353; LGA 2002 s145" },
        { text: "Setting of Speed Limits Rule 2022 — temporary speed limits must be approved in writing by the Road Controlling Authority.", tag: REG, source: "Setting of Speed Limits Rule 2022, s7" },
        { text: "Railways Act 2005 — written permission from the rail access owner is required before any work on, over, or under railway infrastructure, including TTM near a level crossing.", tag: REG, source: "Railways Act 2005, s75" }
      ]},
      { type: "subhead", text: "The best-practice layer — none of this is legislation" },
      { type: "duties", items: [
        { text: "NZGTTM (2023) — Waka Kotahi's current best-practice guide, explicitly described as such rather than a mandatory code, and now the sole reference RCAs require for TMPs. Its “must” statements flag legal requirements that flow from an Act (most often HSWA), not requirements created by NZGTTM itself.", tag: BP, source: "NZGTTM (2023), Part 1" },
        { text: "Road to Zero (2020–2030) — the Ministry of Transport's road safety strategy. It is not a legal instrument, but it shapes how “reasonably practicable” gets interpreted, particularly the preference for safe system design over reliance on road-user compliance.", tag: BP, source: "Road to Zero strategy" },
        { text: "WorkSafe “Keeping healthy and safe while working on the road or roadside” — a WorkSafe good practice guide (2022) intended to be read alongside HSWA and NZGTTM, not a rule with independent legal force.", tag: BP, source: "WorkSafe Good Practice Guide, 2022" }
      ]},
      { type: "callout", style: "info", text: "Where's CoPTTM? Retired. It was NZTA's previous best-practice code — never itself an Act or Rule either — and RCAs stopped accepting CoPTTM-based TMPs from 1 July 2026. NZGTTM has taken over its place in the best-practice layer, and this course treats it as the sole current source for everything that isn't an Act or Rule." },
      { type: "callout", style: "key", text: "Key idea: “Who holds the legal power to close this road” and “what is the right decision-making process to get there safely” are two different questions. The first is answered only by the Traffic Control Devices Rule and the LGA/GRPA — a short list, unaffected by any change of TTM guidance. The second is guided by HSWA's risk-based duty of care, which NZGTTM exists to help you meet, without itself being law." }
    ],
    objectives: [
      "List the core Acts and Rules that create statutory TTM powers and duties",
      "Explain why NZGTTM is not legislation, despite being the mandatory reference for TMPs",
      "State when CoPTTM-based TMPs stopped being accepted"
    ]
  },

  {
    id: "rca-tao",
    kind: "module",
    number: 2,
    nav: "2. RCA, TAOs & Peer Review",
    title: "2. Road Controlling Authorities, TAOs & the Peer Review System",
    minutes: 8,
    body: [
      { type: "p", text: "A Road Controlling Authority (RCA) — Waka Kotahi for state highways, councils for local roads, and equivalents such as DOC, airport and port operators — draws its authority from the Traffic Control Devices Rule 2004, the Government Roading Powers Act 1989, and the Local Government Act. Transport Authority Organisations (TAOs) is the broader collective term used by NZGTTM, and includes RCAs, rail access authorities (such as KiwiRail), and public transport authorities." },
      { type: "subhead", text: "RCA's statutory powers (regulatory)" },
      { type: "duties", items: [
        { text: "Authorise the installation and operation of traffic control devices on roads it controls.", tag: REG, source: "Traffic Control Devices Rule 2004, s2.1" },
        { text: "Close roads temporarily for works, investigations, or events (Waka Kotahi for state highways; councils for local roads).", tag: REG, source: "GRPA 1989 s61; LGA 1974 Sch.10 cl.11" },
        { text: "Approve temporary speed limits in writing.", tag: REG, source: "Setting of Speed Limits Rule 2022, s7" }
      ]},
      { type: "p", text: "NZGTTM organises how those statutory powers get exercised into a peer review system with three distinct functions during the planning stage — risk review, network access coordination, and regulatory approval. All three are best practice architecture, though the regulatory approval function is where an RCA's genuine statutory power is actually applied." },
      { type: "subhead", text: "1. Risk review" },
      { type: "duties", items: [
        { text: "A risk reviewer's job is to make sure the risk management process is robust and hasn't overlooked any critical risks — including risks from combining multiple sites, or security risks. The reviewer does not approve the risk assessment; they provide improvement recommendations to the contractor PCBU. This is a deliberate move away from the old CoPTTM approver function, which has been retired.", tag: BP, source: "NZGTTM (2023), Risk review, p.39" },
        { text: "Potential risk-review organisations include Road Controlling Authorities, rail access authorities such as KiwiRail, public transport authorities, and Police or other security specialists — whichever transport systems the activity actually impacts.", tag: BP, source: "NZGTTM (2023), Risk review, p.39" }
      ]},
      { type: "subhead", text: "2. Network access coordination (NAC)" },
      { type: "duties", items: [
        { text: "Space and time coordination makes sure the section of road proposed for the activity doesn't clash with another activity, unless both can happen safely at the same time — including making sure a detour doesn't travel through another road closure.", tag: BP, source: "NZGTTM (2023), Network access coordination, p.40" },
        { text: "Transport impacts review assesses the transport impact of individual and multiple sites in an area — often using first principles, though complex situations may need specialist traffic modelling.", tag: BP, source: "NZGTTM (2023), Network access coordination, p.40" }
      ]},
      { type: "subhead", text: "3. Regulatory approval — the RCA's statutory power in action" },
      { type: "duties", items: [
        { text: "Authorising installation and operation of traffic control devices, warning road users of a hazard, and removing a device where required.", tag: REG, source: "Traffic Control Devices Rule 2004, s2.1(1)" },
        { text: "Authorising road closures — Waka Kotahi for state highways, councils for local roads.", tag: REG, source: "GRPA 1989 s61; LGA 1974 Sch.10 cl.11" },
        { text: "Approving temporary speed limits in writing.", tag: REG, source: "Setting of Speed Limits Rule 2022, s7" }
      ]},
      { type: "callout", style: "info", text: "What NZGTTM discontinued: CoPTTM classified every road into a level (LV, 1, 2, or 3) and used that level to decide the TTM required. NZGTTM has explicitly retired road levels — a risk assessment is now done for each site instead, so the old level-based classification is no longer necessary. If you trained under CoPTTM, this is one of the clearest markers of the shift: the RCA's role moved from “tell you your road's level” to “review the quality of your site-specific risk assessment.”" },
      { type: "callout", style: "key", text: "Key idea: authorising a road closure, a device, or a speed limit is a Regulatory function with a named legal source. The peer review system that surrounds it — risk review and network access coordination — is Best Practice architecture NZGTTM built, which an RCA can make binding through its own contracts, but which no Act requires in this specific form." }
    ],
    objectives: [
      "List the RCA's genuinely statutory powers, and the Acts/Rules they come from",
      "Name NZGTTM's three peer-review functions and which one exercises a genuine statutory power",
      "Explain what NZGTTM discontinued from CoPTTM's road-level classification system"
    ]
  },

  {
    id: "contractor-pcbu",
    kind: "module",
    number: 3,
    nav: "3. Contractor PCBU",
    title: "3. The Contractor PCBU",
    minutes: 8,
    body: [
      { type: "p", text: "The contractor PCBU carries the largest concentration of duties in the system — it is the party that actually plans, resources, and delivers the worksite. Its genuine legal duty of care comes from HSWA; NZGTTM sets out, in detail, how that duty should be discharged through a risk-based approach." },
      { type: "subhead", text: "Regulatory responsibilities" },
      { type: "duties", items: [
        { text: "Hold lawful authorisation to work in or affect the road reserve before starting any work — this may include a Work Access Permit, an event permit, approval to install hoardings or fencing, or approval to occupy paid parking spaces.", tag: REG, source: "LGA 1974/2002; GRPA 1989" },
        { text: "Ensure every worker, including subcontractors, has the training, instruction, and supervision necessary to protect them from the risks of the work.", tag: REG, source: "HSWA 2015 s36(3)(f)" },
        { text: "Notify WorkSafe as soon as possible of any death, notifiable injury or illness, or notifiable event.", tag: REG, source: "HSWA 2015 ss 23–25" }
      ]},
      { type: "subhead", text: "NZGTTM's implementation responsibilities for the contractor PCBU (best practice)" },
      { type: "duties", items: [
        { text: "Hold briefings so everyone on site understands the risks, controls, and residual risks.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Make sure everyone is supported when it comes to safety — production and financial pressures must not compromise safety.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Make sure everyone working in traffic management operations is qualified and competent, and manage unsafe workers as appropriate.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Follow traffic regulations and the requirements of the TMP, and ensure site layout and worksite conditions are in line with the approved TMP.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Report on incidents and crashes at worksites.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" }
      ]},
      { type: "subhead", text: "NZGTTM's risk-based planning responsibilities (best practice)" },
      { type: "duties", items: [
        { text: "Justify every TTM engineering decision against site-specific hazards, road-user behaviour, worker exposure, and environment/activity conditions — rather than defaulting to a standard diagram.", tag: BP, source: "NZGTTM (2023), Risk assessment process, pp.34–35" },
        { text: "Maintain a risk register documenting identified risks, control options considered, residual risk, and the final adopted controls, including peer-review feedback.", tag: BP, source: "NZGTTM (2023), TTM documentation, p.37" },
        { text: "Decide, site by site, whether a pre-approved reusable scheme (PARS) is actually suitable — never assume one is, since blanket-approved generic schemes were a CoPTTM-era shortcut NZGTTM does not carry over unquestioned.", tag: BP, source: "NZGTTM (2023), Clarifications, p.35" },
        { text: "Consider additional TTM delivery documentation — crew briefing plans, TMP variation registers, consultation logs, complaints registers — to support transparency and continuous improvement.", tag: BP, source: "NZGTTM (2023), TTM documentation, p.38" }
      ]},
      { type: "callout", style: "info", text: "Practical check: “We used the standard layout” satisfies nothing on its own — and under NZGTTM, generic pre-approved layouts can no longer be assumed valid without a fresh risk assessment. The regulatory duty is a general one: hold lawful authorisation, keep people trained, protect health and safety. Everything specific about how a TMP is built, documented, and reviewed is NZGTTM's best-practice system for meeting that duty well." }
    ],
    objectives: [
      "Separate the contractor PCBU's genuine HSWA/statutory obligations from NZGTTM's best-practice system",
      "List NZGTTM's implementation responsibilities for the contractor PCBU",
      "Explain why a pre-approved reusable scheme can no longer be assumed suitable without a fresh risk assessment"
    ]
  },

  {
    id: "ttm-planner-stms",
    kind: "module",
    number: 4,
    nav: "4. TTM Planner & STMS",
    title: "4. The TTM Planner & Site Traffic Management Supervisor (STMS)",
    minutes: 9,
    body: [
      { type: "p", text: "NZGTTM splits TTM delivery into a designer and an installer. The Temporary Traffic Management Planner (TTMP) designs the risk-based plan. The Site Traffic Management Supervisor (STMS) then installs it — NZGTTM describes the STMS as “the system installer, the person that installs a system designed by a designer.” Neither role is created by an Act or Rule; both are NZGTTM's current best-practice system, and the underlying legal duty behind them is simply the PCBU's general HSWA obligation to ensure competent supervision of a hazardous activity." },
      { type: "subhead", text: "The STMS's three primary functions" },
      { type: "list", ordered: true, items: [
        "Establish the site so it is consistent with the TMP.",
        "Monitor the site's effectiveness — drive, walk, and cycle through it regularly, and check and act on any unexpected risk.",
        "Uplift the site, removing TTM in a planned and safe manner once work is complete."
      ]},
      { type: "subhead", text: "What the STMS needs to do (NZGTTM's implementation guidance — best practice)" },
      { type: "duties", items: [
        { text: "Make sure the approved TMP is right for the worksite, and if it isn't, contact the TTM planner to update it.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Set up the approved TMP, including driving, walking, and cycling checks to confirm the site is consistent with it.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "If a new risk is identified, change the site as necessary — changes should be reviewed by a qualified person, preferably the TTM planner. Where that isn't possible, the STMS uses their own knowledge of NZGTTM to make the best decision and documents it.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Make sure a copy of the approved TMP is always available on site, and that people entering the worksite attend an induction on the TTM risks and controls.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.44" },
        { text: "Lead the TTM team: make sure workers have been briefed, are wearing appropriate PPE, know their tasks, and comply with traffic controls and best practice.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" },
        { text: "Provide leadership during an incident, manage fatigue and staffing breaks, and always be contactable by mobile phone.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" },
        { text: "Complete worksite inspections — checking for contradictory or surplus signage, devices at the right times, damaged equipment replaced promptly, and visibility in low light.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" },
        { text: "Safely and quickly put in place any TTM changes instructed by an authorised person (Police, a WorkSafe representative, or another qualified person), record and sign them on the TMP, and tell the TTM planner as soon as possible.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" },
        { text: "Contribute to toolbox talks with information on the peer-reviewed TTM at least daily, and record and alert the contractor PCBU to all incidents, third-party assurance assessments, and complaints.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" }
      ]},
      { type: "subhead", text: "One genuine regulatory limit" },
      { type: "duties", items: [
        { text: "The STMS cannot put a temporary speed limit into effect without the Road Controlling Authority's approval in writing (or delegated authority the RCA has actually granted). This specific limit traces directly to the Setting of Speed Limits Rule, not to NZGTTM.", tag: REG, source: "Setting of Speed Limits Rule 2022, s7" }
      ]},
      { type: "p", text: "NZGTTM does not carry over CoPTTM's fixed numeric limits — such as the old rule capping an STMS to a set travel-time radius from a delegated worksite. Those limits belonged to the retired CoPTTM system. Under NZGTTM, how many worksites an STMS can safely be responsible for, and how far away they may be, is a judgement the contractor PCBU makes and documents as part of its own risk assessment and resourcing decisions — not a fixed rule this course can quote." },
      { type: "callout", style: "key", text: "Key idea: the STMS's underlying duty of care — the safety of workers and the public — flows from HSWA, which applies to the PCBU employing them. Everything that makes “STMS” a recognisable role with defined authority — and how well that authority is used day to day — belongs to NZGTTM's best-practice system, not to an Act of Parliament." }
    ],
    objectives: [
      "State the STMS's three primary functions under NZGTTM",
      "List what the STMS needs to do under NZGTTM's implementation guidance",
      "Identify the one STMS-related limit that does trace to an actual Land Transport Rule, and explain why fixed CoPTTM-era numeric limits no longer apply"
    ]
  },

  {
    id: "ttm-workers",
    kind: "module",
    number: 5,
    nav: "5. TTM Workers",
    title: "5. Leading & Being Part of the TTM Crew",
    minutes: 7,
    body: [
      { type: "p", text: "CoPTTM used to warrant a separate “Traffic Controller” (TC) role, with its own qualification tier and rules. NZGTTM does not use that title. Instead, its capability framework speaks of “Operational leadership (STMS)” and “Operational team member” — the STMS leads, and the rest of the crew are simply NZGTTM's “other TTM workers,” without a separate warranted tier in between. If your team still uses the term “Traffic Controller” day to day, that's a legacy of CoPTTM; NZGTTM's own language has moved on." },
      { type: "subhead", text: "The STMS's leadership of the team (best practice)" },
      { type: "duties", items: [
        { text: "The STMS leads the TTM team and makes sure workers have been briefed, are wearing appropriate PPE, know what their tasks are, and monitors that tasks are completed.", tag: BP, source: "NZGTTM (2023), Implementation roles, p.45" },
        { text: "The STMS makes sure all workers and TTM staff comply with all traffic controls and best practice for worksites, and has the right to ask workers to leave the site if their actions put themselves or others at risk.", tag: BP, source: "NZGTTM (2023), Other TTM workers, p.45" }
      ]},
      { type: "subhead", text: "Other TTM workers (best practice)" },
      { type: "duties", items: [
        { text: "To reduce the risk of misunderstanding and to support the STMS, all other TTM workers should be qualified.", tag: BP, source: "NZGTTM (2023), Other TTM workers, p.45" },
        { text: "If the lead contractor decides to use unqualified, untrained, or volunteer workers, it must manage the resulting risk itself — for example, by adding an extra trained STMS to provide leadership.", tag: BP, source: "NZGTTM (2023), Other TTM workers, p.45" }
      ]},
      { type: "subhead", text: "One named function that still appears — the manual traffic controller (MTC)" },
      { type: "duties", items: [
        { text: "In an emergency short-term response, where there aren't enough workers for ideal control of the site, NZGTTM specifically anticipates the need for a single manual traffic controller to control traffic from two directions — a modified duty for an unusual situation, not a general warranted role.", tag: BP, source: "NZGTTM (2023), Emergency response, p.54" }
      ]},
      { type: "subhead", text: "Individual worker duties — the genuinely regulatory layer" },
      { type: "duties", items: [
        { text: "Every worker must take reasonable care for their own health and safety, take reasonable care their acts or omissions don't harm others, comply with any reasonable instruction given (such as an STMS's direction), and cooperate with reasonable health and safety policies and procedures (such as wearing the required PPE).", tag: REG, source: "HSWA 2015, s45" }
      ]},
      { type: "callout", style: "info", text: "Worth remembering: the duty to follow a reasonable safety instruction is genuinely regulatory, under HSWA s45. But the specific instruction — which garment, which position — comes from NZGTTM. NZGTTM adds a further best-practice caution: high-visibility clothing sits at the bottom of the hierarchy of controls, the least effective risk-mitigation measure, and is not a substitute for the engineered and procedural controls above it." }
    ],
    objectives: [
      "Explain why NZGTTM does not use \"Traffic Controller\" as a role title, and what replaced it",
      "State the individual worker duties that genuinely are regulatory, under HSWA 2015 s45",
      "Describe the one specific situation where NZGTTM still names a single manual traffic controller function"
    ]
  },

  {
    id: "qa-training",
    kind: "module",
    number: 6,
    nav: "6. QA & Training",
    title: "6. Quality Assurance, Training & Continuous Improvement",
    minutes: 7,
    body: [
      { type: "p", text: "A RASCI matrix developed to support the NZGTTM pilots (Waka Kotahi, Dec 2023) maps how Waka Kotahi (as client lead), the RCA, and the contractor PCBU share accountability across five phases: network assessment, site assessment, pre-implementation, implementation, and lessons learnt. Across almost every phase, the contractor PCBU is Accountable, while Waka Kotahi and the RCA are typically Consulted, Responsible for review, or Informed." },
      { type: "duties", items: [
        { text: "End-of-season feedback sessions, and lessons-learnt reviews feeding back into the Traffic Risk Management Plan, are a best-practice continuous-improvement loop.", tag: BP, source: "RASCI matrix, Phase 4; NZGTTM (2023), Innovation, p.56" },
        { text: "High-potential incidents and near misses should be identified and fed back into planning, supporting the Plan-Do-Check-Act cycle that underpins NZGTTM's risk model.", tag: BP, source: "RASCI matrix, Phase 4" },
        { text: "Innovation — new plant, materials, methodologies, or processes — is encouraged, but must lead to an overall increase in safety and must be reviewed against applicable standards or trialled, rather than introduced unreviewed.", tag: BP, source: "NZGTTM (2023), Innovation, p.56" }
      ]},
      { type: "p", text: "This is also where training and competency responsibilities sit. The duty to ensure workers are trained is regulatory, flowing directly from HSWA. But the shape of the training system itself is a best-practice framework, and it has already moved on from CoPTTM's model: Waka Kotahi does not currently issue TTM warrants of any kind. The old CoPTTM warrant categories (TMO, TMO-NP, STMS Universal, STMS (A/B/C), STMS (A/B/C)-NP) stopped being administered by Waka Kotahi from 1 November 2024, and the Inspector warrant followed on 1 July 2025. Physical warrant ID cards have also been discontinued." },
      { type: "duties", items: [
        { text: "PCBUs must ensure all workers, including subcontractors, have appropriate training, instruction, and supervision for the risks of their work.", tag: REG, source: "HSWA 2015 s36(3)(f)" },
        { text: "Competency is now evidenced through NZQA unit standards (31958–31963, covering TMO and STMS Universal/Category A/B/C), delivered by registered training providers such as Connexis, rather than through a Waka Kotahi-issued warrant. This sits under the TTM Credentials Framework being developed by Waihanga Ara Rau (the infrastructure Workforce Development Council), with sector input coordinated through the Temporary Traffic Management Industry Steering Group (TTM-ISG).", tag: BP, source: "Waka Kotahi, Warrants & Training and assessment guidance; Waihanga Ara Rau, TTM Credentials Framework" },
        { text: "The TTM sector needs capability across five functions: planning (risk assessment, engineering/geometric design), network access coordination, risk peer review, regulatory functions, and operations (operational leadership — the STMS — and operational team members), plus quality assurance.", tag: BP, source: "NZGTTM (2023), Capability and training, p.57" }
      ]},
      { type: "callout", style: "key", text: "Key idea: quality assurance and peer review exist to catch what a single set of eyes misses. Almost the entire apparatus that does this — the review roles, the feedback loop, the training model — is best practice, built by industry and Waka Kotahi together, as the successor to a CoPTTM warrant system that Waka Kotahi no longer administers. The one thing genuinely regulatory underneath all of it is the PCBU's duty to keep its people trained and competent — it does not require any particular credential to be called a \"warrant.\"" }
    ],
    objectives: [
      "Explain how accountability for TTM decisions is typically distributed across Waka Kotahi, the RCA, and the contractor PCBU",
      "Explain why the current training and competency model sits in the best-practice layer even though training itself is a regulatory duty",
      "State that Waka Kotahi no longer issues TTM warrants, and name what has replaced them"
    ]
  },

  {
    id: "roles-matrix",
    kind: "module",
    number: 7,
    nav: "Roles at a Glance",
    title: "Roles & Responsibilities at a Glance",
    minutes: 5,
    body: [
      { type: "p", text: "The table below summarises each role covered in this course under the current NZGTTM framework, its primary source, and one representative regulatory duty and one representative best-practice duty. Roles that CoPTTM used to warrant separately — Traffic Management Coordinator, Engineer to an RCA contract, Traffic Controller — no longer appear as distinct offices, because NZGTTM does not define them. Use this table as a quick-reference — not as a replacement for the full detail in each module." },
      { type: "table", headers: ["Role", "Primary source", "Representative regulatory duty", "Representative best-practice duty"], rows: [
        ["Road Controlling Authority (RCA) / TAO", "Traffic Control Devices Rule 2004; LGA/GRPA; NZGTTM peer review system", "Authorise traffic control devices, road closures & temporary speed limits", "Risk review and network access coordination for contractor TMPs"],
        ["Contractor PCBU", "HSWA 2015; NZGTTM (2023) Implementation roles", "Hold lawful authorisation to work in the road reserve; ensure workers are trained", "Justify decisions with a documented, site-specific risk register"],
        ["TTM Planner (TTMP)", "NZGTTM (2023) Part 2–3", "N/A — role formalised entirely through best practice", "Design risk-based layouts referencing permanent design guides"],
        ["Site Traffic Management Supervisor (STMS)", "NZGTTM (2023) Implementation roles", "N/A — the role and its authority are a best-practice construct (the underlying duty is the PCBU's HSWA duty of care)", "Establish, monitor, and uplift the site (Plan-Do-Check-Act); lead the TTM team"],
        ["Other TTM workers / operational team members", "HSWA 2015 s45; NZGTTM (2023) Other TTM workers", "Take reasonable care for own/others' safety; comply with reasonable instructions", "Be qualified, even where a contractor could otherwise use untrained labour"]
      ]},
      { type: "callout", style: "info", text: "Notice the pattern: the genuine regulatory floor is thin and general — a handful of statutory powers and a general duty of care. Almost everything that makes New Zealand TTM operationally recognisable — the STMS's authority, TMP documentation, risk registers, the peer review system — is best-practice architecture that NZGTTM now defines, having taken over from a retired CoPTTM system with a different, more prescriptive shape. Meeting the statutory floor is the legal minimum. NZGTTM is how the industry actually delivers on it today." }
    ]
  },

  {
    id: "summary",
    kind: "info",
    nav: "Summary",
    title: "Summary",
    minutes: 3,
    body: [
      { type: "p", text: "New Zealand's TTM system has a thin regulatory floor, and a best-practice structure built on top of it that is now defined entirely by NZGTTM. The regulatory floor comes only from Acts and Land Transport Rules: HSWA 2015's duty of care, the Traffic Control Devices Rule's authorisation powers, the Local Government and Government Roading Powers Acts' road-control powers, the Setting of Speed Limits Rule, and the Railways Act. CoPTTM (4th edition, 2018) has been retired — Road Controlling Authorities stopped accepting CoPTTM-based TMPs from 1 July 2026, after a phase-in that began in November 2025. NZGTTM (2023) is Waka Kotahi's current, explicitly best-practice, risk-based guide, and the sole reference this course uses for anything above the regulatory floor." },
      { type: "p", text: "Every specific TTM role — TTM Planner, STMS, operational team member — is an NZGTTM construct, not a statutory office. Roles CoPTTM used to warrant separately, like Traffic Controller or Traffic Management Coordinator, no longer exist in that form. Authority on site is real and important, but it exists because the industry, and the RCAs who contract with it, built and adopted NZGTTM's system — not because Parliament created it." },
      { type: "list", ordered: true, items: [
        "Health and Safety at Work Act 2015 — the one duty of care every PCBU and every worker genuinely holds by law",
        "Traffic Control Devices Rule 2004 / GRPA 1989 / LGA 1974 & 2002 / Setting of Speed Limits Rule 2022 — the specific statutory powers to authorise devices, closures, and speed limits",
        "NZGTTM (2023) — Waka Kotahi's current, explicitly best-practice, risk-based guide, defining the TTM Planner, STMS, and operational team member roles, and the peer review and documentation system around them",
        "WorkSafe guidance and Road to Zero — supporting best-practice context for interpreting “reasonably practicable”",
        "CoPTTM (4th edition, 2018) — retired since 1 July 2026; referenced only for historical context on terms and practices NZGTTM has replaced"
      ]},
      { type: "callout", style: "key", text: "Carry this forward: for any TTM duty you take on, or hand off, ask two questions. First, can I point to the actual Act or Rule that requires this — or is it NZGTTM's best-practice system? Second, if it's best practice, has my organisation, or the RCA I'm contracted to, made it binding anyway — and am I meeting it as if it were?" }
    ]
  }
];

var QUIZ = [
  {
    q: "What is the current status of CoPTTM (Code of Practice for Temporary Traffic Management, 4th edition, 2018)?",
    options: [
      "It remains the current mandatory standard, unchanged",
      "It has been retired — Road Controlling Authorities phased in NZGTTM from 1 November 2025 and stopped accepting CoPTTM-based TMPs from 1 July 2026",
      "It was replaced by the Health and Safety at Work Act 2015",
      "It only ever applied to state highways, so its status doesn't affect local roads"
    ],
    correct: 1,
    explain: "CoPTTM has been retired. Road Controlling Authorities began accepting NZGTTM-based Corridor Access Requests and TMPs from 1 November 2025, and CoPTTM-based TMPs are no longer accepted anywhere in New Zealand from 1 July 2026. NZGTTM is now the sole current framework."
  },
  {
    q: "Which duty sits directly on every PCBU involved in TTM, underneath every specific role?",
    options: [
      "The duty of care under the Health and Safety at Work Act 2015 to eliminate or minimise risk so far as reasonably practicable",
      "A duty to always choose the lowest-cost traffic control option",
      "A duty owed only to their own employees, not to road users",
      "A duty that only applies to Road Controlling Authorities"
    ],
    correct: 0,
    explain: "HSWA 2015 places a duty of care on every PCBU — for their workers and for anyone else affected by their work, including road users — to eliminate or minimise risk so far as reasonably practicable. This is the one genuine regulatory foundation under every TTM role, and it is unaffected by the move from CoPTTM to NZGTTM."
  },
  {
    q: "Who has the statutory power to authorise the installation and operation of traffic control devices on a given road?",
    options: [
      "Any contractor working on the road",
      "The Site Traffic Management Supervisor on duty that day",
      "The Road Controlling Authority (RCA), under the Traffic Control Devices Rule 2004",
      "WorkSafe NZ exclusively"
    ],
    correct: 2,
    explain: "The Traffic Control Devices Rule 2004, section 2.1, gives the Road Controlling Authority the power (and duty) to authorise the installation, operation, and removal of traffic control devices. This is one of the few genuinely statutory powers in the whole system."
  },
  {
    q: "Under NZGTTM's peer review system, what is a risk reviewer's role?",
    options: [
      "To approve the risk assessment on the RCA's behalf, as a statutory sign-off",
      "To provide improvement recommendations to the contractor PCBU, rather than approve the layout — a deliberate move away from the old, now-retired CoPTTM approver function",
      "To design the TMP themselves",
      "Risk review has been abolished under NZGTTM"
    ],
    correct: 1,
    explain: "NZGTTM is explicit that the risk reviewer does not approve the risk assessment; they provide recommendations. This is a deliberate shift away from CoPTTM's old approver function, which no longer applies now that CoPTTM has been retired."
  },
  {
    q: "What did NZGTTM discontinue from CoPTTM's approach to classifying roads?",
    options: [
      "Nothing — road levels (LV, 1, 2, 3) are still used exactly as before",
      "CoPTTM's road-level classification system — NZGTTM instead requires a risk assessment for each site, making the old levels unnecessary",
      "The requirement for any traffic management at all on local roads",
      "The RCA's authority to approve temporary speed limits"
    ],
    correct: 1,
    explain: "NZGTTM explicitly states that by undertaking a risk assessment for each site, road levels are no longer necessary — a clear example of the shift from CoPTTM's prescriptive, level-based approach to NZGTTM's risk-based one."
  },
  {
    q: "What are the three primary functions of the STMS according to NZGTTM?",
    options: [
      "Design, approve, and audit the TMP",
      "Establish the site, monitor the site, and uplift the site",
      "Draft contracts, manage budgets, and hire staff",
      "Issue infringement notices, prosecute offenders, and set speed limits"
    ],
    correct: 1,
    explain: "NZGTTM describes the STMS's three primary functions as establishing the site consistent with the TMP, monitoring the site's effectiveness, and uplifting the site once work is complete — the Plan-Do-Check-Act cycle applied to the worksite."
  },
  {
    q: "Which of these is true about the STMS role and its limits under NZGTTM, now that CoPTTM has been retired?",
    options: [
      "The STMS role, and all its operational limits (such as fixed travel-time radii), are created directly by an Act of Parliament",
      "The STMS role and its authority are a best-practice construct defined by NZGTTM; CoPTTM's old fixed numeric limits (like a set travel-time radius) are not carried over, and are instead left to the contractor PCBU's own risk-based judgement",
      "The STMS may now amend temporary speed limits without any RCA approval",
      "NZGTTM has abolished the STMS role entirely"
    ],
    correct: 1,
    explain: "There is no Act or Rule that creates the STMS role or its authority — that is NZGTTM's best-practice system, successor to CoPTTM's retired one. NZGTTM does not carry over CoPTTM's fixed numeric limits (such as travel-time radii); those judgements now sit with the contractor PCBU's own risk assessment. The one genuine regulatory limit that remains is that TSLs still require RCA approval under the Setting of Speed Limits Rule."
  },
  {
    q: "Why does NZGTTM warn that high-visibility clothing should not be over-relied upon?",
    options: [
      "Because hi-vis has no basis in any requirement at all",
      "Because hi-vis sits at the bottom of the hierarchy of controls — it is the least effective risk-mitigation measure and not a substitute for engineered and procedural controls",
      "Because hi-vis garments are being phased out of TTM entirely",
      "Because only the STMS is required to wear it"
    ],
    correct: 1,
    explain: "NZGTTM explicitly places high-visibility clothing at the bottom of the hierarchy of controls. The general duty to follow reasonable safety instructions (such as wearing PPE) is genuinely regulatory under HSWA s45, but the specific garment and its limits as a control come from NZGTTM, and must not be treated as a substitute for higher-order engineering and procedural controls."
  },
  {
    q: "Under NZGTTM, what happens if a contractor chooses to use unqualified, untrained, or volunteer TTM workers?",
    options: [
      "Nothing — NZGTTM has no expectations about worker qualifications",
      "The contractor must manage the resulting risk itself, for example by adding an extra trained STMS to provide leadership",
      "This is automatically illegal under the Health and Safety at Work Act",
      "Only the RCA can decide whether unqualified workers are used"
    ],
    correct: 1,
    explain: "NZGTTM's \"Other TTM workers\" guidance expects all TTM workers to be qualified, but where a contractor does use unqualified, untrained, or volunteer workers, it must manage the resulting risk itself — for example, by adding extra trained STMS leadership. This is best-practice guidance, not a standalone statutory rule."
  },
  {
    q: "Which statement best captures the relationship between NZGTTM, CoPTTM, and New Zealand law today?",
    options: [
      "NZGTTM is itself an Act of Parliament that directly regulates TTM",
      "The genuine regulatory floor comes only from HSWA 2015 and the Traffic Control Devices Rule/LGA/GRPA/Setting of Speed Limits Rule. NZGTTM (2023) is Waka Kotahi's current best-practice, risk-based guide sitting above that floor, having fully replaced the now-retired CoPTTM (4th edition, 2018) as of 1 July 2026",
      "CoPTTM remains the current standard and NZGTTM is only a discussion draft",
      "NZGTTM overrides the Health and Safety at Work Act 2015"
    ],
    correct: 1,
    explain: "The regulatory floor in NZ TTM is thin and comes only from Acts and Rules. NZGTTM (2023) is Waka Kotahi's current, non-statutory best-practice guide, and it has fully replaced CoPTTM (4th edition, 2018), which is retired as of 1 July 2026. NZGTTM gains real-world force mainly through RCAs writing compliance with it into contracts and authorisations, not through legislation."
  },
  {
    q: "Does Waka Kotahi (NZTA) currently issue TTM warrants, such as an STMS or Traffic Management Operative (TMO) warrant?",
    options: [
      "Yes — warrants are still issued and are simply renamed under NZGTTM",
      "No — Waka Kotahi stopped administering the STMS and TMO warrant categories from 1 November 2024 (the Inspector warrant followed on 1 July 2025); competency is now evidenced through NZQA unit standards delivered by registered training providers",
      "Yes, but only for the Traffic Controller (TC) role",
      "No — no TTM competency evidence exists at all any more"
    ],
    correct: 1,
    explain: "The CoPTTM-era warrant system was retired in stages: Waka Kotahi ceased administering the TMO, TMO-NP, STMS Universal, and STMS (A/B/C)/(A/B/C)-NP warrants from 1 November 2024, and the Inspector warrant from 1 July 2025 — physical warrant ID cards were discontinued at the same time. Competency is now evidenced through NZQA unit standards (31958–31963) delivered by registered training providers such as Connexis, under the TTM Credentials Framework being developed by Waihanga Ara Rau with the Temporary Traffic Management Industry Steering Group (TTM-ISG). This is a genuinely best-practice, industry-and-Waka-Kotahi-built system — not a Waka Kotahi-issued warrant, and not a statutory licence."
  }
];
