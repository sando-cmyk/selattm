// ============================================================================
// File: build-all.js
// Project: SELA Civil Advisory Ltd (SELA TTM)
// Description: Pre-build script that scans /public/courses for modular slide decks,
//              auto-generates /public/data/courses.json, and validates assets.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COURSES_DIR = path.join(__dirname, 'public', 'courses');
const DATA_DIR = path.join(__dirname, 'public', 'data');
const OUTPUT_JSON = path.join(DATA_DIR, 'courses.json');

// Folders under /public/courses that are NOT sellable training modules and
// must never be auto-scaffolded into the catalog with a placeholder price:
//   - "subs"               -> the $0.99 PDF book, sold via its own Stripe
//                              Payment Link, not through the course store.
//   - "ASHTAS_Operative V6" -> a newer build of the ASHTAS course not yet
//                              chosen as canonical. Add it here once it is.
const EXCLUDED_FOLDERS = ['subs', 'ASHTAS_Operative V6'];

/**
 * Traverses /public/courses, reads manifests or creates fallback descriptors,
 * and compiles the master catalog JSON.
 */
export function scanAndBuildCatalog() {
  console.log('----------------------------------------------------');
  console.log('🔍 SELA TTM Build: Scanning /public/courses modules...');
  console.log('----------------------------------------------------');

  // Ensure directories exist
  if (!fs.existsSync(COURSES_DIR)) {
    console.log('📁 Creating missing /public/courses directory...');
    fs.mkdirSync(COURSES_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_DIR)) {
    console.log('📁 Creating missing /public/data directory...');
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const courseFolders = fs.readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => {
      if (EXCLUDED_FOLDERS.includes(name)) {
        console.log(` \u23ED\uFE0F  Skipping [${name}] -- not a sellable course (see EXCLUDED_FOLDERS).`);
        return false;
      }
      return true;
    });

  const catalog = [];

  for (const folder of courseFolders) {
    const manifestPath = path.join(COURSES_DIR, folder, 'course-manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf8');
        const data = JSON.parse(raw);

        // Guard against a malformed manifest (e.g. wrapped in an array)
        // silently corrupting the whole catalog -- this happened before:
        // an array-wrapped manifest produced a double-nested courses.json
        // that broke every page reading it.
        if (Array.isArray(data) || typeof data !== 'object' || data === null) {
          console.error(` \u274C  ${manifestPath} must be a single JSON object, not an array. Skipping [${folder}] -- fix the manifest and re-run.`);
          continue;
        }

        // Default launch path if omitted
        if (!data.launchPath) {
          data.launchPath = `/courses/${folder}/index.html`;
        }
        if (!data.id) {
          data.id = folder;
        }

        catalog.push(data);
        console.log(` \u2705 Loaded manifest: [${data.id}] ${data.title || folder}`);
      } catch (err) {
        console.error(` \u274C Error reading ${manifestPath}: ${err.message}`);
      }
    } else {
      // Auto-scaffold standard course object for folders without a manifest
      const formattedTitle = folder
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const fallbackEntry = {
        id: folder,
        code: folder.toUpperCase(),
        title: formattedTitle,
        description: `Standard modular training program for ${formattedTitle}.`,
        category: "TTM Training",
        price: 250.00,
        currency: "NZD",
        status: "active",
        launchPath: `/courses/${folder}/index.html`,
        lastUpdated: new Date().toISOString()
      };

      catalog.push(fallbackEntry);
      console.log(` ⚠️ No manifest found for [${folder}]. Auto-generated catalog entry.`);
    }
  }

  // Write master JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('----------------------------------------------------');
  console.log(`✨ Generated: ${OUTPUT_JSON} (${catalog.length} courses total)`);
  console.log('----------------------------------------------------\n');
}

// Run scanner
scanAndBuildCatalog();