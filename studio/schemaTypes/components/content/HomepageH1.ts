import { defineField, defineType } from 'sanity';
import { BlockContentIcon } from '@sanity/icons';
import { componentSpecificValidation } from '../../shared/validation';
import type { ValidationRule } from '../../shared/types';

export const homepageH1ValidationRules = {
  text: componentSpecificValidation.headingText as ValidationRule,
} as const;

export const homepageH1Component = defineType({
  name: 'homepageH1Component',
  title: 'Forside-tittel (H1)',
  type: 'object',
  icon: BlockContentIcon,
  description: 'Hovedtittel for forsiden. Brukes som sidens H1 og vises over hero-seksjonen.',
  fields: [
    defineField({
      name: 'text',
      title: 'Titteltekst',
      type: 'text',
      rows: 3,
      description: 'Teksten som vises som hovedtittel på forsiden. Bruk linjeskift for manuelle line breaks.',
      validation: componentSpecificValidation.headingText,
    }),
    defineField({
      name: 'id',
      title: 'Anker-ID (valgfritt)',
      type: 'slug',
      description: 'Valgfri unik ID for direkte lenking til forsidetittelen.',
      options: {
        source: (doc: unknown, options: { parent?: { text?: string } }) => options.parent?.text || '',
        maxLength: 96,
        isUnique: () => true,
      },
    }),
  ],
  preview: {
    select: {
      text: 'text',
      id: 'id',
    },
    prepare({ text, id }) {
      const displayText = text || 'Ingen titteltekst';
      const displayId = id?.current ? ` • #${id.current}` : '';

      return {
        title: 'Forside-tittel',
        subtitle: `H1: ${displayText}${displayId}`,
        media: BlockContentIcon,
      };
    },
  },
});
