const fs = require('fs');
const path = require('path');

const casesFile = path.join(__dirname, '../data/cases_v1.json');
const correctionsFile = path.join(__dirname, '../data/casos_corregidos_usuario.json');

try {
  let mainCases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
  const corrections = JSON.parse(fs.readFileSync(correctionsFile, 'utf8'));

  let updatedCount = 0;
  let addedCount = 0;

  for (const caseData of corrections) {
    const existingIndex = mainCases.findIndex(c => c.case_id === caseData.case_id);
    if (existingIndex !== -1) {
      mainCases[existingIndex] = caseData;
      updatedCount++;
    } else {
      mainCases.push(caseData);
      addedCount++;
    }
  }

  fs.writeFileSync(casesFile, JSON.stringify(mainCases, null, 2));
  console.log(`Merge complete: ${updatedCount} updated, ${addedCount} added.`);
} catch (e) {
  console.error('Error merging:', e);
}
