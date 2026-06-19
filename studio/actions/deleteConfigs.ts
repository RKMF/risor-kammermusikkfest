import { type ReferenceCleanupConfig } from './createDeleteWithReferencesAction';

export const articleDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'article',
  labelSingular: 'artikkel',
};

export const artistDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'artist',
  labelSingular: 'artist',
};

export const eventDeleteConfig: ReferenceCleanupConfig = {
  documentType: 'event',
  labelSingular: 'arrangement',
};
