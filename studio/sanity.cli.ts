import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'dnk98dp0',
    dataset: 'production',
  },
  /**
   * Deployment configuration for Sanity hosting.
   */
  deployment: {
    /**
     * Keep Studio builds deterministic and avoid remote auto-update checks at build time.
     */
    autoUpdates: false,
  },
  /**
   * The hostname for deploying the studio to Sanity hosting.
   * This prevents prompts during deployment.
   */
  studioHost: 'rkmf-cms',
});
