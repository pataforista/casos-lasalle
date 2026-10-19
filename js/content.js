"use strict";
/* ============================================================================
   content.js — GENERADO por tools/editDoc.js a partir de EDITAR_JUEGO.md.
   No lo edites a mano: el próximo «npm run apply» lo sobrescribe.
   Para cambiar un número o una frase, edita EDITAR_JUEGO.md.
   ============================================================================ */

const GAME_CONFIG = {
  "maxLives": 3,
  "startCoins": 150,
  "baseTurnSeconds": 45,
  "minTurnSeconds": 15,
  "difficultyScale": 4.5,
  "advanceDelayMs": 3500,
  "modalDelayMs": 450,
  "baseReward": 25,
  "baseXP": 50,
  "speedBonusMax": 30,
  "fastThreshold": 0.6,
  "streakStep": 3,
  "maxMultiplier": 3,
  "signFine": 60,
  "casesPerRound": 5,
  "costs": {
    "hint": 50,
    "life": 100,
    "time": 30
  },
  "timeBoostSeconds": 30
};

const NARRATIVE = {
  "intro": "Estás de guardia. No eres observador: decides con información incompleta en un servicio saturado.",
  "rules": [
    "Decide con la información disponible: no siempre tendrás el panorama completo.",
    "Responde rápido: el reloj que te sobra se paga en monedas, y cada racha lo acorta.",
    "Firma la nota si estás seguro: cobras el doble, o pagas la multa.",
    "Cada {pase} pacientes el Dr. Celada pasa lista y reparte bono."
  ],
  "consequence": "El error honesto pesa menos que una decisión mal razonada."
};

const BOSS_ROUNDS = [
  {
    "min": 1,
    "label": "PASE IMPECABLE",
    "mood": "streak",
    "tone": "perfect",
    "bonus": 200,
    "heal": true,
    "lines": [
      "Todo el bloque sin un error. Así se ve una guardia bien llevada.",
      "Ni un tropiezo en todo el bloque. El servicio lo nota.",
      "Impecable. Ni una decisión que reprocharte."
    ]
  },
  {
    "min": 0.8,
    "label": "BUEN BLOQUE",
    "mood": "ok",
    "tone": "good",
    "bonus": 110,
    "heal": false,
    "lines": [
      "Sólido. Un desliz no arruina un bloque bien resuelto.",
      "Vas bien. Sostén el criterio y no te enamores de la primera hipótesis.",
      "Buen ritmo. Sigue así y salimos vivos del turno."
    ]
  },
  {
    "min": 0.6,
    "label": "ACEPTABLE",
    "mood": "normal",
    "tone": "ok",
    "bonus": 55,
    "heal": false,
    "lines": [
      "Pasable. Te faltó rigor en un par de decisiones.",
      "Ni brillante ni desastroso. Afina el razonamiento.",
      "Aquí el margen es estrecho. Ajusta antes del siguiente bloque."
    ]
  },
  {
    "min": 0,
    "label": "REVISIÓN NECESARIA",
    "mood": "angry",
    "tone": "bad",
    "bonus": 0,
    "heal": false,
    "lines": [
      "Demasiados errores. Vuelve a leer los casos que fallaste.",
      "Esto no se sostiene. Baja la velocidad y piensa.",
      "El servicio no aguanta este margen de error. Corrígelo ya."
    ]
  }
];

