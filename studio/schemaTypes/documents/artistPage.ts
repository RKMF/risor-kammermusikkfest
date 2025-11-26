import {defineField, defineType} from 'sanity'
import {UsersIcon, ComposeIcon, UserIcon} from '@sanity/icons'
import {createMirrorPortableTextInput} from '../../components/inputs/MirrorPortableTextInput'
import {componentValidation} from '../shared/validation'
import type {ArtistPageData} from '../shared/types'
import {excludeAlreadySelected} from '../shared/referenceFilters'
import {MultiSelectReferenceInput} from '../components/inputs/MultiSelectReferenceInput'

export const artistPage = defineType({
  name: 'artistPage',
  title: 'Artistoversikt',
  type: 'document',
  icon: UsersIcon,
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
      name: 'artists',
      title: 'Artister',
      icon: UserIcon,
    },
  ],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Tittel (norsk)',
      type: 'string',
      description: 'Tittel på artistoversikten på norsk',
      initialValue: 'Artister',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL for norsk artistoversikt (anbefalt: "artister")',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      initialValue: {current: 'artister'},
      validation: componentValidation.slug,
      group: 'no',
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av artistoversikten på norsk',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'no',
    }),
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk artistoversikt med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      description: 'Artist overview title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL for English artist overview (recommended: "artists")',
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
      description: 'Short description of the artist overview in English',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'en',
    }),
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description: 'Build English artist overview with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no')
      },
    }),

    // ARTISTER (DELT)
    defineField({
      name: 'selectedArtists',
      title: 'Valgte artister',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'artist'}],
        }
      ],
      description: 'Velg artister som skal vises på artistoversikten (vises på begge språk)',
      group: 'artists',
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
      // Language status
      const languages: string[] = [];
      if (hasNorwegian || title_no) languages.push('NO');
      if (hasEnglish || title_en) languages.push('EN');
      const langStatus = languages.length > 0 ? languages.join(' ') : 'Ingen språk valgt';

      const title = title_no || title_en || 'Artistoversikt';
      const slug = slug_no || slug_en || 'artister';

      return {
        title: title,
        subtitle: `/${slug} • ${langStatus}`,
        media: UsersIcon,
      };
    },
  },
})
