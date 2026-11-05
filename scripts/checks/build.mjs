// Check 1: type check + build with zero errors and zero warnings.
import { spawnSync } from 'node:child_process';
import { result } from './lib.mjs';

const r = result('build', 'Build: site builds with zero errors and zero warnings');
const run = (cmd, args, env = {}) => {
  const p = spawnSync(cmd, args, { encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...env }, shell: process.platform === 'win32' });
  return { code: p.status, out: (p.stdout ?? '') + (p.stderr ?? '') };
};
const check = run('npx', ['astro', 'check', '--minimumSeverity', 'warning']);
if (check.code !== 0) r.error('Type check (astro check) found problems:\n\n```\n' + check.out.split('\n').filter((l) => /error|warning/i.test(l)).slice(0, 40).join('\n') + '\n```', 'Open the file and line shown above. Content errors name the file in src/content/ and the field to fix.');
const build = run('npm', ['run', 'build']);
const warnings = build.out.split('\n').filter((l) => /\[WARN\]|\bwarning\b/i.test(l) && !/npm warn/i.test(l));
if (build.code !== 0) r.error('The build failed:\n\n```\n' + build.out.split('\n').slice(-40).join('\n') + '\n```', 'Read the first error line above. It usually names the content file and field that is wrong (for example a date in the wrong format or a missing image).');
for (const w of warnings) r.error(`Build warning: ${w.trim()}`, 'Warnings are treated as errors so small problems never reach the live site. Fix what the warning describes.');
r.finish();
