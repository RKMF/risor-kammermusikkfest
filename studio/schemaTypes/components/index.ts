// Content Components
export { title, escapeHtml } from './content/Title';
export { quoteComponent } from './content/Quote';
export { marqueeComponent } from './content/Marquee';
export {
  heading as headingComponent,
  generateHeadingId,
  validateHeadingHierarchy,
} from './content/Heading';
export {
  portableText,
  renderPortableText,
  toPlainText,
  findHeadings,
  generateTableOfContents,
  validatePortableText,
  defaultComponents,
} from './content/PortableText';
export type {
  PortableTextBlock,
  PortableTextSpan,
  PortableTextMarkDefinition,
} from '../shared/types';
export { portableTextBlock } from './content/PortableTextBlock';
export { imageComponent, generateOptimizedImageUrl } from './content/Image';
export { videoComponent } from './content/Video';
export { spotifyComponent } from './media/Spotify';

// Layout Components
export { gridComponent } from './layout/Grid';
export { twoColumnLayout } from './layout/TwoColumn';
export { threeColumnLayout } from './layout/ThreeColumn';

// Interactive Components
export { accordionComponent } from './interactive/Accordion';
export { buttonComponent } from './interactive/Button';
export { linkComponent } from './interactive/Link';
export { countdownComponent } from './interactive/Countdown';

// Section Components
export { contentScrollContainer } from './sections/ContentScrollContainer';
export { artistScrollContainer } from './sections/ArtistScrollContainer';
export { eventScrollContainer } from './sections/EventScrollContainer';
export { composerScrollContainer } from './sections/ComposerScrollContainer';
export { articleScrollContainer } from './sections/ArticleScrollContainer';

// Page Builder
export { pageBuilder } from './PageBuilder';
