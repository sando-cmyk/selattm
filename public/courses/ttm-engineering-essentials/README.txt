SELA CIVIL ADVISORY — TTM ENGINEERING ESSENTIALS (NARRATED SLIDE DECK)
Standalone web/HTML build — no LMS required
=========================================================================

WHAT THIS IS
------------
A 35-slide, self-contained website version of the "Core Engineering
Concepts of TTM in New Zealand" course — 23 narrated content slides
covering the seven engineering concepts and five sources (with 5 short,
ungraded "quick check" questions woven through), followed by a
10-question graded Final Test, and a closing slide. This build is plain
HTML/CSS/JS: no SCORM, no LMS, no server-side code, and no database. Open
index.html in a browser and it runs.

This is the same course as the SCORM/Moodle package, with one difference
under the hood: instead of reporting progress to an LMS, this build saves
progress in the learner's own browser (see "HOW PROGRESS IS SAVED" below).
If you need proper per-user completion records for compliance or
gradebook purposes, use the SCORM package in an LMS instead — see that
package's own README for Moodle upload steps.

HOW TO HOST THIS
-----------------
This is a static website — any of the following will work:
- Upload the whole folder (with index.html at the root) to your existing
  website via FTP/cPanel/hosting file manager, e.g. as a subfolder like
  selacivil.co.nz/training/ttm-essentials/
- Drag-and-drop the folder onto a static host such as Netlify or
  Cloudflare Pages, or push it to GitHub Pages.
- Host it behind a simple paywall or checkout page if you're selling
  access — e.g. only reveal/email the link after payment, or put it
  behind a members-only area of your site. This build has no login or
  payment logic built in, so access control has to be handled at the
  hosting/delivery layer (a private link, a "buy now" page that unlocks
  it, a members' area, etc.).
- You can also just open index.html directly from a folder on a laptop
  (e.g. for an in-person session on a device without internet) — it
  still works, though narration autoplay and saved progress behave best
  when served over http(s) rather than opened as a bare local file.

There's nothing to build or compile — it's ready to upload as-is.

HOW PROGRESS IS SAVED (AND ITS LIMITS)
-----------------------------------------
There's no LMS behind this build, so progress and the Final Test result
are saved in the learner's own browser (localStorage), tied to that
specific browser and device:
- Closing the tab and coming back later in the same browser resumes
  where they left off, and remembers whether they passed the Final Test.
- Clearing browser data, using a private/incognito window, or switching
  to a different browser or device resets progress — there is no account
  system and nothing is recorded anywhere else.
- There is no way for you (Sela) to see who has completed the course,
  pull a pass list, or produce a tamper-evident completion record from
  this build alone. If a customer needs proof of completion (e.g. for
  their own H&S records), the honest options are: (a) point them to the
  SCORM package running in an LMS instead, which reports real per-user
  completion, or (b) we add a lightweight completion certificate/export
  feature to this web build — happy to build that if useful, just say
  the word.
- A "↺ Restart course" link sits at the bottom of the sidebar, since
  there's no LMS to reset an attempt from — clicking it (with
  confirmation) clears saved progress and the Final Test result on that
  device and starts over from the welcome slide.

THE FINAL TEST AND COMPLETION
--------------------------------
- 10 questions, drawn from across all seven concepts and the five sources.
- The learner must select an answer before Next unlocks on each test
  question — jumping ahead via the sidebar is still possible, but simply
  scores as incorrect, so there's no way to "beat" the test by skipping.
- The pass mark is 80% (8 out of 10 correct).
- The Test Result slide shows the score, a pass/fail banner, and a full
  question-by-question review (their answer, the correct answer where
  they got it wrong, and a short explanation).
- Below 80%, a "Retake the test" button resets their answers and jumps
  back to Question 1 — unlimited attempts.

NARRATION AUDIO
----------------
All 23 content slides (Welcome through Summary, plus the closing "Thank
you" slide) have narration recorded — the audio/ folder is complete.
Narration auto-plays as soon as each slide opens. Browsers generally
block audio autoplay before the learner has clicked anything on the page,
so the very first slide may need one manual press of play — every slide
after that autoplays normally, since clicking Next or a sidebar item
counts as the interaction browsers require. Player controls stay visible
throughout so learners can pause, rewind, or replay.

The `narration-scripts` folder keeps the original 23 scripts as plain
text, in case you want to re-record or tweak any of them later. To
replace one: rewrite/re-record it, export as MP3, name the file to match
the slide's audio stem exactly (see the list below), and drop it into the
`audio` folder, overwriting the existing file — no other changes needed.

The 23 filename stems, in slide order, are:
  01-title
  02-roadmap
  03-what-is-nzgttm
  04-concept1-risk-based-design
  05-quickcheck1-question
  06-quickcheck1-answer
  07-concept2-ttm-as-road-design
  08-concept3-geometric-design
  09-concept4-traffic-engineering
  10-quickcheck2-question
  11-quickcheck2-answer
  12-concept5-safety-engineering
  13-concept6-equipment-engineering
  14-quickcheck3-question
  15-quickcheck3-answer
  16-concept7-specialist-projects
  17-quickcheck4-question
  18-quickcheck4-answer
  19-sources
  20-quickcheck5-question
  21-quickcheck5-answer
  22-summary
  23-closing

FOLDER STRUCTURE
-----------------
  index.html                Course shell (sidebar nav, audio bar, slide area) — upload this at your site root/subfolder
  styles/style.css          All course styling
  scripts/
    progress-store.js        Browser-based (localStorage) progress/completion tracking
    slide-data.js            All slide content, structure, quick-check quiz data,
                              and the 10-question Final Test data
    app.js                   Renderer / navigation / progress / test-scoring logic
  assets/                    Sela logo + icon set used across the slides
  audio/                     All 23 narration MP3s
  narration-scripts/         23 .txt files — the original narration scripts, kept for reference
  README.txt                 This file

QUESTIONS
---------
For questions about this course package, contact Sela Civil Advisory Limited.
