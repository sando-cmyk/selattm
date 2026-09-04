# Course Build Spec — required structure for any course delivered to Sela

*For Joseph, and anyone else building or supplying course content for selattm.com. If a delivered course doesn't follow this, it goes back for rework before it's added to the site — this document is the standard we're checking it against.*

## Why this exists

Right now the site's five live courses were each built as one-off batches of HTML files, and every single page in a course has its own copy-pasted header. In the portable traffic signals course alone, the same header markup is duplicated across 36 separate files. Six different courses each carry their own, slightly different stylesheet. That's not a style complaint — it's why a real bug went unnoticed until a learner hit it: the header wraps badly on a phone screen, eating most of the viewport and pushing the Next/Submit button far down the page, and because that CSS rule exists six separate times, fixing it means finding and fixing it six separate times, forever, as more courses get added. A header or footer should never be something one page has and another doesn't, or something one course styles differently from another. It's the same header everywhere, defined once.

This document sets the standard going forward: a small shared kit (one CSS file, two JS files) that every course page includes, plus a fixed page structure. Follow it and a course needs almost no custom code beyond its actual content — no per-page header markup, no hand-written progress tracking, no per-course mobile-layout guesswork.

## The shared kit

Three files, already built and live in the site's `public/` folder — never copied into a course folder, always referenced from it:

- `/css/course-base.css` — every visual rule: header, buttons, layout, quiz styling, and the mobile behaviour that makes the site usable on a phone. A course adds its own CSS file only for things this one has no opinion about (e.g. a diagram's background colour) — never to redefine the header, buttons, or layout.
- `/js/course-header.js` — renders the header. A page contributes one line: `<div id="course-header" data-title="...">`. Nobody writes header HTML by hand, ever.
- `/js/course-progress.js` — tracks progress. A slide page needs a `data-slide="N"` attribute on `<body>` and nothing else; visiting the page is enough. A quiz page's own answer-checking logic (which necessarily differs quiz to quiz) calls one function, `CourseProgress.recordQuiz(score, total)`, when the learner submits, and everything else — saving, resuming, pass/fail at 80%, whether the whole course is complete — is handled centrally.

Reference templates showing exactly how a page should look are in `public/course-kit/`: `slide-template.html`, `quiz-template.html`, `complete-template.html`. Copy one of these as the starting point for a new page — don't build a page from scratch.

## Required structure

**Every page's `<head>`** links the shared stylesheet and nothing else course-wide (a page-specific stylesheet is fine to add *in addition*, never instead of):

```html
<link rel="stylesheet" href="../../css/course-base.css">
```

**Every page's `<body>` tag** carries the course's identity as data attributes — the same values on every page of that course:

```html
<body data-course-id="your-course-id"
      data-course-total-slides="30"
      data-course-quiz-ids="quiz1,quiz2,quiz3,quiz4">
```

**A slide page** additionally carries `data-slide="N"` and needs no other tracking code. Its content goes in a `.container > .slide-image-wrap` (image or video) plus an optional `.narration-panel` if it has audio — see `slide-template.html`.

**A quiz page** additionally carries `data-quiz="quizN"`. Questions are `.quiz-question` blocks with a `data-answer` index; the submit handler in `quiz-template.html` is copied as-is — the only thing that changes per quiz is the questions themselves.

**The header**, on every page without exception:

```html
<div id="course-header" data-title="Slide 2: Course Overview"></div>
```

**Scripts**, at the bottom of every slide/quiz/completion page, in this order:

```html
<script src="../../js/course-header.js"></script>
<script src="../../js/course-progress.js"></script>
```

(Adjust the `../../` to the file's actual depth under `public/` — same convention already used for `firebase-init.js` elsewhere on the site.)

**The completion page** follows `complete-template.html` exactly, with only the `courseId`/`courseCode`/`courseTitle`/`data-course-*` values changed for that course. This is what makes a course's results show up in `admin.html`'s Results & Certificates panel — skipping or altering this pattern means a course that looks finished but produces no usable completion record, which is exactly the bug just found and fixed in PTS-01.

## Mobile is not optional

Every page must be checked on a narrow phone width (390px or so) before being called done: the header should sit as one compact row, and the Next/Submit button should be reachable without excessive scrolling. `course-base.css` already handles the header; a course's own content (long paragraphs, big images, wide tables) is still the course builder's responsibility to keep phone-friendly.

## What happens if this isn't followed

A course delivered with its own header markup, its own duplicate stylesheet, or hand-rolled progress tracking doesn't get added to the live catalog. It goes back for rework against this spec first. This isn't about style preference — it's what makes a header fix take one edit instead of thirty-six, and what makes sure a course's results actually reach the certificate system instead of silently going nowhere.

## Migration status of the five pre-existing courses

**PTS-01 (Portable Traffic Signals)** is now fully migrated onto this exact kit — every one of its 38 pages uses `course-base.css` / `course-header.js` / `course-progress.js` as described above. No user had completed or paid for this course yet, so it was retrofitted directly rather than left as a special case.

**ASHTAS-01** is a genuine SCORM package built to run inside Moodle — progress and completion are reported through the LMS's own suspend-data mechanism (`js/scorm_api.js` / `js/course.js`), not through `CourseProgress`/Firestore, and it was already using a single shared stylesheet and a single shared `course.js` across all 62 pages before this kit existed. Forcing it onto `course-base.css` would mean re-skinning a course that's actually fine visually and changing how it talks to Moodle — neither is wanted. Instead it got a matching but separate fix: `public/courses/ashtas-01/js/ashtas-header.js` now renders its header and footer from `<div id="ashtas-header" data-subtitle="...">` and `<div id="ashtas-footer"></div>` mounts, so none of its 62 pages hand-write that markup any more — same principle (one definition, injected, never duplicated), implemented to match ASHTAS's own design and LMS wiring rather than PTS-01's. Its mobile layout was already fine and needed no CSS changes.

**NZGTTM Essentials, TTM Engineering Essentials, and TTM Roles & Responsibilities** are single-page-app style courses (one `index.html` + one `app.js`, JS-driven "screens") and don't have PTS-01's per-page-header problem in the first place, so this kit doesn't apply to them structurally.

Checked all three live on a phone-width browser: NZGTTM Essentials and TTM Roles & Responsibilities were already properly responsive (each has its own real mobile breakpoints in `css/style.css`) and needed nothing. **TTM Engineering Essentials had a genuine mobile bug** -- its `styles/style.css` had no media queries at all, so its fixed 264px sidebar plus several fixed multi-column grids (cards, the final-test result, quiz options) pushed content off-screen and made Back/Next unreachable without scrolling past cut-off text. Fixed with a mobile media query added to that one file: the sidebar stacks above the content instead of sitting beside it, the 35-item slide list becomes a short scrollable strip instead of pushing everything else down the page, every multi-column grid collapses to fewer columns, and Back/Next are pinned to the bottom of the screen the way the other courses already do it. No HTML or JS changed. Verified by injecting the new CSS into the live (pre-fix) page in a mobile-width browser and clicking through a title slide, a quiz question, a quiz answer, a 3-column card grid, and the final test result -- all rendered correctly before this was ever deployed.

This spec governs course content delivered from now on.
