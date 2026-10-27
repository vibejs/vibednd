import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');
let changed = false;
function visit(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (path.endsWith('.vibe')) {
      const original = readFileSync(path, 'utf8');
      // The formatter's SFC parser handles this shared syntax; no Vue runtime is loaded.
      let formatted = original;
      let stable = false;
      // Embedded script formatting can change a template's wrapping on its next pass.
      for (let pass = 0; pass < 3; pass++) {
        const next = execFileSync(
          join(root, 'node_modules/.bin/oxfmt'),
          ['--stdin-filepath', `${path}.vue`],
          { cwd: root, input: formatted, encoding: 'utf8' },
        );
        if (next === formatted) {
          stable = true;
          break;
        }
        formatted = next;
      }
      if (!stable) throw new Error(`Formatter did not stabilize: ${relative(root, path)}`);
      if (formatted === original) continue;
      if (write) writeFileSync(path, formatted);
      else {
        changed = true;
        console.error(`Unformatted: ${relative(root, path)}`);
      }
    }
  }
}
for (const directory of ['examples', 'test/fixtures', 'benchmarks']) visit(join(root, directory));
if (changed) process.exitCode = 1;
