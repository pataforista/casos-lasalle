const fs = require('fs');
const path = require('path');

const casesFile = path.resolve(__dirname, '../data/cases_v1.json');
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));

// Keywords and their generic clinical replacements
const replacements = [
  { kw: "Esquizofrenia", rep: "Psicosis y Criterios Clínicos" },
  { kw: "TDAH", rep: "Trastorno del Neurodesarrollo" },
  { kw: "Trastorno Bipolar", rep: "Trastorno del Afecto" },
  { kw: "Bipolar", rep: "Trastorno del Afecto" },
  { kw: "Depresión Mayor", rep: "Trastorno del Estado de Ánimo" },
  { kw: "Depresión", rep: "Trastorno del Estado de Ánimo" },
  { kw: "Depresivo", rep: "Trastorno del Estado de Ánimo" },
  { kw: "TOC", rep: "Ansiedad y Conductas Repetitivas" },
  { kw: "Trastorno de Pánico", rep: "Urgencias de Ansiedad" },
  { kw: "Pánico", rep: "Urgencias de Ansiedad" },
  { kw: "Fobia Social", rep: "Ansiedad y Fobias" },
  { kw: "Bulimia", rep: "Trastorno de la Conducta Alimentaria" },
  { kw: "Anorexia", rep: "Trastorno de la Conducta Alimentaria" },
  { kw: "TCA", rep: "Conducta Alimentaria" },
  { kw: "Síndrome Serotoninérgico", rep: "Toxicidad por Psicofármacos" },
  { kw: "Serotoninérgico", rep: "Reacción Adversa a Fármacos" },
  { kw: "Disfunción por ISRS", rep: "Efectos Adversos de Antidepresivos" },
  { kw: "Trastorno Límite", rep: "Rasgos de la Personalidad" },
  { kw: "TLP", rep: "Trastorno de la Personalidad" },
  { kw: "Trastorno Antisocial", rep: "Trastorno de la Personalidad" },
  { kw: "Catatonia", rep: "Alteraciones Psicomotoras" },
  { kw: "Ansiedad Generalizada (TAG)", rep: "Ansiedad y Preocupación" },
  { kw: "Ansiedad Generalizada", rep: "Ansiedad y Preocupación" },
  { kw: "TAG", rep: "Trastorno de Ansiedad" },
  { kw: "Trastorno de Adaptación", rep: "Reacción al Estrés Psicosocial" },
  { kw: "Trastorno de Conversión", rep: "Síntomas Neurológicos Funcionales" },
  { kw: "Trastorno Facticio", rep: "Producción Intencionada de Síntomas" },
  { kw: "Münchausen", rep: "Caso Clínico de Simulación" },
  { kw: "Abstinencia Alcohólica", rep: "Soporte de Abstinencia por Sustancias" },
  { kw: "Abstinencia", rep: "Soporte por Abstinencia" },
  { kw: "Duelo", rep: "Reacción ante Pérdidas Afectivas" },
  { kw: "Insomnio", rep: "Alteraciones del Ciclo Vigilia-Sueño"  },
  { kw: "Narcolepsia", rep: "Trastornos del Sueño y Alerta" },
  { kw: "Demencia Vascular", rep: "Trastorno Neurocognitivo Vascular" },
  { kw: "Demencia Frontotemporal", rep: "Trastorno Neurocognitivo Frontotemporal" },
  { kw: "Demencia", rep: "Trastorno Neurocognitivo" },
  { kw: "Neurocognitivo", rep: "Deterioro Cognitivo" },
  { kw: "Episodio Maníaco", rep: "Alteración Afectiva Aguda" },
  { kw: "Espectro Psicótico", rep: "Espectro de la Esquizofrenia" },
  { kw: "Wernicke", rep: "Urgencia Neuro-Nutricional" },
  { kw: "Agitación Aguda", rep: "Protocolo de Urgencias" },
  { kw: "Intoxicación", rep: "Urgencias por Sustancias o Fármacos" },
  { kw: "Sustancias", rep: "Consumo de Sustancias" },
  { kw: "TEA", rep: "Trastorno del Neurodesarrollo" },
  { kw: "Atracón", rep: "Trastorno Alimentario" }
];

let updatedCount = 0;

cases.forEach((c) => {
  // Check if any replacement keyword is in the title
  const hasSpoiler = replacements.some(r => c.title.toLowerCase().includes(r.kw.toLowerCase()));
  
  if (hasSpoiler) {
    // 1) Try to extract demographics from task instruction or vignette text
    const chunkText = c.source_chunks && c.source_chunks[0] ? c.source_chunks[0].text_content : '';
    const taskText = c.tasks && c.tasks[0] ? c.tasks[0].instruction : '';
    
    const r1 = /((?:paciente\s+)?(?:masculino|femenino|varón|hombre|mujer|joven|adolescente|niño|niña|anciano|anciana)\s+(?:de\s+)?\d+\s*(?:años|meses))/i;
    let match = taskText.match(r1) || chunkText.match(r1);
    
    let displayTitle = "";
    if (match) {
      let demo = match[1].trim();
      demo = demo.charAt(0).toUpperCase() + demo.slice(1);
      displayTitle = `Caso Clínico: ${demo}`;
    } else {
      // 2) Anonymise the title using replacement dictionary
      let tempTitle = c.title;
      replacements.forEach(r => {
        const regex = new RegExp(r.kw, 'gi');
        tempTitle = tempTitle.replace(regex, r.rep);
      });
      displayTitle = tempTitle;
    }
    
    // Add display_title
    c.display_title = displayTitle;
    updatedCount++;
  }
});

fs.writeFileSync(casesFile, JSON.stringify(cases, null, 2), 'utf8');
console.log(`✅ Se agregaron display_title neutros a ${updatedCount} casos en data/cases_v1.json`);
