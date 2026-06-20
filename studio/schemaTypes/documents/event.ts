/**
 * Event Schema - Festival concert and event documents
 *
 * Represents festival events with:
 * - Shared bilingual editorial content
 * - One or more occurrence days with one or more showings
 * - Per-showing venue, ticket, and availability state
 * - Publishing workflow (draft/published/scheduled)
 * - SEO and image fields
 *
 * Custom behaviors via document actions:
 * - Publish syncs derived sort fields from the earliest showing
 * - Publish syncs artists bidirectionally
 * - Publish offers to add to program page
 *
 * @see actions/compositeEventPublishAction.tsx - Custom publish workflow
 * @see docs/PROJECT_GUIDE.md - Section 2.1 Schema Design
 */

import { defineField, defineType } from 'sanity';
import { CalendarIcon, ComposeIcon, CogIcon, CreditCardIcon } from '@sanity/icons';
import { eventTimeOptions } from '../../lib/timeUtils';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { EventShowingsInput } from '../../components/inputs/EventShowingsInput';
import { multilingualImageFields, imageFieldsets, imageGroup } from '../shared/imageFields';
import { seoFields, seoGroup } from '../objects/seoFields';
import { componentValidation } from '../shared/validation';
import { eventSlugValidation } from '../../lib/slugValidation';
import { getLanguageStatus } from '../shared/previewHelpers';
import { publishingFields, publishingGroup } from '../shared/publishingFields';
import { excludeAlreadySelected } from '../shared/referenceFilters';
import { MultiSelectReferenceInput } from '../components/inputs/MultiSelectReferenceInput';
import { getEventScheduleEntryCount } from '../../lib/eventSortValues';

function hasShowings(document: Record<string, any> | undefined): boolean {
  return Array.isArray(document?.showings) && document.showings.length > 0;
}

function hasLegacyOccurrences(document: Record<string, any> | undefined): boolean {
  return Array.isArray(document?.occurrences) && document.occurrences.length > 0;
}

function hasScheduleEntries(document: Record<string, any> | undefined): boolean {
  return hasShowings(document) || hasLegacyOccurrences(document);
}

function isPublishedDocument(document: Record<string, any> | undefined): boolean {
  return document?.publishingStatus === 'published';
}

function showingHasAnyContent(showing: Record<string, any> | undefined): boolean {
  if (!showing) return false;

  return Boolean(
    showing.startTime ||
    showing.endTime ||
    showing.ticketType ||
    showing.ticketUrl ||
    showing.ticketInfoText ||
    showing.ticketInfoText_no ||
    showing.ticketInfoText_en ||
    showing.ticketStatus ||
    showing.venue?._ref ||
    showing.venueRef?._ref ||
    showing.customVenueName ||
    showing.venueDetails?.venueRef?._ref ||
    showing.venueDetails?.customName
  );
}

function isPerShowingTicketing(document: Record<string, any> | undefined): boolean {
  return document?.ticketingMode === 'per_showing';
}

