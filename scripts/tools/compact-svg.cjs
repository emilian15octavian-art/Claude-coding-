// One-time tool: compacts a potrace SVG into a single relative-coordinate path.
const fs = require('fs');
const [, , input, output] = process.argv;
const s = fs.readFileSync(input, 'utf8');
const ds = [...s.matchAll(/ d="([^"]+)"/g)].map(m => m[1]).join(' ');
const tokens = ds.match(/[MLCZ]|-?\d+(\.\d+)?/g);
let out = '', i = 0, cx = 0, cy = 0, sx = 0, sy = 0;
const num = n => String(n);
const pair = (x, y) => { const dx = Math.round(x) - cx, dy = Math.round(y) - cy; return [dx, dy]; };
const fmt = arr => arr.map((n, k) => (k === 0 || n < 0 ? (k === 0 ? '' : '') : ' ') + n).join('').replace(/^ /, '');
while (i < tokens.length) {
  const c = tokens[i++];
  if (c === 'Z') { out += 'z'; cx = sx; cy = sy; continue; }
  const n = c === 'C' ? 6 : 2;
  const vals = [];
  while (i < tokens.length && !/[MLCZ]/.test(tokens[i])) vals.push(+tokens[i++]);
  for (let k = 0; k < vals.length; k += n) {
    const seg = vals.slice(k, k + n).map(Math.round);
    if (c === 'M') { out += 'M' + seg[0] + ' ' + seg[1]; cx = sx = seg[0]; cy = sy = seg[1]; }
    else if (c === 'L') { out += 'l' + fmt([seg[0] - cx, seg[1] - cy]); cx = seg[0]; cy = seg[1]; }
    else { out += 'c' + fmt([seg[0] - cx, seg[1] - cy, seg[2] - cx, seg[3] - cy, seg[4] - cx, seg[5] - cy]); cx = seg[4]; cy = seg[5]; }
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1224 616"><path fill="currentColor" fill-rule="evenodd" d="${out}"/></svg>`;
fs.writeFileSync(output, svg);
console.log(output, svg.length);