const ROSTER = [
  {
    "name": "Aguilar",
    "title": "Dra.",
    "signature": "Ya lo interrogué; te resumo lo importante.",
    "sprite": "aguilar_atlas.png"
  },
  {
    "name": "Solis",
    "title": "Dr.",
    "signature": "Yo ya le hubiera dado algo, pero mejor dime tú.",
    "sprite": "solis_atlas.png"
  },
  {
    "name": "Ríos",
    "title": "Dra.",
    "signature": "Con calma: los datos están completos, la decisión es tuya.",
    "sprite": "rios_atlas.png"
  },
  {
    "name": "Mendoza",
    "title": "Dr.",
    "signature": "No me gusta cómo se ve… ¿lo checas conmigo?",
    "sprite": "mendoza_atlas.png"
  },
  {
    "name": "Ferrer",
    "title": "Dra.",
    "signature": "Te lo pongo en una línea: hay que decidir ya.",
    "sprite": "ferrer_atlas.png"
  },
  {
    "name": "Castañeda",
    "title": "Dr.",
    "signature": "El interrogatorio no me cuadra del todo, júzgalo tú.",
    "sprite": "castaneda_atlas.png"
  },
  {
    "name": "Herrera",
    "title": "Dra.",
    "signature": "La familia está afuera preguntando. ¿Qué les digo?",
    "sprite": "herrera_atlas.png"
  },
  {
    "name": "Valdez",
    "title": "Dr.",
    "signature": "Tranquilidad… bueno, la que se pueda a esta hora.",
    "sprite": "valdez_atlas.png"
  }
];

const RESIDENT_LINES = {
  "presentNormal": [
    "No tengo tiempo para revisar todo, dime qué hacemos.",
    "Esto puede esperar… o no. Tú decides.",
    "Si lo mandamos a casa y se complica, va a rebotar.",
    "Te presento el caso; la sala está llena y hay prisa.",
    "Ya está el expediente. ¿Cuál es tu impresión?"
  ],
  "presentTachy": [
    "Viene muy agitado, apenas podemos contenerlo. ¿Qué hacemos?",
    "Está taquicárdico y no coopera. Necesito una indicación ya.",
    "Se altera más con cada minuto. Tú decides.",
    "Seguridad ya está enterada, pero esto es clínico. ¿Indicaciones?"
  ],
  "presentBrady": [
    "Casi no responde; lo trajeron los familiares.",
    "Lleva horas sin moverse ni comer. Esto no me gusta.",
    "Hipoactivo, apenas contesta. ¿Por dónde empezamos?"
  ],
  "ok": [
    "¡Eso! Ya lo estamos indicando.",
    "De acuerdo, tiene sentido. Procedo.",
    "Bien visto. Aviso a enfermería.",
    "Anotado. El paciente va a agradecerlo."
  ],
  "okStreak": [
    "Otra más… hoy estás en modo intratable.",
    "Así da gusto pasar la guardia.",
    "El Dr. Celada tiene que estar viendo esto.",
    "A este ritmo, vaciamos la sala antes del cambio de turno."
  ],
  "okSigned": [
    "Firmaste y acertaste. Eso es tenerlas bien puestas.",
    "Con tu firma encima y salió limpio. Impresionante.",
    "Te comprometiste y el paciente lo agradece."
  ],
  "error": [
    "¿Seguro? El paciente no va bien…",
    "Uy… eso no salió como esperábamos.",
    "Se complicó. Hay que replantear.",
    "El adscrito va a preguntar por esto…"
  ],
  "errorSigned": [
    "Ay… y lo habías firmado. Eso va a doler.",
    "Firmaste esa nota. El adscrito la va a leer.",
    "Con tu nombre encima. Vamos a tener que rehacerlo."
  ],
  "timeout": [
    "Nos quedamos pensando demasiado…",
    "No decidimos a tiempo; ya intervino el adscrito.",
    "La demora también es una decisión, y esta costó."
  ],
  "decompensated": [
    "¡Se nos está yendo! Necesito una maniobra de rescate ya.",
    "Reaccionó mal a lo anterior y ahora está inestable. ¿Qué hacemos?",
    "Se descompensó. No hay margen para otra equivocación.",
    "Está peor que hace un minuto. Rápido, ¿qué indicamos?"
  ],
  "rescued": [
    "Lo estabilizaste. Respiramos otra vez.",
    "Ya remonta. Buen rescate.",
    "Vuelve a estar estable. Estuvo cerca."
  ]
};
