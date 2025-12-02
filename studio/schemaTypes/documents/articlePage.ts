import {defineField, defineType} from 'sanity'
import {DocumentIcon, ComposeIcon, DocumentTextIcon} from '@sanity/icons'
import {createMirrorPortableTextInput} from '../../components/inputs/MirrorPortableTextInput'
import {componentValidation} from '../shared/validation'
import {seoFields, seoGroup} from '../objects/seoFields'
import {excludeAlreadySelected} from '../shared/referenceFilters'
import {MultiSelectReferenceInput} from '../components/inputs/MultiSelectReferenceInput'
import {getLanguageStatus} from '../shared/previewHelpers'

export const articlePage = defineType({
  name: 'articlePage',
  title: 'Artikkeloversikt',
  type: 'document',
  icon: DocumentIcon,
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
      name: 'articles',
      title: 'Artikler',
      icon: DocumentTextIcon,
    },
    seoGroup,
  ],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Tittel (norsk)',
      type: 'string',
      description: 'Tittel på artikkeloversikten på norsk',
      initialValue: 'Artikler',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL for norsk artikkeloversikt (anbefalt: "artikler")',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      initialValue: {current: 'artikler'},
      validation: componentValidation.slug,
      group: 'no',
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av artikkeloversikten på norsk',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'no',
    }),
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk artikkeloversikt med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      description: 'Article overview title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL for English article overview (recommended: "articles")',
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
      description: 'Short description of the article overview in English',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'en',
    }),
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description: 'Build English article overview with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no')
      },
    }),

    // ARTIKLER (DELT)
    defineField({
      name: 'selectedArticles',
      title: 'Valgte artikler',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'article'}],
        }
      ],
      description: 'Velg artikler som skal vises på artikkeloversikten, eller la stå tom for å vise alle publiserte artikler (vises på begge språk)',
      group: 'articles',
      components: {
        input: MultiSelectReferenceInput,
      },
      options: {
        filter: excludeAlreadySelected(),
      },
    }),

    ...seoFields,
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

      const title = title_no || title_en || 'Artikkeloversikt';
      const slug = slug_no || slug_en || 'artikler';

      return {
        title: title,
        subtitle: `/${slug} • ${langStatus}`,
        media: DocumentIcon,
      };
    },
  },
})
