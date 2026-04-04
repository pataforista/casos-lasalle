"use strict";

/**
 * Generator — Procedural Case Engine (Modular V2)
 * Crea casos infinitos mezclando bloques de construcción clínicos.
 */

const Generator = (() => {
  const NAMES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Jorge", "Lucía", "Mateo", "Valentina", "Andrés", "Camila"];
  const LAST_NAMES = ["Pérez", "García", "López", "Martínez", "Rodríguez", "González", "Hernández", "Sánchez", "Ramírez", "Cruz"];
  
  const AGES = ["19 años", "25 años", "34 años", "42 años", "58 años", "67 años", "75 años"];
  const CONTEXTS = [
    "en la sala de urgencias",
    "en consulta externa",
    "traído por paramédicos",
    "encontrado en la vía pública",
    "en la planta de medicina interna"
  ];

  // Módulos de Síntomas
  const SYMPTOM_MODULES = [
    {
      type: "Mania",
      title: "Crisis de Agitación: Manía",
      symptoms: [
        "Lleva 4 días sin dormir y tiene una energía inagotable.",
        "Habla tan rápido que es difícil entenderle (taquipsiquia).",
        "Dice ser el nuevo director del hospital y que comprará Microsoft mañana.",
        "Gasta dinero que no tiene en coches de lujo."
      ],
      correct: "Ingresar a Unidad de Psiquiatría (UCE)",
      distractors: ["Dar de alta con vitaminas", "Iniciar psicoterapia semanal", "Recetar Valeriana"],
      rationale: "La manía aguda con síntomas de grandeza y falta de sueño requiere contención en un entorno seguro para evitar riesgos financieros y físicos."
    },
    {
      type: "Depression",
      title: "Depresión Mayor Aguda",
      symptoms: [
        "No se ha levantado de la cama en dos semanas.",
        "Refiere que el mundo estarían mejor sin él/ella.",
        "Ha dejado de comer y ha perdido 5kg en un mes.",
        "Llora constantemente y no encuentra placer en nada."
      ],
      correct: "Evaluación de Riesgo e Internamiento",
      distractors: ["Cita de seguimiento en 1 mes", "Solo recomendar ejercicio", "Alta a domicilio sin supervisión"],
      rationale: "La depresión con anhedonia severa, pérdida de peso e ideación de muerte es una urgencia que requiere protección inmediata."
    },
    {
      type: "Psychosis",
      title: "Brote Psicótico Agudo",
      symptoms: [
        "Escucha voces que le dicen que la comida está envenenada.",
        "Cree que hay cámaras ocultas en sus ojos instaladas por la CIA.",
        "Presenta una conducta desorganizada, viste 4 abrigos en pleno verano.",
        "Mantiene una postura fija y no responde a estímulos."
      ],
      correct: "Antipsicóticos y Observación Estrecha",
      distractors: ["Psicoanálisis de apoyo", "Alta con benzodiacepinas", "Derivar a neurología únicamente"],
      rationale: "El brote psicótico requiere estabilización farmacológica rápida y un entorno que minimice los estímulos amenazantes."
    },
    {
      type: "Panic",
      title: "Crisis de Ansiedad / Pánico",
      symptoms: [
        "Siente que se va a morir de un infarto inminente.",
        "Presenta taquicardia, sudoración y falta de aire.",
        "Teme volverse loco o perder el control en este momento.",
        "Refiere hormigueo en las manos y opresión en el pecho."
      ],
      correct: "Abordaje de Ansiedad y Benzodiacepinas",
      distractors: ["Ingreso a Quirófano", "Cateterismo de urgencia", "Internamiento en Psiquiatría forzoso"],
      rationale: "El pánico es angustiante pero no letal. Descartar lo orgánico y tranquilizar al paciente con medidas farmacológicas leves es lo indicado."
    },
    {
      type: "Alcohol_Withdrawal",
      title: "Abstinencia: Delirium Tremens",
      symptoms: [
        "Tiembla intensamente y ve insectos subiendo por las paredes.",
        "Está desorientado en tiempo y espacio.",
        "Presenta sudoración profusa y agitación psicomotriz.",
        "Refiere que no ha bebido en 48 horas tras años de consumo diario."
      ],
      correct: "Hospitalización y Soporte (Benzodiacepinas/Tiamina)",
      distractors: ["Alta con consejos de sobriedad", "Antipsicóticos potentes como única terapia", "Enviar a Alcohólicos Anónimos hoy mismo"],
      rationale: "El Delirium Tremens tiene una mortalidad alta si no se trata médicamente en un hospital con soporte hidroelectrolítico y sedación."
    }
  ];

  function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function createCase() {
    const mod = getRandom(SYMPTOM_MODULES);
    const name = `${getRandom(NAMES)} ${getRandom(LAST_NAMES)}`;
    const age = getRandom(AGES);
    const context = getRandom(CONTEXTS);
    
    // Seleccionamos 2 síntomas aleatorios del módulo para variar el texto
    const shuffledSymptoms = [...mod.symptoms].sort(() => 0.5 - Math.random());
    const selectedSymptoms = shuffledSymptoms.slice(0, 2).join(" ");

    const story = `Paciente de ${age}, ${name}, se encuentra ${context}. Presenta el siguiente cuadro: "${selectedSymptoms}"`;

    return {
      case_id: `MODULAR_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      title: mod.title,
      educational_level: "Generador Procedimental",
      difficulty: "Variable",
      metadata: { is_real_data: false, module_type: mod.type },
      source_chunks: [
        { 
          chunk_id: "GEN_MOD_1", 
          text_content: story
        }
      ],
      tasks: [
        {
          task_id: `T_MOD_${Date.now()}`,
          instruction: "¿Cuál es el paso clínico más adecuado?",
          expected_answer: mod.correct,
          distractors: mod.distractors,
          rationale: mod.rationale
        }
      ]
    };
  }

  return { createCase };
})();