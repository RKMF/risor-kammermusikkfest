import {defineField, defineType} from 'sanity'
import {CalendarIcon, ComposeIcon} from '@sanity/icons'
import {createMirrorPortableTextInput} from '../../components/inputs/MirrorPortableTextInput'
import {componentValidation} from '../shared/validation'
import type {ProgramPageData} from '../shared/types'
import {excludeAlreadySelected} from '../shared/referenceFilters'
import {MultiSelectReferenceInput} from '../components/inputs/MultiSelectReferenceInput'
import {getLanguageStatus} from '../shared/previewHelpers'

export const programPage = defineType({
  name: 'programPage',
  title: 'Programoversikt',
  type: 'document',
  icon: CalendarIcon,
  __experimental_formPreviewTitle: false,
  groups: [
    {
      name: 'no',
      title: 'Norsk (NO)',
      icon: ComposeIcon,
      default: true,
    },
    {
      name: 'en',
      title: 'English (EN)',
      icon: ComposeIcon,
    },
    {
      name: 'events',
      title: 'Arrangementer',
      icon: CalendarIcon,
    },
  ],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Tittel (norsk)',
      type: 'string',
      description: 'Tittel på programoversikten på norsk',
      initialValue: 'Program',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL for norsk programoversikt (anbefalt: "program")',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      initialValue: {current: 'program'},
      validation: componentValidation.slug,
      group: 'no',
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av programoversikten på norsk',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'no',
    }),
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk programoversikt med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      description: 'Program overview title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL for English program overview (recommended: "program")',
      options: {
        source: 'title_en',
        maxLength: 96,
      },
      validation: componentValidation.slug,
      group: 'en',
    }),
    defineField({
      name: 'excerpt_en',
      title: 'Excerpt (English)',
      type: 'text',
      description: 'Short description of the program overview in English',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'en',
    }),
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description: 'Build English program overview with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no')
      },
    }),

    // ARRANGEMENTER (DELT)
    defineField({
      name: 'selectedEvents',
      title: 'Valgte arrangementer',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'event'}],
        }
      ],
      description: 'Velg arrangementer som skal vises på programoversikten (vises på begge språk)',
      group: 'events',
      components: {
        input: MultiSelectReferenceInput,
      },
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
  ],
  preview: {
    select: {
      title_no: 'title_no',
      title_en: 'title_en',
      slug_no: 'slug_no.current',
      slug_en: 'slug_en.current',
      hasNorwegian: 'content_no',
      hasEnglish: 'content_en',
    },
    prepare({title_no, title_en, slug_no, slug_en, hasNorwegian, hasEnglish}) {
      // Language status using shared helper
      const langStatus = getLanguageStatus({title_no, title_en, hasNorwegian, hasEnglish});

      const title = title_no || title_en || 'Programoversikt';
      const slug = slug_no || slug_en || 'program';

      return {
        title: title,
        subtitle: `/${slug} • ${langStatus}`,
        media: CalendarIcon,
      };
    },
  },
})
