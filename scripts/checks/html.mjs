// Check 4: HTML validation of every built page.
import { HtmlValidate, FileSystemConfigLoader } from 'html-validate';
import path from 'node:path';
import { htmlFiles, requireDist, result, root } from './lib.mjs';

const r = result('html', 'HTML: every page is valid HTML');
requireDist(r);
const hv = new HtmlValidate(new FileSystemConfigLoader());
for (const f of htmlFiles()) {
  const report = await hv.validateFile(f);
  for (const res of report.results) for (const m of res.messages) {
    r.error(`${path.relative(root, f)}:${m.line}:${m.column} ${m.message} [${m.ruleId}]`, 'This comes from a component in src/components or src/views. Search for the element mentioned and fix the markup.');
  }
}
r.finish();
