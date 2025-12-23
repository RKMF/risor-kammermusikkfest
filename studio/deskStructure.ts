/**
 * Studio Desk Structure - Content navigation organization
 *
 * Defines how content is organized in the Studio sidebar. Structure is designed
 * for festival editors who primarily work with events, artists, and articles.
 *
 * Sections:
 * - Nettsideinnstillinger: Global site settings (singleton)
 * - FAST INNHOLD: Listing pages and static pages (rarely edited)
 * - FESTIVALINNHOLD: Events, artists, articles (frequently edited)
 * - REFERANSEDATA: Supporting data - dates, venues, composers, sponsors
 *
 * Default orderings are set per content type for logical browsing:
 * - Events: by date, then start time
 * - Artists/Composers/Sponsors: alphabetically by name
 * - Event dates/Venues: chronologically or alphabetically
 */

import { StructureBuilder } from 'sanity/desk';
import {
  CogIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  HomeIcon,
  EarthGlobeIcon,
  DocumentsIcon,
  ComposeIcon,
  UsersIcon,
  WarningOutlineIcon,
} from '@sanity/icons';

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Innhold')
    .items([
      // Site-wide settings (singleton document)
      S.listItem()
        .title('Nettsideinnstillinger')
        .id('siteSettings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      // ========== FAST INNHOLD ==========
      // Listing pages and static content - rarely edited after initial setup
      S.divider().title('FAST INNHOLD'),

      S.listItem().title('Forsider').icon(EarthGlobeIcon).child(S.documentTypeList('homepage')),
      S.listItem()
        .title('Programoversikt')
        .icon(CalendarIcon)
        .child(S.document().schemaType('programPage').documentId('programPage')),
      S.listItem()
        .title('Artistoversikt')
        .icon(UsersIcon)
        .child(S.document().schemaType('artistPage').documentId('artistPage')),
      S.listItem()
        .title('Artikkeloversikt')
        .icon(DocumentTextIcon)
        .child(S.document().schemaType('articlePage').documentId('articlePage')),
      S.listItem()
        .title('Sponsoroversikt')
        .icon(UsersIcon)
        .child(S.document().schemaType('sponsorPage').documentId('sponsorPage')),
      S.listItem().title('Faste sider').icon(DocumentsIcon).child(S.documentTypeList('page')),

      // ========== FESTIVALINNHOLD ==========
      // Primary content - events, artists, and articles created each festival
      S.divider().title('FESTIVALINNHOLD'),

      S.listItem()
        .title('Arrangementer')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('event').defaultOrdering([
            { field: 'eventDateValue', direction: 'asc' },
            { field: 'eventTime.startTime', direction: 'asc' },
          ])
        ),
      S.listItem()
        .title('Artister')
        .icon(UserIcon)
        .child(S.documentTypeList('artist').defaultOrdering([{ field: 'name', direction: 'asc' }])),
      S.listItem().title('Artikler').icon(DocumentTextIcon).child(S.documentTypeList('article')),

      // ========== REFERANSEDATA ==========
      // Supporting data referenced by events - dates, venues, composers, sponsors
      S.divider().title('REFERANSEDATA'),
      S.listItem()
        .title('Festivaldatoer')
        .icon(CalendarIcon)
        .child(
          S.documentTypeList('eventDate').defaultOrdering([{ field: 'date', direction: 'asc' }])
        ),
      S.listItem()
        .title('Spillesteder')
        .icon(HomeIcon)
        .child(S.documentTypeList('venue').defaultOrdering([{ field: 'title', direction: 'asc' }])),
      S.listItem()
        .title('Komponister')
        .icon(ComposeIcon)
        .child(
          S.documentTypeList('composer').defaultOrdering([{ field: 'name', direction: 'asc' }])
        ),
      S.listItem()
        .title('Sponsorer')
        .icon(UsersIcon)
        .child(
          S.documentTypeList('sponsor').defaultOrdering([{ field: 'name', direction: 'asc' }])
        ),
    ]);