const commonShowingFields = [
  defineField({
    name: 'startTime',
    title: 'Starter',
    type: 'string',
    fieldset: 'times',
    options: {
      list: eventTimeOptions,
    },
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as Record<string, any> | undefined;
        const document = context.document as Record<string, any> | undefined;

        if ((isPublishedDocument(document) || showingHasAnyContent(parent)) && !value) {
          return 'Starttidspunkt må velges';
        }

        return true;
      }).warning('Starttidspunkt må velges'),
  }),
  defineField({
    name: 'endTime',
    title: 'Slutter',
    type: 'string',
    fieldset: 'times',
    options: {
      list: eventTimeOptions,
    },
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as Record<string, any> | undefined;
        const document = context.document as Record<string, any> | undefined;

        if ((isPublishedDocument(document) || showingHasAnyContent(parent)) && !value) {
          return 'Sluttidspunkt må velges';
        }

        return true;
      }).warning('Sluttidspunkt må velges'),
  }),
  defineField({
    name: 'eventDate',
    title: 'Dato',
    type: 'reference',
    to: [{ type: 'eventDate' }],
    options: {
      sort: [{ field: 'date', direction: 'asc' }],
    } as any,
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as Record<string, any> | undefined;
        const document = context.document as Record<string, any> | undefined;

        if ((isPublishedDocument(document) || showingHasAnyContent(parent)) && !value) {
          return 'Dato må velges';
        }

        return true;
      }).warning('Dato må velges'),
  }),
  defineField({
    name: 'venueMode',
    title: 'Type spillested',
    type: 'string',
    initialValue: 'reference',
    options: {
      list: [
        { title: 'Velg fra eksisterende spillesteder', value: 'reference' },
        { title: 'Skriv inn eget navn', value: 'custom' },
      ],
      layout: 'radio',
    },
  }),
  defineField({
    name: 'venueRef',
    title: 'Spillested',
    type: 'reference',
    to: [{ type: 'venue' }],
    description: 'Velg et spillested fra venue-listen',
    hidden: ({ parent }) => (parent as Record<string, any> | undefined)?.venueMode === 'custom',
  }),
  defineField({
    name: 'customVenueName',
    title: 'Eget spillestednavn',
    type: 'string',
    description:
      'Brukes når spillestedet ikke finnes i venue-listen. Dette vises på nettsiden, men blir ikke et filtervalg.',
    hidden: ({ parent }) => (parent as Record<string, any> | undefined)?.venueMode !== 'custom',
  }),
  defineField({
    name: 'venueDetails',
    title: 'Legacy spillesteddetaljer',
    type: 'object',
    hidden: true,
    fields: [
      defineField({
        name: 'mode',
        title: 'Modus',
        type: 'string',
        options: {
          list: [
            { title: 'Velg fra spillesteder', value: 'reference' },
            { title: 'Bruk eget navn', value: 'custom' },
          ],
        },
        hidden: true,
      }),
      defineField({
        name: 'venueRef',
        title: 'Spillested',
        type: 'reference',
        to: [{ type: 'venue' }],
        hidden: true,
      }),
      defineField({
        name: 'customName',
        title: 'Eget navn',
        type: 'string',
        hidden: true,
      }),
      defineField({
        name: 'includeInProgramVenueFilter',
        title: 'Ta med spillested i programfilter',
        type: 'boolean',
        initialValue: true,
        hidden: true,
      }),
    ],
  }),
  defineField({
    name: 'venue',
    title: 'Legacy spillested',
    type: 'reference',
    to: [{ type: 'venue' }],
    hidden: true,
  }),
  defineField({
    name: 'includeInProgramVenueFilter',
    title: 'Legacy programfilter',
    type: 'boolean',
    initialValue: true,
    hidden: true,
  }),
];

const legacyOccurrenceShowingFields = commonShowingFields.filter((field) => field.name !== 'eventDate');

function orderFields(
  fields: any[],
  fieldNames: string[]
): any[] {
  return fieldNames
    .map((fieldName) => fields.find((field) => field.name === fieldName))
    .filter(Boolean);
}

const orderedTopLevelShowingFields = orderFields(commonShowingFields, [
  'eventDate',
  'startTime',
  'endTime',
  'venueMode',
  'venueRef',
  'customVenueName',
  'venueDetails',
  'venue',
  'includeInProgramVenueFilter',
]);

const orderedLegacyOccurrenceShowingFields = orderFields(legacyOccurrenceShowingFields, [
  'startTime',
  'endTime',
  'venueMode',
  'venueRef',
  'customVenueName',
  'venueDetails',
  'venue',
  'includeInProgramVenueFilter',
]);

