// One-time tool: traces the raster logo into an SVG path (white parts become the shape).
// Usage: npm i --no-save potrace && node scripts/tools/trace-logo.cjs input.png output.svg
const potrace = require('potrace');
const fs = require('fs');
const [, , input, output] = process.argv;
potrace.trace(input, { threshold: 128, blackOnWhite: false, turdSize: 20, optTolerance: 1.0, alphaMax: 1.1, color: 'currentColor', background: 'transparent' }, (err, svg) => {
  if (err) throw err;
  fs.writeFileSync(output, svg);
  console.log('written', output, svg.length);
});
