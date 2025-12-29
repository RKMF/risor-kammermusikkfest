/**
 * Sanity Studio Configuration - Risør Kammermusikkfest CMS
 *
 * This is the main configuration hub for the Sanity Studio. It defines:
 * - Plugins for content editing, preview, and asset management
 * - Custom document actions for artist/event/article publishing workflows
 * - Visual Editing integration with the Astro frontend
 * - Norwegian localization with custom terminology
 *
 * Key customizations:
 * - Custom publish actions sync related content (events ↔ artists)
 * - 'Unpublish' removed in favor of publishingStatus field in Publisering tab
 * - Delete actions check for references before allowing deletion
 * - i18n overrides change "Publish" to "Lagre" (Save) for editor clarity
 *
 * @see docs/PROJECT_GUIDE.md - Section 2.1 Sanity CMS
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { nbNOLocale } from '@sanity/locale-nb-no';
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash';
import { schemaTypes } from './schemaTypes';
import { structure } from './deskStructure';
import { placeholderTextPlugin } from './plugins/placeholderTextPlugin';
import { componentGuideTool } from './plugins/componentGuideTool';
import { compositeArtistPublishAction } from './actions/compositeArtistPublishAction';
import { compositeEventPublishAction } from './actions/compositeEventPublishAction';
import { addArticleToArticlePageAction } from './actions/addArticleToArticlePageAction';
import { createDeleteWithReferencesAction } from './actions/createDeleteWithReferencesAction';
import {
  articleDeleteConfig,
  artistDeleteConfig,
  eventDeleteConfig,
} from './actions/deleteConfigs';
import { rkmfTheme } from './theme';
import { RKMFLogo } from './components/RKMFLogo';

// Create delete actions using factory function
const deleteArticleAction = createDeleteWithReferencesAction(articleDeleteConfig);
const deleteArtistAction = createDeleteWithReferencesAction(artistDeleteConfig);
const deleteEventAction = createDeleteWithReferencesAction(eventDeleteConfig);

// Custom Norwegian i18n resources to override publish button text
const customNorwegianResources = {
  'nb-NO': {
    'document-pane': {
      'action-menu': {
        'publish-label': 'Lagre',
        'publish-now': 'Lagre nå',
        'publish-schedule': 'Planlegg lagring',
        'publish-changes': 'Lagre endringer',
      },
      'document-status': {
        published: 'Lagret',
        'not-published': 'Ikke lagret',
      },
    },
  },
};

export default defineConfig({
  name: 'default',
  title: "Kammer'n",
  icon: RKMFLogo,

  projectId: 'dnk98dp0',
  dataset: 'production',

  theme: rkmfTheme,

  // ============================================================================
  // PLUGINS
  // ============================================================================
  plugins: [
    // Custom desk structure organizing content into logical sections
    structureTool({ structure }),
    // GROQ query testing and debugging tool
    visionTool(),
    // Norwegian language for Studio UI
    nbNOLocale(),
    // Unsplash integration for stock photos
    unsplashImageAsset(),
    // Custom placeholder text generator for content editors
    placeholderTextPlugin(),
    // Component reference guide for editors
    componentGuideTool(),
    // Visual Editing integration with Astro frontend
    presentationTool({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:4321',
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      resolve: {
        locations: {
          // Artist pages
          artist: {
            select: {
              title: 'name',
              slug: 'slug.current',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled artist',
                  href: `/artister/${doc?.slug}`,
                },
                {
                  title: `${doc?.title || 'Untitled artist'} (EN)`,
                  href: `/en/artists/${doc?.slug}`,
                },
              ],
            }),
          },
          // Event pages
          event: {
            select: {
              title_no: 'title_no',
              title_en: 'title_en',
              slug_no: 'slug_no.current',
              slug_en: 'slug_en.current',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title_no || 'Untitled event',
                  href: `/program/${doc?.slug_no}`,
                },
                ...(doc?.slug_en
                  ? [
                      {
                        title: doc?.title_en || 'Untitled event (EN)',
                        href: `/en/program/${doc?.slug_en}`,
                      },
                    ]
                  : []),
              ],
            }),
          },
          // Article pages
          article: {
            select: {
              title: 'title',
              slug: 'slug.current',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Untitled article',
                  href: `/artikler/${doc?.slug}`,
                },
              ],
            }),
          },
          // Homepage
          homepage: {
            select: {
              title: 'title',
              isDefault: 'isDefault',
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Homepage',
                  href: '/',
                },
              ],
            }),
          },
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  // ============================================================================
  // DOCUMENT ACTIONS
  // ============================================================================
  // Custom actions replace default Sanity behavior for key document types.
  // Pattern: Filter out unwanted actions, then map to replace specific ones.
  //
  // Why remove 'unpublish'?
  // Editors control visibility via the 'publishingStatus' field in the Publisering
  // tab (Draft/Published). This is clearer than Sanity's built-in unpublish which
  // creates confusing "published but invisible" states.
  // ============================================================================
  document: {
    actions: (prev, context) => {
      // Artist: composite publish syncs events, offers to add to artist page
      if (context.schemaType === 'artist') {
        return prev
          .filter((action) => action.action !== 'unpublish')
          .map((action) => {
            if (action.action === 'publish') return compositeArtistPublishAction;
            if (action.action === 'delete') return deleteArtistAction;
            return action;
          });
      }

      // Event: composite publish syncs date/artists, offers to add to program page
      if (context.schemaType === 'event') {
        return prev
          .filter((action) => action.action !== 'unpublish')
          .map((action) => {
            if (action.action === 'publish') return compositeEventPublishAction;
            if (action.action === 'delete') return deleteEventAction;
            return action;
          });
      }

      // Article: publish offers to add to article listing page
      if (context.schemaType === 'article') {
        return prev
          .filter((action) => action.action !== 'unpublish')
          .map((action) => {
            if (action.action === 'publish') return addArticleToArticlePageAction;
            if (action.action === 'delete') return deleteArticleAction;
            return action;
          });
      }

      return prev;
    },
  },

  // Override default Norwegian translations
  i18n: {
    bundles: [
      {
        locale: 'nb-NO',
        namespace: 'studio',
        resources: customNorwegianResources,
      },
    ],
  },
});
