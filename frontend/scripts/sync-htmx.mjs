import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const sourcePath = resolve(frontendDir, '../node_modules/htmx.org/dist/htmx.min.js');
const targetPath = resolve(frontendDir, 'public/vendor/htmx.min.js');

mkdirSync(dirname(targetPath), { recursive: true });
cpSync(sourcePath, targetPath);

console.log(`Synced HTMX browser build to ${targetPath}`);
