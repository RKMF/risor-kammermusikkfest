import { fileURLToPath } from 'node:url';
import { defineCliConfig } from 'sanity/cli';

const codemirrorPackageAliases = {
  '@codemirror/state': fileURLToPath(new URL('./node_modules/@codemirror/state', import.meta.url)),
  '@codemirror/commands': fileURLToPath(
    new URL('./node_modules/@codemirror/commands', import.meta.url),
  ),
  '@codemirror/language': fileURLToPath(
    new URL('./node_modules/@codemirror/language', import.meta.url),
  ),
  '@codemirror/search': fileURLToPath(new URL('./node_modules/@codemirror/search', import.meta.url)),
  '@codemirror/view': fileURLToPath(new URL('./node_modules/@codemirror/view', import.meta.url)),
};

export default defineCliConfig({
  api: {
    projectId: 'dnk98dp0',
    dataset: 'production',
  },
  schemaExtraction: {
    enabled: true,
    path: '../frontend/sanity/extract.json',
  },
  typegen: {
    enabled: true,
    path: '../frontend/src/pages/api/**/*.{ts,js}',
    schema: '../frontend/sanity/extract.json',
    generates: '../frontend/sanity/sanity.types.ts',
    overloadClientMethods: true,
  },
  vite: {
    resolve: {
      // Vision uses CodeMirror through multiple packages. Force one module identity so
      // extension instances come from the same runtime copy and avoid the known
      // "multiple instances of @codemirror/state" error.
      alias: codemirrorPackageAliases,
      dedupe: Object.keys(codemirrorPackageAliases),
    },
  },
  /**
   * Deployment configuration for Sanity hosting.
   */
  deployment: {
    /**
     * Keep Studio builds deterministic and avoid remote auto-update checks at build time.
     */
    autoUpdates: false,
    appId: 'hu93vy2a1grtzlr0ri5q1zrp',
  },
  /**
   * The hostname for deploying the studio to Sanity hosting.
   * This prevents prompts during deployment.
   */
  studioHost: 'rkmf-cms',
});
