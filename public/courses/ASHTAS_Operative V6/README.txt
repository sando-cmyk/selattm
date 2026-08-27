ASHTAS Operative Training — Web/HTML delivery package
======================================================

WHAT THIS IS
------------
This is the ASHTAS Operative Training course (56 slides, 4 check-in
quizzes, narrated audio, menu and completion pages), converted for
direct web hosting — no LMS (Moodle, etc.) required.

HOW TO HOST IT
--------------
This is a static site: plain HTML, CSS, JS, images and audio files with
no server-side code or database. To publish it:

1. Upload the entire contents of this folder (keeping the folder
   structure intact — audio/, css/, js/, slides/, and all the .html
   files) to any static web host: your own server, S3/CloudFront,
   Netlify, Vercel, GitHub Pages, cPanel, etc.
2. Set menu.html as the entry point / index page (rename a copy to
   index.html if your host requires that filename specifically).
3. That's it — everything else is relative links, so it works from any
   folder or subdomain path.

WHAT WORKS OUT OF THE BOX
--------------------------
- Full slide-by-slide navigation with Previous/Next.
- Narrated audio per slide with a transcript fallback.
- Four in-course check-in quizzes (self-marked, instant feedback).
- A progress bar, "resume where you left off" banner, and "Viewed"
  badges on the module menu — these now persist via the browser's
  localStorage when opened as a plain website (previously they only
  worked when launched from inside a SCORM-compliant LMS).

NOTE ON PROGRESS TRACKING
--------------------------
Because progress is stored in the visitor's own browser (localStorage),
it is per-device/per-browser — it will not follow a learner if they
switch devices or clear their browser data, and it won't appear in a
central gradebook. If you need centrally-tracked completion and scoring
(e.g. for compliance records), keep using the original SCORM package
inside an LMS such as Moodle instead — imsmanifest.xml is still included
here and this same package remains SCORM 1.2 compatible for that
purpose.

TWO EXTERNAL VIDEO EMBEDS
--------------------------
slide25.html and slide26.html embed two YouTube videos (crash test
footage and barrier system parts). These require the viewer to have
internet access and for YouTube not to be blocked on their network —
worth checking if the course will be viewed on a restricted corporate
network.

CONTENT LICENSING
------------------
Per the footer on every page: "© Lantra — ASHTAS Operative Training
material, reproduced under licence for internal Moodle delivery." Check
that your licence with Lantra/Austroads permits this direct web-hosted
distribution mode before publishing it outside Moodle.
