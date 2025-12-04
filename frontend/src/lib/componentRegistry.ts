import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { PageBuilder } from '../../sanity/sanity.types';

// Import all components that can be used in content blocks
import PortableText from '../components/PortableText.astro';
import Heading from '../components/Heading.astro';
import Image from '../components/Image.astro';
import Video from '../components/Video.astro';
import Spotify from '../components/Spotify.astro';
import Button from '../components/Button.astro';
import Link from '../components/Link.astro';
import Quote from '../components/Quote.astro';
import Accordion from '../components/Accordion.astro';
import ContentScrollContainer from '../components/ContentScrollContainer.astro';
import ArtistScrollContainer from '../components/ArtistScrollContainer.astro';
import EventScrollContainer from '../components/EventScrollContainer.astro';
import Countdown from '../components/Countdown.astro';
import Grid from '../components/Grid.astro';
import TwoColumn from '../components/TwoColumn.astro';
import ThreeColumn from '../components/ThreeColumn.astro';

// Component registry mapping Sanity block types to Astro components
export const componentRegistry: Record<string, AstroComponentFactory> = {
  portableTextBlock: PortableText,
  headingComponent: Heading,
  imageComponent: Image,
  videoComponent: Video,
  spotifyComponent: Spotify,
  buttonComponent: Button,
  linkComponent: Link,
  quoteComponent: Quote,
  accordionComponent: Accordion,
  contentScrollContainer: ContentScrollContainer,
  artistScrollContainer: ArtistScrollContainer,
  eventScrollContainer: EventScrollContainer,
  countdownComponent: Countdown,
  gridComponent: Grid,
  twoColumnLayout: TwoColumn,
  threeColumnLayout: ThreeColumn,
} as const;

// Get all registered component types
export const registeredTypes = Object.keys(componentRegistry);

// Check if a component type is registered
export function isRegisteredComponent(type: string): type is keyof typeof componentRegistry {
  return type in componentRegistry;
}

// Get component by type with fallback
export function getComponent(type: string): AstroComponentFactory | null {
  return componentRegistry[type] || null;
}

// Type for content blocks - extracts discriminated union element type from PageBuilder array
export type ContentBlock = PageBuilder extends Array<infer T> ? T : never;