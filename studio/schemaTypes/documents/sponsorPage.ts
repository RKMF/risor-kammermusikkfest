import { defineField, defineType } from 'sanity';
import { UsersIcon, ComposeIcon } from '@sanity/icons';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { componentValidation } from '../shared/validation';
import { getLanguageStatus } from '../shared/previewHelpers';
import { excludeAlreadySelected } from '../shared/referenceFilters';
import { MultiSelectReferenceInput } from '../components/inputs/MultiSelectReferenceInput';

export const sponsorPage = defineType({
  name: 'sponsorPage',
  title: 'Sponsoroversikt',
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
      name: 'sponsors',
      title: 'Sponsorer',
      icon: UsersIcon,
    },
  ],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Tittel (norsk)',
      type: 'string',
      description: 'Tittel på sponsoroversikten på norsk',
      initialValue: 'Sponsorer',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL for norsk sponsoroversikt (anbefalt: "sponsorer")',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      initialValue: { current: 'sponsorer' },
      validation: componentValidation.slug,
      group: 'no',
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av sponsoroversikten på norsk',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'no',
    }),
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk sponsoroversikt med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Title (English)',
      type: 'string',
      description: 'Sponsor overview title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL for English sponsor overview (recommended: "sponsors")',
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
      description: 'Short description of the sponsor overview in English',
      rows: 2,
      validation: componentValidation.longDescription,
      group: 'en',
    }),
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description: 'Build English sponsor overview with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no'),
      },
    }),

    // SPONSORER (DELT)
    defineField({
      name: 'selectedSponsors',
      title: 'Valgte sponsorer',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'sponsor' }],
        },
      ],
      description: 'Velg sponsorer som skal vises på sponsoroversikten. Dra for å endre rekkefølge.',
      group: 'sponsors',
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
    prepare({ title_no, title_en, slug_no, slug_en, hasNorwegian, hasEnglish }) {
      const langStatus = getLanguageStatus({ title_no, title_en, hasNorwegian, hasEnglish });

      const title = title_no || title_en || 'Sponsoroversikt';
      const slug = slug_no || slug_en || 'sponsorer';

      return {
        title: title,
        subtitle: `/${slug} • ${langStatus}`,
        media: UsersIcon,
      };
    },
  },
});
