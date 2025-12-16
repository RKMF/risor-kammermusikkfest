import { type ReferenceCleanupConfig } from './createDeleteWithReferencesAction';

export const articleDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'article',
  labelSingular: 'artikkel',
  references: [
    {
      referringType: 'articlePage',
      fieldPath: 'selectedArticles',
      displayLabel: 'artikkeloversikt',
      singularForm: 'side',
      pluralForm: 'sider',
    },
  ],
};

export const artistDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'artist',
  labelSingular: 'artist',
  references: [
    {
      referringType: 'artistPage',
      fieldPath: 'selectedArtists',
      displayLabel: 'oversiktsside',
      singularForm: 'side',
      pluralForm: 'sider',
    },
    {
      referringType: 'event',
      fieldPath: 'artist',
      displayLabel: 'arrangement',
      singularForm: 'arrangement',
      pluralForm: 'arrangementer',
    },
  ],
};

export const eventDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'event',
  labelSingular: 'arrangement',
  references: [
    {
      referringType: 'programPage',
      fieldPath: 'selectedEvents',
      displayLabel: 'programoversikt',
      singularForm: 'side',
      pluralForm: 'sider',
    },
    {
      referringType: 'artist',
      fieldPath: 'events',
      displayLabel: 'artist',
      singularForm: 'artist',
      pluralForm: 'artister',
    },
  ],
};