const topLevelShowingPreview = {
  select: {
    dateLabelNo: 'eventDate.title_display_no',
    dateLabelEn: 'eventDate.title_display_en',
    dateValue: 'eventDate.date',
    startTime: 'startTime',
    endTime: 'endTime',
    ticketType: 'ticketType',
    ticketStatus: 'ticketStatus',
    ticketInfoTextNo: 'ticketInfoText_no',
    ticketInfoTextEn: 'ticketInfoText_en',
    venueTitle: 'venueRef.title',
    venueName: 'venueRef.name',
    customVenueName: 'customVenueName',
    legacyVenueDetailsTitle: 'venueDetails.venueRef.title',
    legacyVenueDetailsName: 'venueDetails.venueRef.name',
    legacyCustomVenueName: 'venueDetails.customName',
    legacyVenueTitle: 'venue.title',
    legacyVenueName: 'venue.name',
  },
  prepare({
    dateLabelNo,
    dateLabelEn,
    dateValue,
    startTime,
    endTime,
    ticketType,
    ticketStatus,
    ticketInfoTextNo,
    ticketInfoTextEn,
    venueTitle,
    venueName,
    customVenueName,
    legacyVenueDetailsTitle,
    legacyVenueDetailsName,
    legacyCustomVenueName,
    legacyVenueTitle,
    legacyVenueName,
  }: Record<string, string | undefined>) {
    const dateLabel =
      dateLabelNo ||
      dateLabelEn ||
      (dateValue
        ? new Date(dateValue).toLocaleDateString('nb-NO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })
        : 'Ingen dato');
    const timeLabel = startTime && endTime ? `${startTime}–${endTime}` : startTime || 'Uten klokkeslett';
    const venueLabel =
      venueTitle ||
      venueName ||
      customVenueName ||
      legacyVenueDetailsTitle ||
      legacyVenueDetailsName ||
      legacyCustomVenueName ||
      legacyVenueTitle ||
      legacyVenueName;
    const ticketLabel =
      ticketType === 'info'
        ? ticketInfoTextNo || ticketInfoTextEn || 'Salgsinfo'
        : ticketStatus === 'sold_out'
          ? 'Utsolgt'
          : ticketStatus === 'low_stock'
            ? 'Få billetter'
            : ticketStatus === 'available'
              ? 'Billetter tilgjengelig'
              : '';

    return {
      title: `${dateLabel} • ${timeLabel}`,
      subtitle: ticketLabel
        ? venueLabel ? `${venueLabel} • ${ticketLabel}` : ticketLabel
        : venueLabel || undefined,
    };
  },
};

const legacyOccurrenceShowingPreview = {
  select: {
    startTime: 'startTime',
    endTime: 'endTime',
    ticketType: 'ticketType',
    ticketStatus: 'ticketStatus',
    ticketInfoTextNo: 'ticketInfoText_no',
    ticketInfoTextEn: 'ticketInfoText_en',
    venueTitle: 'venueRef.title',
    venueName: 'venueRef.name',
    customVenueName: 'customVenueName',
    legacyVenueDetailsTitle: 'venueDetails.venueRef.title',
    legacyVenueDetailsName: 'venueDetails.venueRef.name',
    legacyCustomVenueName: 'venueDetails.customName',
    legacyVenueTitle: 'venue.title',
    legacyVenueName: 'venue.name',
  },
  prepare({
    startTime,
    endTime,
    ticketType,
    ticketStatus,
    ticketInfoTextNo,
    ticketInfoTextEn,
    venueTitle,
    venueName,
    customVenueName,
    legacyVenueDetailsTitle,
    legacyVenueDetailsName,
    legacyCustomVenueName,
    legacyVenueTitle,
    legacyVenueName,
  }: Record<string, string | undefined>) {
    const title = startTime && endTime ? `${startTime}–${endTime}` : startTime || 'Uten klokkeslett';
    const venueLabel =
      venueTitle ||
      venueName ||
      customVenueName ||
      legacyVenueDetailsTitle ||
      legacyVenueDetailsName ||
      legacyCustomVenueName ||
      legacyVenueTitle ||
      legacyVenueName;
    const subtitle =
      ticketType === 'info'
        ? ticketInfoTextNo || ticketInfoTextEn || 'Salgsinfo'
        : ticketStatus === 'sold_out'
          ? 'Utsolgt'
          : ticketStatus === 'low_stock'
            ? 'Få billetter'
            : ticketStatus === 'available'
              ? 'Billetter tilgjengelig'
              : '';

    return {
      title,
      subtitle: subtitle
        ? venueLabel ? `${venueLabel} • ${subtitle}` : subtitle
        : venueLabel || undefined,
    };
  },
};

const showingFields = [
  defineField({
    name: 'ticketType',
    title: 'Type billettvisning',
    type: 'string',
    options: {
      list: [
        { title: 'Legg til kjøpsknapp', value: 'button' },
        { title: 'Legg til salgsinfo (gratis, salgstart, etc.)', value: 'info' },
      ],
      layout: 'radio',
    },
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as Record<string, any> | undefined;
        const document = context.document as Record<string, any> | undefined;

        if (
          isPerShowingTicketing(document) &&
          (isPublishedDocument(document) || showingHasAnyContent(parent)) &&
          !value
        ) {
          return 'Velg type billettvisning';
        }

        return true;
      }).warning('Velg type billettvisning'),
    hidden: ({ document }) => !isPerShowingTicketing(document as Record<string, any> | undefined),
  }),
  defineField({
    name: 'ticketUrl',
    title: 'Billett-URL',
    type: 'url',
    description: 'Link til billettsystem for denne forestillingen',
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const ticketType = (context.parent as any)?.ticketType;
        const document = context.document as Record<string, any> | undefined;
        if (ticketType === 'button' && !value) {
          return isPublishedDocument(document)
            ? 'Billett-URL er påkrevd når du velger kjøpsknapp'
            : 'Legg til Billett-URL når denne forestillingen er klar';
        }
        if (value) {
          return componentValidation.url(Rule).validate(value, context);
        }
        return true;
      }).warning('Billett-URL er påkrevd når du velger kjøpsknapp'),
    hidden: ({ parent, document }) =>
      !isPerShowingTicketing(document as Record<string, any> | undefined) ||
      (parent as any)?.ticketType !== 'button',
  }),
  defineField({
    name: 'ticketInfoText_no',
    title: 'Billett-informasjon (norsk)',
    type: 'string',
    description:
      'Tekst som vises istedenfor knapp, f.eks. "Gratis" eller "Salget starter snart"',
    placeholder: 'Gratis',
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const parent = context.parent as Record<string, any> | undefined;
        const ticketType = parent?.ticketType;
        const document = context.document as Record<string, any> | undefined;
        if (ticketType === 'info' && !value) {
          return isPublishedDocument(document)
            ? 'Billett-informasjon på norsk er påkrevd når du velger salgsinfo'
            : 'Legg til norsk billett-informasjon når denne forestillingen er klar';
        }
        return true;
      }).warning('Billett-informasjon på norsk er påkrevd når du velger salgsinfo'),
    hidden: ({ parent, document }) =>
      !isPerShowingTicketing(document as Record<string, any> | undefined) ||
      (parent as any)?.ticketType !== 'info',
  }),
  defineField({
    name: 'ticketInfoText_en',
    title: 'Billett-informasjon (engelsk)',
    type: 'string',
    description: 'Valgfri engelsk variant av billettinformasjonen',
    placeholder: 'Free',
    validation: (Rule) => Rule.max(50).warning('Teksten bør være maksimum 50 tegn'),
    hidden: ({ parent, document }) =>
      !isPerShowingTicketing(document as Record<string, any> | undefined) ||
      (parent as any)?.ticketType !== 'info',
  }),
  defineField({
    name: 'ticketStatus',
    title: 'Billettstatus',
    type: 'string',
    description: 'Viser tilgjengelighet av billetter for denne forestillingen',
    options: {
      list: [
        { title: 'Billetter tilgjengelig', value: 'available' },
        { title: 'Få billetter igjen', value: 'low_stock' },
        { title: 'Utsolgt', value: 'sold_out' },
      ],
      layout: 'radio',
    },
    validation: (Rule) =>
      Rule.custom((value, context) => {
        const ticketType = (context.parent as any)?.ticketType;
        const document = context.document as Record<string, any> | undefined;
        if (ticketType === 'button' && !value) {
          return isPublishedDocument(document)
            ? 'Billettstatus er påkrevd når du velger kjøpsknapp'
            : 'Velg billettstatus når denne forestillingen er klar';
        }
        return true;
      }).warning('Billettstatus er påkrevd når du velger kjøpsknapp'),
    hidden: ({ parent, document }) =>
      !isPerShowingTicketing(document as Record<string, any> | undefined) ||
      (parent as any)?.ticketType !== 'button',
  }),
];

