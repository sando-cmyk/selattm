# NZGTTM-SA-01 TTM Site Assurance Assessor (online): go-live checklist

Updated 13 Nov 2026.

## What is being sold
- **Online course NZGTTM-SA-01: $295 + GST.** It includes a Sela certificate of completion and **12 months' access to the Sela assessment tools**. Sela sets up tools access after the learner marks the course complete; this step is manual.
- **Supervised field assessments: not sold on the platform, priced on request.** The price depends on travel and how many people are being assessed. `public/courses/nzgttm-sa-fa/index.html` is an information page with a quote-request form, which opens a pre-filled email to joseph@selacivil.co.nz. It's linked from slide 1, slide 34 and the completion page. Its `course-manifest.json` is marked `not-for-sale`. **Do not add it to courses-import.json.**
- **Endorsement:** when a client's learners pass both field sites, record the result in admin and issue the endorsement certificate. This step is manual.

## Course content (public/courses/nzgttm-sa-01/)
- 34 slides, 6 module checks, and a 20-question final drawn from a bank of 40, with completion going to `submissions`. Same pattern as NZGTTM-RA-01.
- Slide 1: welcome video `video/welcome.mp4` with captions (`welcome.vtt`) and a poster image. Slides 2–34: narration in `audio/mN/N.mp3`.
- Slide 34 was re-recorded on 13 Nov with the updated wording (tools included; field assessments priced on request).
- Check slide 20's recording: the auto-captions heard "stop work should be suggested" where the script says "stop work order".

## To go live
1. **Stripe:** done 13 Nov. Product `prod_VcLvAGptuUbgoB`, price `price_1Ub7E50flJvw3UeNZZuNJb3O` ($295 + GST). `course-manifest.json` is updated and set to active.
2. **courses-import.json:** add this entry, then run `node scripts/sync-courses.js`:
```json
{
  "id": "nzgttm-sa-01",
  "code": "NZGTTM-SA-01",
  "title": "TTM Site Assurance Assessor",
  "description": "Six-module online course for experienced TTM practitioners moving into independent site assurance: the NZGTTM assurance processes, who gets hurt at worksites, G1–G8 and Sela priority checks, site outcomes and Stop Work Orders, and writing findings that stand up. Includes 12 months' access to the Sela assessment tools. Supervised field assessments for Sela endorsement are available on request.",
  "category": "TTM Training",
  "price": 295,
  "currency": "NZD",
  "status": "active",
  "stripePriceId": "price_1Ub7E50flJvw3UeNZZuNJb3O",
  "launchPath": "/courses/nzgttm-sa-01/index.html"
}
```
3. **public/js/course-map.js:** add `"nzgttm-sa-01": { courseId: "nzgttm-sa-01", courseCode: "NZGTTM-SA-01", courseTitle: "TTM Site Assurance Assessor" },`
4. **public/store.html → GROUP_BY_ID:** add `"nzgttm-sa-01": "ttm",`
5. **public/js/course-summaries.js:** add this entry:
```js
  "nzgttm-sa-01": {
    format: "Online, self-paced · 6 modules, 34 narrated slides with a welcome video and 6 activities · approx. 1–1.5 hours · includes 12 months of Sela assessment tools",
    audience: "Experienced TTM practitioners (typically STMS level or equivalent) moving into independent site assurance, and client-side staff who want to understand how Sela assesses sites.",
    overview: "How to stand back from a site you did not build, judge whether it protects workers and road users, act on what you find, and report it so it stands up — using the NZGTTM assurance framework and 20 years of NZ worksite crash data.",
    covers: [
      "Where site assurance sits in the NZGTTM quality, assurance and control framework (A1–A6), and the assessor's duties",
      "Who gets hurt at NZ worksites: open roads, darkness, heavy vehicles, and cyclists and pedestrians (SELA-RPT-2026-006)",
      "Compliance versus risk, the hierarchy of controls, and testing whether the TMP fits the site (G7)",
      "Preparing for and carrying out a site assessment: G1–G8, Sela priority checks P1–P5, and evidence",
      "Site outcomes, rating findings, Stop Work Order triggers and the conversation with the STMS",
      "Writing findings, submitting reports, corrective action plans and verifying close-out",
    ],
    demonstrates: [
      "Identifies which NZGTTM assurance process applies and what it does not cover",
      "Uses crash evidence to focus assessment effort on the highest-risk features of a site",
      "Recognises Stop Work Order triggers and chooses safe, proportionate immediate actions",
      "Rates findings and site outcomes consistently with the NZGTTM outcome levels",
      "Writes findings with location, observation, risk, requirement, action and rating",
    ],
    assessment: "A knowledge check at the end of each of the 6 modules, then a 20-question final assessment drawn from a bank of 40. 80% required to pass each. Every slide must be completed in order. Supervised field assessments for Sela endorsement are available on request.",
  },
```
6. **Courses.txt:** add `nzgttm-sa-01	295	TTM Site Assurance Assessor	price_1Ub7E50flJvw3UeNZZuNJb3O`
7. Deploy (Craig), then do a signed-in test run and confirm the result appears in admin → Results & Certificates.

## Related material
The classroom version and the field assessment documents are in `Downloads\NZGTTM\Assessor Training Pack\`.
