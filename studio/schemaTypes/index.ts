import { homepage } from './documents/homepage';
import { programPage } from './documents/programPage';
import { artistPage } from './documents/artistPage';
import { articlePage } from './documents/articlePage';
import { artist } from './documents/artist';
import { composer } from './documents/composer';
import { siteSettings } from './documents/siteSettings';
import { event } from './documents/event';
import { venue } from './documents/venue';
import { eventDate } from './documents/eventDate';
import { page } from './documents/page';
import { article } from './documents/article';

// Importer komponenter
import * as components from './components';
// Importer objekter
import { seoType } from './objects/seoFields';

export const schemaTypes = [
  homepage,
  programPage,
  artistPage,
  articlePage,
  artist,
  composer,
  siteSettings,
  event,
  venue,
  eventDate,
  page,
  article,
  // Objekter
  seoType,
  // Komponenter - sørg for at alle er registrert
  components.title,
  components.quoteComponent,
  components.marqueeComponent,
  components.headingComponent,
  components.portableText,
  components.portableTextBlock,
  components.imageComponent,
  components.videoComponent,
  components.spotifyComponent,
  components.buttonComponent,
  components.linkComponent,
  components.accordionComponent,
  components.countdownComponent,
  components.pageBuilder,
  components.gridComponent,
  components.twoColumnLayout,
  components.threeColumnLayout,
  // Seksjoner
  components.contentScrollContainer,
  components.artistScrollContainer,
  components.eventScrollContainer,
  components.composerScrollContainer,
];
