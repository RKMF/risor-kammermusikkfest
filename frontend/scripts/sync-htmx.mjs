import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');
const require = createRequire(import.meta.url);
const htmxPackagePath = require.resolve('htmx.org/package.json', { paths: [frontendDir] });
const sourcePath = resolve(dirname(htmxPackagePath), 'dist/htmx.min.js');
const targetPath = resolve(frontendDir, 'public/vendor/htmx.min.js');

mkdirSync(dirname(targetPath), { recursive: true });
cpSync(sourcePath, targetPath);

console.log(`Synced HTMX browser build to ${targetPath}`);
