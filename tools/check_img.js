const fs = require('fs');
const dir = 'assets/sprites_src';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
for (const f of files) {
  const b = fs.readFileSync(`${dir}/${f}`);
  const view = new DataView(b.buffer);
  const w = view.getInt32(16, false);
  const h = view.getInt32(20, false);
  console.log(`${f}: ${w}x${h}`);
}
