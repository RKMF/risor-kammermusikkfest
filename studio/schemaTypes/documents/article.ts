import { defineField, defineType } from 'sanity';
import { DocumentIcon, ImageIcon, ComposeIcon, CogIcon } from '@sanity/icons';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { multilingualImageFields, imageFieldsets, imageGroup } from '../shared/imageFields';
import { seoFields, seoGroup } from '../objects/seoFields';
import { componentValidation, crossFieldValidation } from '../shared/validation';
import { articleSlugValidation } from '../../lib/slugValidation';
import type { ArticleData, ValidationRule, MultilingualDocument } from '../shared/types';
import { getPublishingStatusText, getLanguageStatus } from '../shared/previewHelpers';
import { publishingFields, publishingGroup } from '../shared/publishingFields';

export const article = defineType({
  name: 'article',
  title: 'Artikler',
  type: 'document',
  icon: DocumentIcon,
  orderings: [
    { title: 'Tittel A–Å', name: 'titleAsc', by: [{ field: 'title_no', direction: 'asc' }] },
    {
      title: 'Nylig opprettet',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
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
    imageGroup,
    publishingGroup,
    seoGroup,
  ],
  fieldsets: [...imageFieldsets],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'title_no',
      title: 'Artikkeltittel (norsk)',
      type: 'string',
      description: 'Artikkeltittel på norsk',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL-vennlig versjon av norsk artikkeltittel',
      group: 'no',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // Først sjekk avansert slug-validering for unikhet
          const slugValidation = await articleSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Så sjekk standard slug-validering
          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av artikkelen på norsk (vises i lister)',
      group: 'no',
      rows: 2,
      validation: componentValidation.description,
    }),
    defineField({
      name: 'content_no',
      title: 'Artikkelinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk artikkel med komponenter og innhold (artikkeltittel er allerede H1)',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Article title (English)',
      type: 'string',
      description: 'Article title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL-friendly version of English article title',
      group: 'en',
      options: {
        source: 'title_en',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          const doc = context.document as any;
          const hasEnglishContent =
            doc?.title_en || doc?.excerpt_en || (doc?.content_en && doc.content_en.length > 0);

          if (hasEnglishContent && !value?.current) {
            return 'URL (English) må settes når engelsk innhold er fylt ut';
          }

          if (!value?.current) {
            return true;
          }

          const slugValidation = await articleSlugValidation(value, context);
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
      description: 'Short description of the article in English (shown in lists)',
      group: 'en',
      rows: 2,
      validation: componentValidation.description,
    }),
    defineField({
      name: 'content_en',
      title: 'Article content (English)',
      type: 'pageBuilder',
      description:
        'Build English article with components and content (article title is already H1)',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no'),
      },
    }),

    // HOVEDBILDE
    ...multilingualImageFields('image'),
    ...publishingFields('publishing', 'artikkelen'),
    ...seoFields,
  ],
  preview: {
    select: {
      title_no: 'title_no',
      title_en: 'title_en',
      excerpt_no: 'excerpt_no',
      excerpt_en: 'excerpt_en',
      content_no: 'content_no',
      content_en: 'content_en',
      publishingStatus: 'publishingStatus',
      scheduledStart: 'scheduledPeriod.startDate',
      scheduledEnd: 'scheduledPeriod.endDate',
      media: 'image',
      _id: '_id',
    },
    prepare({
      title_no,
      title_en,
      excerpt_no,
      excerpt_en,
      content_no,
      content_en,
      publishingStatus,
      scheduledStart,
      scheduledEnd,
      media,
      _id,
    }) {
      // Use shared helper functions for consistent status display
      const statusText = getPublishingStatusText(
        _id,
        publishingStatus,
        scheduledStart,
        scheduledEnd
      );
      const langStatus = getLanguageStatus({
        title_no,
        title_en,
        excerpt_no,
        excerpt_en,
        content_no,
        content_en,
      });

      const title = title_no || title_en || 'Uten tittel';

      return {
        title: title,
        subtitle: `${statusText} • ${langStatus}`,
        media: media || DocumentIcon,
      };
    },
  },
});
