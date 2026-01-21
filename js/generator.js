"use strict";

/**
 * Generator — Procedural Case Engine
 * Crea casos infinitos cuando se acaba la base de datos real.
 */

const Generator = (() => {
  const NAMES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Jorge", "Lucía"];
  const LAST_NAMES = ["Pérez", "García", "López", "Martínez", "Rodríguez", "González", "Hernández"];
  
  // Plantillas "Arcade/Neon"
  const TEMPLATES = [
    {
      title: "Urgencia: Manía Aguda",
      story: "🤬 ¡Soy el rey del sol! ¡Tengo 50 empresas y voy a comprar este hospital! No he dormido en 5 días pero estoy perfecto.",
      correct: "Hospitalizar UCE",
      distractors: ["Alta médica", "Observación", "Interconsulta a Nutrición"]
    },
    {
      title: "Urgencia: Delirium Tremens",
      story: "👻 (Tiembla visiblemente) ¡Quiten las arañas de mi cara! No sé dónde estoy, todos son demonios. Huele a alcohol.",
      correct: "Hospitalizar UCE",
      distractors: ["Alta médica", "Psicoterapia ambulatoria", "Vitaminas y casa"]
    },
    {
      title: "Consulta: Riesgo Suicida",
      story: "🔪 Tomé todo el frasco, ya no quiero seguir. Me despedí de todos ayer, no aguanto más este dolor.",
      correct: "Hospitalizar UCE (Riesgo Alto)",
      distractors: ["Cita en 1 mes", "Dar de alta", "Recetar paracetamol"]
    },
    {
      title: "Urgencia: Crisis de Pánico",
      story: "😰 Siento que me va a dar un infarto. No puedo respirar, me voy a morir. Mi EKG es normal.",
      correct: "Observación y Ansiolíticos",
      distractors: ["Código Infarto", "Cirugía cardíaca", "Intubación inmediata"]
    },
    {
      title: "Consulta: Duelo",
      story: "😢 Murió mi gato hace una semana y sigo muy triste. Lloro mucho pero voy al trabajo.",
      correct: "Alta / Consejería",
      distractors: ["Internamiento forzoso", "Electroshock", "Antipsicóticos"]
    }
  ];

  function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function createCase() {
    const t = getRandom(TEMPLATES);
    const name = `${getRandom(NAMES)} ${getRandom(LAST_NAMES)}`;
    
    // Construimos un objeto caso compatible con el formato de CaseDB
    return {
      case_id: `SYNTH_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      title: t.title,
      educational_level: "Generado por IA",
      difficulty: "Dinámica",
      metadata: { is_real_data: false },
      source_chunks: [
        { 
          chunk_id: "GEN_1", 
          text_content: `PACIENTE: ${name}\n\n"${t.story}"` 
        }
      ],
      tasks: [
        {
          task_id: `T_${Date.now()}`,
          instruction: "¿Cuál es la conducta clínica más adecuada?",
          expected_answer: t.correct,
          distractors: t.distractors
        }
      ]
    };
  }

  return { createCase };
})();