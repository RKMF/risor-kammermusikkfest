import { defineField, defineType } from 'sanity';
import { SplitHorizontalIcon } from '@sanity/icons';

export const twoColumnLayout = defineType({
  name: 'twoColumnLayout',
  title: 'To kolonner',
  type: 'object',
  icon: SplitHorizontalIcon,
  description: 'Plasser to komponenter side ved side (stabler vertikalt på mobil)',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri tittel over kolonnene',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'leftColumn',
      title: 'Venstre kolonne',
      type: 'array',
      description: 'Komponent som vises til venstre',
      of: [
        { type: 'imageComponent' },
        { type: 'videoComponent' },
        { type: 'spotifyComponent' },
        { type: 'quoteComponent' },
        { type: 'portableTextBlock' },
        { type: 'headingComponent' },
      ],
      validation: (Rule) =>
        Rule.required().max(1).error('Venstre kolonne kan bare ha én komponent'),
    }),
    defineField({
      name: 'rightColumn',
      title: 'Høyre kolonne',
      type: 'array',
      description: 'Komponent som vises til høyre',
      of: [
        { type: 'imageComponent' },
        { type: 'videoComponent' },
        { type: 'spotifyComponent' },
        { type: 'quoteComponent' },
        { type: 'portableTextBlock' },
        { type: 'headingComponent' },
      ],
      validation: (Rule) => Rule.required().max(1).error('Høyre kolonne kan bare ha én komponent'),
    }),
    defineField({
      name: 'reverseOnMobile',
      title: 'Reverser på mobil',
      type: 'boolean',
      description: 'Vis høyre kolonne først på mobil',
      initialValue: false,
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Sideforhold',
      type: 'string',
      description: 'Velg sideforholdet for kolonnene',
      options: {
        list: [
          { title: '4:5 (portrett)', value: '4:5' },
          { title: '9:16 (høy portrett)', value: '9:16' },
          { title: '1:1 (kvadrat)', value: '1:1' },
        ],
        layout: 'radio',
      },
      initialValue: '4:5',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      leftColumn: 'leftColumn',
      rightColumn: 'rightColumn',
      reverseOnMobile: 'reverseOnMobile',
      aspectRatio: 'aspectRatio',
    },
    prepare({ title, leftColumn, rightColumn, reverseOnMobile, aspectRatio }) {
      const leftType = leftColumn?.[0]?._type || 'tom';
      const rightType = rightColumn?.[0]?._type || 'tom';
      const reverseText = reverseOnMobile ? ' • Reversert mobil' : '';
      const aspectText = ` • ${aspectRatio || '4:5'}`;

      return {
        title: title || 'To kolonner',
        subtitle: `Venstre: ${leftType} | Høyre: ${rightType}${reverseText}${aspectText}`,
        media: SplitHorizontalIcon,
      };
    },
  },
});
