/**
 * Sanity Studio Configuration - Risør Kammermusikkfest CMS
 *
 * This is the main configuration hub for the Sanity Studio. It defines:
 * - Plugins for content editing and asset management
 * - Custom document actions for artist/event/article publishing workflows
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
import { nbNOLocale } from '@sanity/locale-nb-no';
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash';
import { schemaTypes } from './schemaTypes';
import { structure } from './deskStructure';
import { placeholderTextPlugin } from './plugins/placeholderTextPlugin';
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

const productionSiteUrl = 'https://www.kammermusikkfest.no';

type ProductionUrlDocument = {
  _type?: string;
  slug?: { current?: string };
  slug_no?: { current?: string };
  slug_en?: { current?: string };
};

function getSlug(document?: ProductionUrlDocument): string | undefined {
  if (!document) return undefined;

  return (
    document.slug_no?.current ||
    document.slug_en?.current ||
    document.slug?.current
  );
}

function getProductionUrl(document?: ProductionUrlDocument): string | undefined {
  if (!document) return undefined;

  const slug = getSlug(document);

  switch (document._type) {
    case 'homepage':
      return `${productionSiteUrl}/`;
    case 'programPage':
      return `${productionSiteUrl}/program`;
    case 'artistPage':
      return `${productionSiteUrl}/artister`;
    case 'articlePage':
      return `${productionSiteUrl}/artikler`;
    case 'event':
      return slug ? `${productionSiteUrl}/program/${encodeURIComponent(slug)}` : undefined;
    case 'artist':
      return slug ? `${productionSiteUrl}/artister/${encodeURIComponent(slug)}` : undefined;
    case 'article':
      return slug ? `${productionSiteUrl}/artikler/${encodeURIComponent(slug)}` : undefined;
    case 'page':
      return slug ? `${productionSiteUrl}/${encodeURIComponent(slug)}` : undefined;
    default:
      return undefined;
  }
}

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
  ],

  schema: {
    types: schemaTypes,
  },

  // Preserve current editorial search behavior during the v6 migration.
  search: {
    strategy: 'groqLegacy',
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
    // Sanity shows this as "Open preview" in the document context menu.
    // It opens the currently published page on the public website.
    productionUrl: async (_prev, context) =>
      getProductionUrl(context.document as ProductionUrlDocument),

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
