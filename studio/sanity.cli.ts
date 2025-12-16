import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'dnk98dp0',
    dataset: 'production',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
  /**
   * The hostname for deploying the studio to Sanity hosting.
   * This prevents prompts during deployment.
   */
  studioHost: 'rkmf-cms',
});
