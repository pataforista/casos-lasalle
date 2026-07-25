const fs = require('fs');
const path = require('path');

const originalPackPath = path.join(__dirname, '../data/packs/cases_real_v1.json');
const modifiedCasesPath = path.join(__dirname, 'modified_cases.json');
const finalPackPath = path.join(__dirname, '../data/packs/cases_real_v1_final.json');
const manifestPath = path.join(__dirname, '../data/manifest_v1.json');

// The 8 cases to eliminate as explicitly stated by the user
const idsToRemove = [
  "EDU_02_CLASS",
  "REAL_GEN_HIST_001_B",
  "REAL_GEN_SCH_002_B",
  "REAL_GEN_ADHD_002_B",
  "REAL_GEN_DELIR_002_B",
  "REAL_GEN_BIP_002_B",
  "REAL_GEN_ASD_002_B",
  "REAL_GEN_PTSD_002_B"
];

function run() {
  console.log("Loading original cases...");
  const originalCases = JSON.parse(fs.readFileSync(originalPackPath, 'utf8'));
  console.log(`Loaded ${originalCases.length} original cases.`);

  console.log("Loading modified cases...");
  const modifiedCases = JSON.parse(fs.readFileSync(modifiedCasesPath, 'utf8'));
  console.log(`Loaded ${modifiedCases.length} modified cases.`);

  let finalCases = [];
  let replacedCount = 0;
  let removedCount = 0;
  let addedCount = 0;

  // Process original cases
  for (const c of originalCases) {
    if (idsToRemove.includes(c.case_id)) {
      removedCount++;
      continue; // Skip, do not include
    }

    // Check if this case was modified
    const modifiedMatch = modifiedCases.find(mc => mc.case_id === c.case_id);
    if (modifiedMatch) {
      finalCases.push(modifiedMatch);
      replacedCount++;
    } else {
      finalCases.push(c);
    }
  }

  // Add any NEW cases from modifiedCases that weren't in original (like HOSP_021_TDPM)
  for (const mc of modifiedCases) {
    if (idsToRemove.includes(mc.case_id)) {
      continue; // do not add if it's meant to be eliminated
    }
    const exists = finalCases.find(fc => fc.case_id === mc.case_id);
    if (!exists) {
      finalCases.push(mc);
      addedCount++;
    }
  }

  console.log(`Removed: ${removedCount}`);
  console.log(`Replaced: ${replacedCount}`);
  console.log(`Added: ${addedCount}`);
  console.log(`Final case count: ${finalCases.length}`);

  if (finalCases.length !== 87) {
    console.error(`ERROR: Expected 87 cases, got ${finalCases.length}`);
  }

  // Validate for duplicates
  const idSet = new Set();
  let hasDuplicates = false;
  for (const c of finalCases) {
    if (idSet.has(c.case_id)) {
      console.error(`ERROR: Duplicate case_id found: ${c.case_id}`);
      hasDuplicates = true;
    }
    idSet.add(c.case_id);
  }
  
  if (hasDuplicates) {
    console.error("Aborting due to duplicates.");
    process.exit(1);
  }

  // Save the new pack
  fs.writeFileSync(finalPackPath, JSON.stringify(finalCases, null, 2));
  console.log(`Saved final pack to ${finalPackPath}`);

  // Generate new manifest
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    manifest = {
      version: "1.0",
      name: "Casos Lasalle (Versión Pregrado)",
      description: "Banco de casos clínicos alineados al syllabus y enfocados en diagnóstico y manejo inicial.",
      index: [{ pack: "", cases: [] }]
    };
  }

  // Handle both array format and object format for manifest
  let manifestObj = Array.isArray(manifest) ? { version: "1.1", index: manifest } : manifest;
  if (!manifestObj.index || manifestObj.index.length === 0) {
     manifestObj.index = [{}];
  }

  manifestObj.total_cases = finalCases.length;
  manifestObj.index = [
    {
      pack: "packs/cases_real_v1_final.json",
      cases: finalCases.map(c => ({
        id: c.case_id,
        title: c.title || c.display_title
      }))
    }
  ];

  fs.writeFileSync(manifestPath, JSON.stringify(manifestObj, null, 2));
  console.log(`Saved manifest to ${manifestPath}`);
}

run();
