
// Mock localStorage
global.localStorage = {
    store: {},
    getItem: function (key) { return this.store[key] || null; },
    setItem: function (key, value) { this.store[key] = value.toString(); },
    clear: function () { this.store = {}; }
};

// We will read economy.js content and eval it, or require it if we modified it to export.
// Since it's a browser file without exports, we'll read and eval, or better, include it.
// To make it simple, I'll just paste the content of economy.js here via the tool first.
// But since I don't want to copy paste manually, I'll read it in the script.

const fs = require('fs');
const path = require('path');

try {
    const economyPath = path.join(__dirname, 'js', 'economy.js');
    console.log(`Reading ${economyPath}...`);
    let economyCode = fs.readFileSync(economyPath, 'utf8');

    // Eval the code. Since it uses 'const Economy = ...', using eval in global scope 
    // might be tricky if not handled right. 
    // We can just strip 'const ' to make it global or verify if eval works.
    // In Node, top-level var/const are module-scoped. 
    // We can use vm.runInThisContext.

    const vm = require('vm');
    vm.runInThisContext(economyCode);

    // Check if Economy exists
    if (typeof Economy === 'undefined') {
        console.error('FAILURE: Economy is undefined after loading script.');
        process.exit(1);
    }

    console.log('Verifying Economy.load...');
    if (typeof Economy.load === 'function') {
        Economy.load();
        console.log('SUCCESS: Economy.load exists and executed.');
    } else {
        console.error('FAILURE: Economy.load is not a function.');
        process.exit(1);
    }

} catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
}
