const Economy = (() => {
  const STORAGE_KEY = 'psy_miami_save_v2';

  const defaultData = {
    coins: 150,
    xp: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    achievements: [],
    // Métricas de carrera: alimentan los logros y el récord de guardia.
    bestShift: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    fastAnswers: 0,
    signedWins: 0,
    perfectRounds: 0,
    rescues: 0
  };

  let data = load();

  function num(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...defaultData };
      const parsed = JSON.parse(stored);
      const merged = { ...defaultData };
      // Migración perezosa: una partida guardada con el esquema viejo conserva
      // monedas y logros, y los contadores nuevos arrancan en cero.
      Object.keys(defaultData).forEach(key => {
        if (key === 'achievements') return;
        merged[key] = num(parsed[key], defaultData[key]);
      });
      merged.achievements = Array.isArray(parsed.achievements)
        ? parsed.achievements.filter(id => typeof id === 'string')
        : [];
      return merged;
    } catch {
      return { ...defaultData };
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Almacenamiento no disponible (modo privado / cuota llena): seguir jugando sin persistir
    }
  }

  const ACHIEVEMENTS = {
    'first_shift':  { id: 'first_shift',  icon: '🩺', name: 'Primer Turno',      desc: 'Termina tu primera guardia',              condition: (d) => d.gamesPlayed >= 1 },
    'survivor':     { id: 'survivor',     icon: '🔥', name: 'Superviviente',     desc: 'Encadena 3 aciertos',                     condition: (d) => d.maxStreak >= 3 },
    'chief':        { id: 'chief',        icon: '👑', name: 'Jefe Residente',    desc: 'Encadena 10 aciertos',                    condition: (d) => d.maxStreak >= 10 },
    'rich':         { id: 'rich',         icon: '💎', name: 'Magnate',           desc: 'Acumula 500 monedas',                     condition: (d) => d.coins >= 500 },
    'reflex':       { id: 'reflex',       icon: '⚡', name: 'Reflejo Clínico',   desc: '15 decisiones con el reloj casi intacto', condition: (d) => d.fastAnswers >= 15 },
    'signature':    { id: 'signature',    icon: '✍️', name: 'Palabra de Médico', desc: 'Gana 10 notas firmadas',                  condition: (d) => d.signedWins >= 10 },
    'rounds':       { id: 'rounds',       icon: '🩻', name: 'Pase Impecable',    desc: 'Un pase de visita sin un solo fallo',     condition: (d) => d.perfectRounds >= 1 },
    'rescuer':      { id: 'rescuer',      icon: '💚', name: 'Mano Firme',        desc: 'Estabiliza 5 pacientes descompensados',   condition: (d) => d.rescues >= 5 },
    'marathon':     { id: 'marathon',     icon: '🏃', name: 'Turno Largo',       desc: 'Atiende 20 pacientes en una guardia',     condition: (d) => d.bestShift >= 20 },
    'veteran':      { id: 'veteran',      icon: '🎖️', name: 'Veterano',          desc: 'Sobrevive a 15 guardias',                 condition: (d) => d.gamesPlayed >= 15 }
  };

  return {
    init: () => { data = load(); }, // Ensure fresh load
    load: () => { data = load(); }, // Alias for compatibility
    getCoins: () => data.coins,
    getXP: () => data.xp,
    getStats: () => ({ ...data }), // Read-only copy
    getBestShift: () => data.bestShift,

    getAccuracy: () => {
      if (!data.totalAnswered) return null;
      return Math.round((data.totalCorrect / data.totalAnswered) * 100);
    },

    add: (coins, xp) => {
      data.coins += coins;
      data.xp += xp;
      save();
    },

    spend: (amount) => {
      if (data.coins < amount) return false;
      data.coins -= amount;
      save();
      return true;
    },

    // Cobro que nunca deja el saldo en negativo: devuelve lo que realmente se cobró.
    fine: (amount) => {
      const charged = Math.max(0, Math.min(data.coins, amount));
      data.coins -= charged;
      save();
      return charged;
    },

    // Un solo punto de entrada para todo lo que ocurre al responder.
    recordAnswer: ({ correct = false, fast = false, signed = false, rescue = false } = {}) => {
      data.totalAnswered++;
      if (correct) data.totalCorrect++;
      if (correct && fast) data.fastAnswers++;
      if (correct && signed) data.signedWins++;
      if (rescue) data.rescues++;
      save();
    },

    recordRound: (perfect) => {
      if (perfect) data.perfectRounds++;
      save();
    },

    registerGame: (streak, casesResolved = 0) => {
      data.gamesPlayed++;
      data.maxStreak = Math.max(data.maxStreak, streak);
      const isRecord = casesResolved > data.bestShift;
      data.bestShift = Math.max(data.bestShift, casesResolved);
      save();
      return isRecord;
    },

    checkAchievements: () => {
      const unlocked = [];
      Object.values(ACHIEVEMENTS).forEach(ach => {
        if (!data.achievements.includes(ach.id) && ach.condition(data)) {
          data.achievements.push(ach.id);
          unlocked.push(ach);
        }
      });
      if (unlocked.length > 0) save();
      return unlocked;
    },

    getUnlockedAchievements: () => {
      return data.achievements.map(id => ACHIEVEMENTS[id]).filter(Boolean);
    },

    // Catálogo completo con el estado de cada logro: la vitrina del menú
    // necesita mostrar también lo que falta, no sólo lo ganado.
    getAchievementBoard: () => {
      return Object.values(ACHIEVEMENTS).map(ach => ({
        ...ach,
        unlocked: data.achievements.includes(ach.id)
      }));
    },

    getRank: () => {
      if (data.xp > 2000) return "LEYENDA";
      if (data.xp > 1000) return "JEFE";
      if (data.xp > 400) return "R3";
      if (data.xp > 100) return "R2";
      return "R1";
    },

    reset: () => {
      data = { ...defaultData, achievements: [] };
      save();
    }
  };
})();
