import {defineField, defineType} from 'sanity'
import {UserIcon, ComposeIcon, CogIcon, ImageIcon} from '@sanity/icons'
import {createMirrorPortableTextInput} from '../../components/inputs/MirrorPortableTextInput'
import {multilingualImageFields, imageFieldsets, imageGroup} from '../shared/imageFields'
import {seoFields, seoGroup} from '../objects/seoFields'
import {componentValidation, crossFieldValidation} from '../shared/validation'
import {artistSlugValidation} from '../../lib/slugValidation'
import type {ArtistData, ValidationRule, MultilingualDocument} from '../shared/types'
import {getPublishingStatusText, getLanguageStatus} from '../shared/previewHelpers'
import {publishingFields, publishingGroup} from '../shared/publishingFields'
import {excludeAlreadySelected} from '../shared/referenceFilters'

export const artist = defineType({
  name: 'artist',
  title: 'Artister',
  type: 'document',
  icon: UserIcon,
  orderings: [
    { title: 'Navn A–Å', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
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
    publishingGroup,
    seoGroup,
  ],
  fieldsets: [
    ...imageFieldsets,
  ],
  fields: [
    // BASE (shared content)
    defineField({
      name: 'name',
      title: 'Navn på artist',
      type: 'string',
      description: 'Artistnavn (samme på alle språk)',
      validation: componentValidation.title,
      group: 'basic',
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'URL-vennlig versjon av artistnavn (f.eks. "kunstner-navn"). Samme på alle språk.',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // Først sjekk avansert slug-validering for unikhet
          const slugValidation = await artistSlugValidation(value, context)
          if (slugValidation !== true) return slugValidation

          // Så sjekk standard slug-validering
          return componentValidation.slug(Rule).validate(value, context)
        }),
      group: 'basic',
    }),

    // NORSK INNHOLD
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse på norsk (vises i lister)',
      rows: 2,
      validation: componentValidation.description,
      group: 'no',
    }),
    defineField({
      name: 'instrument_no',
      title: 'Instrument (norsk)',
      type: 'string',
      description: 'Instrumentbeskrivelse på norsk',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'content_no',
      title: 'Artistinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk artist-side med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'excerpt_en',
      title: 'Excerpt (English)',
      type: 'text',
      description: 'Short description in English (shown in lists)',
      rows: 2,
      validation: componentValidation.description,
      group: 'en',
    }),
    defineField({
      name: 'instrument_en',
      title: 'Instrument (English)',
      type: 'string',
      description: 'Instrument description in English',
      group: 'en',
    }),
    defineField({
      name: 'content_en',
      title: 'Artist content (English)',
      type: 'pageBuilder',
      description: 'Build English artist page with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no')
      },
    }),
    ...multilingualImageFields('image'),
    ...publishingFields('publishing', 'artisten'),
    defineField({
      name: 'events',
      title: 'Arrangementer',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'event'}],
        }
      ],
      description: 'Velg arrangementer som denne artisten opptrer på',
      group: 'basic',
      validation: (Rule) => Rule.unique(),
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
    ...seoFields,
  ],
  preview: {
    select: {
      name: 'name',
      instrument_no: 'instrument_no',
      instrument_en: 'instrument_en',
      publishingStatus: 'publishingStatus',
      scheduledStart: 'scheduledPeriod.startDate',
      scheduledEnd: 'scheduledPeriod.endDate',
      media: 'image',
      hasNorwegian: 'content_no',
      hasEnglish: 'content_en',
      excerpt_no: 'excerpt_no',
      excerpt_en: 'excerpt_en',
      _id: '_id',
    },
    prepare({name, instrument_no, instrument_en, publishingStatus, scheduledStart, scheduledEnd, media, hasNorwegian, hasEnglish, excerpt_no, excerpt_en, _id}) {
      // Use shared helper functions for consistent status display
      const statusText = getPublishingStatusText(_id, publishingStatus, scheduledStart, scheduledEnd)
      const langStatus = getLanguageStatus({
        hasNorwegian,
        hasEnglish,
        excerpt_no,
        excerpt_en,
        instrument_no,
        instrument_en,
      })

      const instrument = instrument_no || instrument_en || 'Ukjent instrument'

      return {
        title: name,
        subtitle: `${instrument} • ${statusText} • ${langStatus}`,
        media: media || UserIcon,
      }
    },
  },
})
