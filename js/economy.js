// ================================================================= 
// MODULO: ECONOMY.JS (Lógica de Monedas)
// ================================================================= 

const Economy = (() => {
  let data = JSON.parse(localStorage.getItem('psy_miami_save')) || { coins: 150, xp: 0 };
  
  const save = () => localStorage.setItem('psy_miami_save', JSON.stringify(data));
  
  return {
    getCoins: () => data.coins,
    getXP: () => data.xp,
    add: (c, x) => { 
      data.coins += c; 
      data.xp += x; 
      save(); 
    },
    getRank: () => data.xp > 1000 ? "JEFE" : (data.xp > 400 ? "R3" : "INTERNO")
  };
})();