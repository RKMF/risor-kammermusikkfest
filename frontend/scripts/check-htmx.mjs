import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const sourcePath = resolve(frontendDir, '../node_modules/htmx.org/dist/htmx.min.js');
const targetPath = resolve(frontendDir, 'public/vendor/htmx.min.js');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(sourcePath)) {
  fail(`Installed HTMX asset not found at ${sourcePath}. Run npm ci first.`);
}

if (!existsSync(targetPath)) {
  fail(
    `Vendored HTMX asset not found at ${targetPath}. Run: npm run sync:htmx --workspace=frontend`,
  );
}

const sourceContent = readFileSync(sourcePath);
const targetContent = readFileSync(targetPath);

if (!sourceContent.equals(targetContent)) {
  fail(
    'HTMX vendored asset is out of sync with installed htmx.org package. Run: npm run sync:htmx --workspace=frontend',
  );
}

console.log('HTMX vendored asset is in sync with the installed htmx.org package.');
