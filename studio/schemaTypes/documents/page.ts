import { defineField, defineType } from 'sanity';
import { DocumentIcon, ComposeIcon, CogIcon, ImageIcon } from '@sanity/icons';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { multilingualImageFields, imageFieldsets, imageGroup } from '../shared/imageFields';
import { seoFields, seoGroup } from '../objects/seoFields';
import { componentValidation, crossFieldValidation } from '../shared/validation';
import { pageSlugValidation } from '../../lib/slugValidation';
import type { PageData, ValidationRule, MultilingualDocument } from '../shared/types';
import { getPublishingStatusText, getLanguageStatus } from '../shared/previewHelpers';
import { publishingFields, publishingGroup } from '../shared/publishingFields';

export const page = defineType({
  name: 'page',
  title: 'Faste sider',
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
      title: 'Sidetittel (norsk)',
      type: 'string',
      description: 'Tittel på siden på norsk',
      validation: componentValidation.title,
      group: 'no',
    }),
    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'URL-vennlig versjon av norsk sidetittel',
      group: 'no',
      options: {
        source: 'title_no',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // First check custom slug validation for uniqueness
          const slugValidation = await pageSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Then check standard slug validation
          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),
    defineField({
      name: 'excerpt_no',
      title: 'Ingress (norsk)',
      type: 'text',
      description: 'Kort beskrivelse av siden på norsk (vises i lister)',
      group: 'no',
      rows: 2,
      validation: componentValidation.description,
    }),
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Bygg norsk side med komponenter og innhold',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'title_en',
      title: 'Page title (English)',
      type: 'string',
      description: 'Page title in English',
      group: 'en',
    }),
    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'URL-friendly version of English page title',
      group: 'en',
      options: {
        source: 'title_en',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // First check custom slug validation for uniqueness
          const slugValidation = await pageSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Then check standard slug validation
          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),
    defineField({
      name: 'excerpt_en',
      title: 'Excerpt (English)',
      type: 'text',
      description: 'Short description of the page in English (shown in lists)',
      group: 'en',
      rows: 2,
      validation: componentValidation.description,
    }),
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description: 'Build English page with components and content',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no'),
      },
    }),

    // HOVEDBILDE
    ...multilingualImageFields('image'),
    ...publishingFields('publishing', 'siden'),
    ...seoFields,
  ],
  preview: {
    select: {
      title_no: 'title_no',
      title_en: 'title_en',
      publishingStatus: 'publishingStatus',
      scheduledStart: 'scheduledPeriod.startDate',
      scheduledEnd: 'scheduledPeriod.endDate',
      hasNorwegian: 'content_no',
      hasEnglish: 'content_en',
      _id: '_id',
    },
    prepare({
      title_no,
      title_en,
      publishingStatus,
      scheduledStart,
      scheduledEnd,
      hasNorwegian,
      hasEnglish,
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
        hasNorwegian,
        hasEnglish,
        title_no,
        title_en,
      });

      const title = title_no || title_en || 'Uten tittel';

      return {
        title: title,
        subtitle: `${statusText} • ${langStatus}`,
        media: DocumentIcon,
      };
    },
  },
});
