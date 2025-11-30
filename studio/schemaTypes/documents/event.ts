import {defineField, defineType} from 'sanity'
import {CalendarIcon, ImageIcon, UsersIcon, ClockIcon, LinkIcon, ComposeIcon, CogIcon, CreditCardIcon} from '@sanity/icons'
import {imageComponent} from '../components/Image'
import {eventTimeOptions} from '../../lib/timeUtils'
import {createMirrorPortableTextInput} from '../../components/inputs/MirrorPortableTextInput'
import {multilingualImageFields, imageFieldsets, imageGroup} from '../shared/imageFields'
import {seoFields, seoGroup} from '../objects/seoFields'
import {componentValidation, crossFieldValidation} from '../shared/validation'
import {eventSlugValidation} from '../../lib/slugValidation'
import type {EventData, ValidationRule, MultilingualDocument} from '../shared/types'
import {getLanguageStatus} from '../shared/previewHelpers'
import {publishingFields, publishingGroup} from '../shared/publishingFields'
import {excludeAlreadySelected} from '../shared/referenceFilters'
import {MultiSelectReferenceInput} from '../components/inputs/MultiSelectReferenceInput'

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
        { field: 'eventTime.startTime', direction: 'asc' }
      ]
    },
    {
      title: 'Klokkeslett',
      name: 'timeAsc',
      by: [
        { field: 'eventTime.startTime', direction: 'asc' }
      ]
    },
    { title: 'Navn A–Å', name: 'nameAsc', by: [{ field: 'title_no', direction: 'asc' }] },
    { title: 'Nylig opprettet', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
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
    imageGroup,
    {
      name: 'ticketing',
      title: 'Billett-info',
      icon: CreditCardIcon,
    },
    publishingGroup,
    seoGroup,
  ],
  fieldsets: [
    ...imageFieldsets,
  ],
  fields: [
    // FELLES INNHOLD (shared content)
    defineField({
      name: 'eventDate',
      title: 'Dato',
      type: 'reference',
      to: [{type: 'eventDate'}],
      description: 'Velg fra de konfigurerte festivaldatoene',
      group: 'basic',
      options: {
        sort: [{field: 'date', direction: 'asc'}],
      },
      validation: (Rule) => Rule.warning().custom((value) => {
        if (!value) {
          return 'Dato må velges'
        }
        return true
      }),
    }),
    defineField({
      name: 'eventTime',
      title: 'Klokkeslett',
      type: 'object',
      group: 'basic',
      fieldsets: [
        {
          name: 'times',
          options: {columns: 2},
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
          validation: (Rule) => Rule.warning().custom((value, context) => {
            if (!value && context.document?.publishingStatus === 'published') {
              return 'Starttidspunkt bør fylles ut før publisering'
            }
            return true
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
          validation: (Rule) => Rule.warning().custom((value, context) => {
            if (!value && context.document?.publishingStatus === 'published') {
              return 'Sluttidspunkt bør fylles ut før publisering'
            }
            return true
          }),
        },
      ],
      validation: (Rule) => Rule.warning().custom((value, context) => {
        if ((!value?.startTime || !value?.endTime) && context.document?.publishingStatus === 'published') {
          return 'Klokkeslett bør fylles ut før publisering'
        }
        return true
      }),
    }),
    defineField({
      name: 'eventDateValue',
      title: 'Dato (for sortering)',
      type: 'date',
      description: 'Synkroniseres automatisk fra festivaldato for korrekt sortering',
      group: 'basic',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'venue',
      title: 'Spillested',
      type: 'reference',
      to: [{type: 'venue'}],
      description: 'Velg spillestedet for arrangementet',
      group: 'basic',
      validation: (Rule) => Rule.warning().custom((value) => {
        if (!value) {
          return 'Spillested må velges'
        }
        return true
      }),
    }),
    defineField({
      name: 'artist',
      title: 'Artister',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'artist'}],
        }
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
          to: [{type: 'composer'}],
        }
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
      name: 'ticketType',
      title: 'Type billettvisning',
      type: 'string',
      description: 'Velg om du vil vise kjøpsknapp eller kun tekst-informasjon',
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
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Billett-URL',
      type: 'url',
      description: 'Link til billettsystem (påkrevd for kjøpsknapp)',
      group: 'ticketing',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const ticketType = (context.document as any)?.ticketType
          if (ticketType === 'button' && !value) {
            return 'Billett-URL er påkrevd når du velger kjøpsknapp'
          }
          if (value) {
            return componentValidation.url(Rule).validate(value, context)
          }
          return true
        }).error('Billett-URL er påkrevd når du velger kjøpsknapp'),
      hidden: ({ document }) => document?.ticketType !== 'button',
    }),
    defineField({
      name: 'ticketInfoText',
      title: 'Billett-informasjon',
      type: 'string',
      description: 'Tekst som vises istedenfor knapp, f.eks. "Gratis" eller "Salget starter snart"',
      group: 'ticketing',
      placeholder: 'Gratis',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const ticketType = (context.document as any)?.ticketType
          if (ticketType === 'info' && !value) {
            return 'Billett-informasjon er påkrevd når du velger salgsinfo'
          }
          return true
        }).error('Billett-informasjon er påkrevd når du velger salgsinfo')
        .max(50).warning('Teksten bør være maksimum 50 tegn'),
      hidden: ({ document }) => document?.ticketType !== 'info',
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
          const ticketType = (context.document as any)?.ticketType
          if (ticketType === 'button' && !value) {
            return 'Billettstatus er påkrevd når du velger kjøpsknapp'
          }
          return true
        }),
      hidden: ({ document }) => document?.ticketType !== 'button',
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
          // Først sjekk avansert slug-validering for unikhet
          const slugValidation = await eventSlugValidation(value, context)
          if (slugValidation !== true) return slugValidation

          // Så sjekk standard slug-validering
          return componentValidation.slug(Rule).validate(value, context)
        }),
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av arrangementet på norsk. Maksimum 60 tegn (inkludert mellomrom)',
      group: 'no',
      rows: 2,
      validation: (Rule) => Rule.max(60).warning('Ingressen bør være maksimum 60 tegn'),
    }),
    defineField({
      name: 'description_no',
      title: 'Om konserten (norsk)',
      type: 'text',
      description: 'Hovedtekst om konserten på norsk (obligatorisk)',
      group: 'no',
      rows: 8,
      validation: (Rule) => Rule.required().error('Beskrivelse av konserten må fylles ut'),
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
          const doc = context.document as any
          const hasEnglishContent = doc?.title_en || doc?.excerpt_en || doc?.description_en || (doc?.extraContent_en && doc.extraContent_en.length > 0)

          if (hasEnglishContent && !value?.current) {
            return 'URL (English) må settes når engelsk innhold er fylt ut'
          }

          if (!value?.current) {
            return true
          }

          const slugValidation = await eventSlugValidation(value, context)
          if (slugValidation !== true) return slugValidation

          const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
          if (!slugRegex.test(value.current)) {
            return 'URL må bare inneholde små bokstaver, tall og bindestreker'
          }

          return true
        }),
    }),
    defineField({
      name: 'excerpt_en',
      title: 'Excerpt (English)',
      type: 'text',
      description: 'Short description of the event in English. Maximum 60 characters (including spaces)',
      group: 'en',
      rows: 2,
      validation: (Rule) => Rule.max(60).warning('Excerpt should be maximum 60 characters'),
    }),
    defineField({
      name: 'description_en',
      title: 'About the concert (English)',
      type: 'text',
      description: 'Main text about the concert in English (optional)',
      group: 'en',
      rows: 8,
    }),
    defineField({
      name: 'extraContent_en',
      title: 'Extra content (English)',
      type: 'pageBuilder',
      description: 'Optional extra content - videos, quotes, etc.',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('extraContent_no')
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
      eventDate: 'eventDate.title',
      eventDateDate: 'eventDate.date',
      startTime: 'eventTime.startTime',
      _id: '_id',
    },
    prepare(selection) {
      const {title_no, title_en, media, eventDate, eventDateDate, startTime, _id} = selection

      const isPublished = _id && !_id.startsWith('drafts.')
      const statusText = isPublished ? 'Publisert' : 'Utkast'
      const title = title_no || title_en || 'Uten navn'

      // Date and time info
      const dateString = eventDateDate
        ? new Date(eventDateDate).toLocaleDateString('nb-NO')
        : null
      const dateLabel = eventDate && dateString ? `${eventDate} (${dateString})` : (dateString || 'Ingen dato')
      const timeText = startTime ? ` kl. ${startTime}` : ''
      const dateTimeText = `${dateLabel}${timeText}`

      // Language flags based on which languages have content
      const langStatus = getLanguageStatus({title_no, title_en})
      const flagsText = langStatus !== 'Ingen språk valgt' ? langStatus + ' • ' : ''

      return {
        title: title,
        subtitle: `${dateTimeText}\n${flagsText}${statusText}`,
        media: media,
      }
    },
  },
})
