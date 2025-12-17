import { defineField, defineType } from 'sanity';
import { ComposeIcon } from '@sanity/icons';
import { componentValidation } from '../shared/validation';
import { multilingualImageFields, imageFieldsets, imageGroup } from '../shared/imageFields';
import { getLanguageStatus } from '../shared/previewHelpers';
import { LoremIpsumInput } from '../components/content/LoremIpsumButton';

export const composer = defineType({
  name: 'composer',
  title: 'Komponister',
  type: 'document',
  icon: ComposeIcon,
  groups: [
    {
      name: 'basic',
      title: 'Felles innhold',
      icon: ComposeIcon,
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
  ],
  fieldsets: [...imageFieldsets],
  fields: [
    defineField({
      name: 'name',
      title: 'Navn på komponist',
      type: 'string',
      validation: componentValidation.title,
      group: 'basic',
    }),
    defineField({
      name: 'description_no',
      title: 'Beskrivelse',
      type: 'portableText',
      group: 'no',
      components: {
        input: LoremIpsumInput,
      },
    }),
    defineField({
      name: 'description_en',
      title: 'Description',
      type: 'portableText',
      group: 'en',
      components: {
        input: LoremIpsumInput,
      },
    }),
    ...multilingualImageFields('image'),
  ],
  preview: {
    select: {
      name: 'name',
      media: 'image',
      description_no: 'description_no',
      description_en: 'description_en',
    },
    prepare({ name, media, description_no, description_en }) {
      const langStatus = getLanguageStatus({
        hasNorwegian: !!description_no,
        hasEnglish: !!description_en,
      });

      return {
        title: name || 'Uten navn',
        subtitle: langStatus,
        media: media || ComposeIcon,
      };
    },
  },
});