export const event = defineType({
  name: 'event',
  title: 'Arrangementer',
  type: 'document',
  icon: CalendarIcon,

  orderings: [
    {
      title: 'Dato og klokkeslett',
      name: 'dateTimeAsc',
      by: [
        { field: 'eventDateValue', direction: 'asc' },
        { field: 'eventStartTimeValue', direction: 'asc' },
        { field: 'title_no', direction: 'asc' },
      ],
    },
    {
      title: 'Klokkeslett',
      name: 'timeAsc',
      by: [{ field: 'eventStartTimeValue', direction: 'asc' }],
    },
    { title: 'Navn A–Å', name: 'nameAsc', by: [{ field: 'title_no', direction: 'asc' }] },
    {
      title: 'Nylig opprettet',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
  groups: [
    {
      name: 'basic',
      title: 'Felles innhold',
      icon: CogIcon,
      default: true,
    },
    {
      name: 'no',
      title: 'Norsk (NO)',
      icon: ComposeIcon,
    },
    {
      name: 'en',
      title: 'English (EN)',
      icon: ComposeIcon,
    },
    {
      name: 'schedule',
      title: 'Tid og sted',
      icon: CalendarIcon,
    },
    imageGroup,
    {
      name: 'ticketing',
      title: 'Billetter',
      icon: CreditCardIcon,
    },
    publishingGroup,
    seoGroup,
  ],
  fieldsets: [...imageFieldsets],
  fields: [
    defineField({
      name: 'showings',
      title: 'Legg til forestillinger',
      type: 'array',
      group: 'schedule',
      components: {
        input: EventShowingsInput,
      },
      description:
        'Et tidspunkt og spillested per forestilling.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const document = context.document as Record<string, any> | undefined;
          const hasLegacySchedule =
            Boolean(document?.eventDate?._ref) && Boolean(document?.eventTime?.startTime);

          if (isPublishedDocument(document) && (!Array.isArray(value) || value.length === 0) && !hasLegacySchedule && !hasLegacyOccurrences(document)) {
            return 'Legg til minst én forestilling';
          }

          return true;
        }).warning('Legg til minst én forestilling'),
      of: [
        {
          type: 'object',
          name: 'eventShowing',
          title: 'Forestilling',
          options: {
            modal: { type: 'dialog', width: 3 },
          },
          fieldsets: [
            {
              name: 'times',
              title: 'Tidspunkt',
              options: { columns: 2 },
            },
          ],
          fields: [...orderedTopLevelShowingFields, ...showingFields],
          preview: topLevelShowingPreview,
        },
      ],
    }),
    defineField({
      name: 'occurrences',
      title: 'Legacy spilledager',
      type: 'array',
      group: 'schedule',
      hidden: true,
      of: [
        {
          type: 'object',
          name: 'eventOccurrence',
          title: 'Spilledag',
          fields: [
            defineField({
              name: 'eventDate',
              title: 'Dato',
              type: 'reference',
              to: [{ type: 'eventDate' }],
              options: {
                sort: [{ field: 'date', direction: 'asc' }],
              } as any,
            }),
            defineField({
              name: 'showings',
              title: 'Forestillinger',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'legacyEventShowing',
                  title: 'Forestilling',
                  fieldsets: [
                    {
                      name: 'times',
                      title: 'Tidspunkt',
                      options: { columns: 2 },
                    },
                  ],
                  fields: [...orderedLegacyOccurrenceShowingFields, ...showingFields],
                  preview: legacyOccurrenceShowingPreview,
                },
              ],
            }),
          ],
        },
      ],
    }),

    // Legacy single-performance schedule fields, kept temporarily for migration.
    defineField({
      name: 'ticketingMode',
      title: 'Billettmodus',
      type: 'string',
      group: 'ticketing',
      initialValue: 'shared',
      options: {
        list: [
          { title: 'Én felles billettlenke for alle spilletidspunkt', value: 'shared' },
          { title: 'Eget billettvalg per forestilling', value: 'per_showing' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().warning('Velg hvordan billettsalget skal håndteres'),
    }),
    defineField({
      name: 'eventDate',
      title: 'Dato',
      type: 'reference',
      to: [{ type: 'eventDate' }],
      description:
        'Legacy-felt for eldre arrangementer. Nye eller gjentatte arrangementer skal bruke Spilletider.',
      group: 'basic',
      options: {
        sort: [{ field: 'date', direction: 'asc' }],
      } as any,
      validation: (Rule) =>
        Rule.warning().custom((value) => {
          if (!value) {
            return 'Dato må velges';
          }
          return true;
        }),
      hidden: ({ document }) => hasScheduleEntries(document as Record<string, any> | undefined),
    }),
    defineField({
      name: 'eventTime',
      title: 'Klokkeslett',
      type: 'object',
      group: 'basic',
      hidden: ({ document }) => hasScheduleEntries(document as Record<string, any> | undefined),
      fieldsets: [
        {
          name: 'times',
          options: { columns: 2 },
        },
      ],
      fields: [
        {
          name: 'startTime',
          title: 'Starttidspunkt',
          type: 'string',
          fieldset: 'times',
          options: {
            list: eventTimeOptions,
          },
          validation: (Rule) =>
            Rule.warning().custom((value, context) => {
              if (!value && context.document?.publishingStatus === 'published') {
                return 'Starttidspunkt bør fylles ut før publisering';
              }
              return true;
            }),
        },
        {
          name: 'endTime',
          title: 'Sluttidspunkt',
          type: 'string',
          fieldset: 'times',
          options: {
            list: eventTimeOptions,
          },
          validation: (Rule) =>
            Rule.warning().custom((value, context) => {
              if (!value && context.document?.publishingStatus === 'published') {
                return 'Sluttidspunkt bør fylles ut før publisering';
              }
              return true;
            }),
        },
      ],
      validation: (Rule) =>
        Rule.warning().custom((value, context) => {
          if (
            (!value?.startTime || !value?.endTime) &&
            context.document?.publishingStatus === 'published'
          ) {
            return 'Klokkeslett bør fylles ut før publisering';
          }
          return true;
        }),
    }),
    defineField({
      name: 'eventDateValue',
      title: 'Dato (for sortering)',
      type: 'date',
      description: 'Synkroniseres automatisk fra første spilledag for korrekt sortering',
      group: 'basic',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'eventStartTimeValue',
      title: 'Starttid (for sortering)',
      type: 'string',
      description: 'Synkroniseres automatisk fra første forestilling for korrekt sortering',
      group: 'basic',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'venue',
      title: 'Spillested',
      type: 'reference',
      to: [{ type: 'venue' }],
      description:
        'Legacy-felt for eldre arrangementer. Nye eller gjentatte arrangementer skal bruke spillested per forestilling.',
      group: 'basic',
      validation: (Rule) =>
        Rule.warning().custom((value) => {
          if (!value) {
            return 'Spillested må velges';
          }
          return true;
        }),
      hidden: ({ document }) => hasScheduleEntries(document as Record<string, any> | undefined),
    }),
    defineField({
      name: 'artist',
      title: 'Artister',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'artist' }],
        },
      ],
      description: 'Velg artister som opptrer på arrangementet',
      group: 'basic',
      components: {
        input: MultiSelectReferenceInput,
      },
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
    defineField({
      name: 'composers',
      title: 'Komponister',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'composer' }],
        },
      ],
      description: 'Velg komponister som har skrevet musikken som spilles på arrangementet',
      group: 'basic',
      components: {
        input: MultiSelectReferenceInput,
      },
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
    defineField({
      name: 'spotifyItems',
      title: 'Spotify-innhold',
      type: 'array',
      of: [{ type: 'spotifyComponent' }],
      description: 'Legg til Spotify-spor, album eller spillelister',
      group: 'basic',
      validation: (Rule) => Rule.max(8).warning('Maks 8 Spotify-elementer anbefalt'),
    }),
    defineField({
      name: 'ticketType',
      title: 'Type billettvisning',
      type: 'string',
      description: 'Brukes når arrangementet har én felles billettlenke for alle forestillinger.',
      group: 'ticketing',
      options: {
        list: [
          { title: 'Legg til kjøpsknapp', value: 'button' },
          { title: 'Legg til salgsinfo (gratis, salgstart, etc.)', value: 'info' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('Velg type billettvisning'),
      initialValue: 'button',
      hidden: ({ document }) => isPerShowingTicketing(document as Record<string, any> | undefined),
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Billett-URL',
      type: 'url',
      description: 'Felles lenke til billettsystem for hele arrangementet',
      group: 'ticketing',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const ticketType = (context.document as any)?.ticketType;
          if (ticketType === 'button' && !value) {
            return 'Billett-URL er påkrevd når du velger kjøpsknapp';
          }
          if (value) {
            return componentValidation.url(Rule).validate(value, context);
          }
          return true;
        }).error('Billett-URL er påkrevd når du velger kjøpsknapp'),
      hidden: ({ document }) =>
        isPerShowingTicketing(document as Record<string, any> | undefined) || document?.ticketType !== 'button',
    }),
    defineField({
      name: 'ticketInfoText_no',
      title: 'Billett-informasjon (norsk)',
      type: 'string',
      description:
        'Tekst som vises istedenfor knapp, f.eks. "Gratis" eller "Salget starter snart"',
      group: 'ticketing',
      placeholder: 'Gratis',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const ticketType = (context.document as any)?.ticketType;
          if (ticketType === 'info' && !value) {
            return 'Billett-informasjon på norsk er påkrevd når du velger salgsinfo';
          }
          return true;
        })
          .error('Billett-informasjon på norsk er påkrevd når du velger salgsinfo'),
      hidden: ({ document }) =>
        isPerShowingTicketing(document as Record<string, any> | undefined) || document?.ticketType !== 'info',
    }),
    defineField({
      name: 'ticketInfoText_en',
      title: 'Billett-informasjon (engelsk)',
      type: 'string',
      description: 'Valgfri engelsk variant av billettinformasjonen',
      group: 'ticketing',
      placeholder: 'Free',
      validation: (Rule) => Rule.max(50).warning('Teksten bør være maksimum 50 tegn'),
      hidden: ({ document }) =>
        isPerShowingTicketing(document as Record<string, any> | undefined) || document?.ticketType !== 'info',
    }),
    defineField({
      name: 'ticketStatus',
      title: 'Billettstatus',
      type: 'string',
      description: 'Viser tilgjengelighet av billetter',
      group: 'ticketing',
      options: {
        list: [
          { title: 'Billetter tilgjengelig', value: 'available' },
          { title: 'Få billetter igjen', value: 'low_stock' },
          { title: 'Utsolgt', value: 'sold_out' },
        ],
        layout: 'radio',
      },
      initialValue: 'available',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const ticketType = (context.document as any)?.ticketType;
          if (ticketType === 'button' && !value) {
            return 'Billettstatus er påkrevd når du velger kjøpsknapp';
          }
          return true;
        }),
      hidden: ({ document }) =>
        isPerShowingTicketing(document as Record<string, any> | undefined) || document?.ticketType !== 'button',
    }),
    ...multilingualImageFields('image'),

    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Navn på arrangement (norsk)',
      type: 'string',
      description: 'Arrangementsnavn på norsk',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL-vennlig versjon av norsk arrangementsnavn',
      group: 'no',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          const slugValidation = await eventSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description:
        'Kort beskrivelse av arrangementet på norsk. Maksimum 60 tegn (inkludert mellomrom)',
      group: 'no',
      rows: 2,
      validation: (Rule) => Rule.max(60).warning('Ingressen bør være maksimum 60 tegn'),
    }),
    defineField({
      name: 'description_no',
      title: 'Om konserten (norsk)',
      type: 'portableText',
      description: 'Hovedtekst om konserten på norsk (obligatorisk, maks 500 tegn)',
      group: 'no',
      validation: (Rule) =>
        Rule.required()
          .error('Beskrivelse av konserten må fylles ut')
          .custom((value: any) => {
            if (!value) return true;
            const text = value
              .filter((block: any) => block._type === 'block')
              .map(
                (block: any) => block.children?.map((child: any) => child.text || '').join('') || ''
              )
              .join('');
            if (text.length > 500) {
              return `Beskrivelsen er ${text.length} tegn. Maks 500 tegn tillatt.`;
            }
            return true;
          }),
    }),
    defineField({
      name: 'extraContent_no',
      title: 'Ekstra innhold (norsk)',
      type: 'pageBuilder',
      description: 'Valgfritt ekstra innhold - video, sitater, etc.',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Event name (English)',
      type: 'string',
      description: 'Event name in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL-friendly version of English event name',
      group: 'en',
      options: {
        source: 'title_en',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          const doc = context.document as any;
          const hasEnglishContent =
            doc?.title_en ||
            doc?.excerpt_en ||
            doc?.description_en ||
            (doc?.extraContent_en && doc.extraContent_en.length > 0);

          if (hasEnglishContent && !value?.current) {
            return 'URL (English) må settes når engelsk innhold er fylt ut';
          }

          if (!value?.current) {
            return true;
          }

          const slugValidation = await eventSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
          if (!slugRegex.test(value.current)) {
            return 'URL må bare inneholde små bokstaver, tall og bindestreker';
          }

          return true;
        }),
    }),
    defineField({
      name: 'excerpt_en',
      title: 'Excerpt (English)',
      type: 'text',
      description:
        'Short description of the event in English. Maximum 60 characters (including spaces)',
      group: 'en',
      rows: 2,
      validation: (Rule) => Rule.max(60).warning('Excerpt should be maximum 60 characters'),
    }),
    defineField({
      name: 'description_en',
      title: 'About the concert (English)',
      type: 'portableText',
      description: 'Main text about the concert in English (optional, max 500 characters)',
      group: 'en',
      validation: (Rule) =>
        Rule.custom((value: any) => {
          if (!value) return true;
          const text = value
            .filter((block: any) => block._type === 'block')
            .map(
              (block: any) => block.children?.map((child: any) => child.text || '').join('') || ''
            )
            .join('');
          if (text.length > 500) {
            return `Description is ${text.length} characters. Max 500 allowed.`;
          }
          return true;
        }),
    }),
    defineField({
      name: 'extraContent_en',
      title: 'Extra content (English)',
      type: 'pageBuilder',
      description: 'Optional extra content - videos, quotes, etc.',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('extraContent_no'),
      },
    }),
    ...publishingFields('publishing', 'arrangementet'),
    ...seoFields,
  ],
  preview: {
    select: {
      title_no: 'title_no',
      title_en: 'title_en',
      media: 'image',
      showings: 'showings',
      occurrences: 'occurrences',
      eventDate: 'eventDate',
      eventDateValue: 'eventDateValue',
      eventStartTimeValue: 'eventStartTimeValue',
      _id: '_id',
    },
    prepare(selection) {
      const {
        title_no,
        title_en,
        media,
        showings,
        occurrences,
        eventDate,
        eventDateValue,
        eventStartTimeValue,
        _id,
      } = selection;

      const isPublished = _id && !_id.startsWith('drafts.');
      const statusText = isPublished ? 'Publisert' : 'Utkast';
      const title = title_no || title_en || 'Uten navn';
      const hasMultipleDatesOrTimes = getEventScheduleEntryCount({
        showings,
        occurrences,
        eventDate,
      }) > 1;

      const resolvedDateLabel =
        eventDateValue
          ? new Date(eventDateValue).toLocaleDateString('nb-NO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })
          : 'Ingen dato';

      const resolvedStartTime = eventStartTimeValue;
      const timeText = resolvedStartTime ? ` kl. ${resolvedStartTime}` : '';
      const langStatus = getLanguageStatus({ title_no, title_en });
      const scheduleLabel = hasMultipleDatesOrTimes
        ? 'Flere forestillinger'
        : `${resolvedDateLabel}${timeText}`;
      const subtitleParts = [
        scheduleLabel,
        langStatus !== 'Ingen språk valgt' ? langStatus : '',
        statusText,
      ].filter(Boolean);

      return {
        title,
        subtitle: subtitleParts.join(' • '),
        media,
      };
    },
  },
});
