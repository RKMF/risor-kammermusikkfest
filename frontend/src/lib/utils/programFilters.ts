import type { VenueObject } from '../sanity/queries';

export interface ProgramFilterVenue {
  slug: string;
  title: string;
}

interface EventWithVenue {
  venue?: VenueObject | ProgramFilterVenue | null;
}

function toProgramFilterVenue(venue: VenueObject | ProgramFilterVenue | null | undefined): ProgramFilterVenue | null {
  if (!venue?.slug || !venue.title) return null;

  return {
    slug: venue.slug,
    title: venue.title,
  };
}

export function deriveAvailableVenues(
  events: Array<EventWithVenue | null | undefined>,
  curatedVenues: Array<VenueObject | ProgramFilterVenue | null | undefined> = [],
): ProgramFilterVenue[] {
  const eventVenueMap = new Map<string, ProgramFilterVenue>();

  for (const event of events) {
    const venue = toProgramFilterVenue(event?.venue);
    if (!venue || eventVenueMap.has(venue.slug)) continue;
    eventVenueMap.set(venue.slug, venue);
  }

  const availableVenues: ProgramFilterVenue[] = [];
  const addedSlugs = new Set<string>();

  for (const venueRef of curatedVenues) {
    const venue = toProgramFilterVenue(venueRef);
    if (!venue || addedSlugs.has(venue.slug) || !eventVenueMap.has(venue.slug)) continue;

    availableVenues.push(venue);
    addedSlugs.add(venue.slug);
  }

  for (const venue of eventVenueMap.values()) {
    if (addedSlugs.has(venue.slug)) continue;

    availableVenues.push(venue);
    addedSlugs.add(venue.slug);
  }

  return availableVenues;
}
