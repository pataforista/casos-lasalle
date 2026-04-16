const Economy = (() => {
  const STORAGE_KEY = 'psy_miami_save_v2';

  const defaultData = {
    coins: 150,
    xp: 0,
    maxStreak: 0,
    gamesPlayed: 0,
    achievements: []
  };

  let data = load();

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultData, ...JSON.parse(stored) } : { ...defaultData };
    } catch {
      return { ...defaultData };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const ACHIEVEMENTS = {
    'first_shift': { id: 'first_shift', icon: '🩺', name: 'Primer Turno', condition: (d) => d.gamesPlayed >= 1 },
    'survivor': { id: 'survivor', icon: '🔥', name: 'Superviviente', condition: (d) => d.maxStreak >= 3 },
    'chief': { id: 'chief', icon: '👑', name: 'Jefe Residente', condition: (d) => d.maxStreak >= 10 },
    'rich': { id: 'rich', icon: '💎', name: 'Magnate', condition: (d) => d.coins >= 500 }
  };

  return {
    init: () => { data = load(); }, // Ensure fresh load
    load: () => { data = load(); }, // Alias for compatibility
    getCoins: () => data.coins,
    getXP: () => data.xp,
    getStats: () => ({ ...data }), // Read-only copy

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

    registerGame: (streak) => {
      data.gamesPlayed++;
      data.maxStreak = Math.max(data.maxStreak, streak);
      save();
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

    getRank: () => {
      if (data.xp > 2000) return "LEYENDA";
      if (data.xp > 1000) return "JEFE";
      if (data.xp > 400) return "R3";
      if (data.xp > 100) return "R2";
      return "R1";
    },

    reset: () => {
      data = { ...defaultData };
      save();
    }
  };
})();