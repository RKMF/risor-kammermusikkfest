import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {nbNOLocale} from '@sanity/locale-nb-no'
import {unsplashImageAsset} from 'sanity-plugin-asset-source-unsplash'
import {schemaTypes} from './schemaTypes'
import {structure} from './deskStructure'
import {placeholderTextPlugin} from './plugins/placeholderTextPlugin'
import {componentGuideTool} from './plugins/componentGuideTool'
import {addEventToProgramPageAction} from './actions/addEventToProgramPageAction'

// Custom Norwegian i18n resources to override publish button text
const customNorwegianResources = {
  'nb-NO': {
    'document-pane': {
      'action-menu': {
        'publish-label': 'Lagre',
        'publish-now': 'Lagre nå',
        'publish-schedule': 'Planlegg lagring',
        'publish-changes': 'Lagre endringer'
      },
      'document-status': {
        'published': 'Lagret',
        'not-published': 'Ikke lagret'
      }
    }
  }
}

export default defineConfig({
  name: 'default',
  title: 'studio',

  projectId: 'dnk98dp0',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
    nbNOLocale(),
    unsplashImageAsset(),
    placeholderTextPlugin(),
    componentGuideTool(),
    presentationTool({
      previewUrl: {
        origin: 'http://localhost:4321',
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
                ...(doc?.slug_en ? [{
                  title: doc?.title_en || 'Untitled event (EN)',
                  href: `/en/program/${doc?.slug_en}`,
                }] : []),
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

  document: {
    actions: (prev, context) => {
      // Replace default publish action with our custom one for event documents
      if (context.schemaType === 'event') {
        return prev.map((action) =>
          action.action === 'publish' ? addEventToProgramPageAction : action
        )
      }
      return prev
    },
  },

  // Override default Norwegian translations
  i18n: {
    bundles: [
      {
        namespace: 'studio',
        resources: customNorwegianResources,
      },
    ],
  },

})
