import { defineField, defineType } from 'sanity';
import { DashboardIcon } from '@sanity/icons';

export const threeColumnLayout = defineType({
  name: 'threeColumnLayout',
  title: 'Tre kolonner',
  type: 'object',
  icon: DashboardIcon,
  description: 'Plasser tre komponenter side ved side (stabler vertikalt på mobil)',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri tittel over kolonnene',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'column1',
      title: 'Kolonne 1',
      type: 'array',
      description: 'Første kolonne (venstre)',
      of: [{ type: 'imageComponent' }, { type: 'videoComponent' }, { type: 'quoteComponent' }],
      validation: (Rule) => Rule.required().max(1).error('Kolonne 1 kan bare ha én komponent'),
    }),
    defineField({
      name: 'column2',
      title: 'Kolonne 2',
      type: 'array',
      description: 'Andre kolonne (midten)',
      of: [{ type: 'imageComponent' }, { type: 'videoComponent' }, { type: 'quoteComponent' }],
      validation: (Rule) => Rule.required().max(1).error('Kolonne 2 kan bare ha én komponent'),
    }),
    defineField({
      name: 'column3',
      title: 'Kolonne 3',
      type: 'array',
      description: 'Tredje kolonne (høyre)',
      of: [{ type: 'imageComponent' }, { type: 'videoComponent' }, { type: 'quoteComponent' }],
      validation: (Rule) => Rule.required().max(1).error('Kolonne 3 kan bare ha én komponent'),
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
      column1: 'column1',
      column2: 'column2',
      column3: 'column3',
      aspectRatio: 'aspectRatio',
    },
    prepare({ title, column1, column2, column3, aspectRatio }) {
      const col1Type = column1?.[0]?._type || 'tom';
      const col2Type = column2?.[0]?._type || 'tom';
      const col3Type = column3?.[0]?._type || 'tom';
      const aspectText = ` • ${aspectRatio || '4:5'}`;

      return {
        title: title || 'Tre kolonner',
        subtitle: `${col1Type} | ${col2Type} | ${col3Type}${aspectText}`,
        media: DashboardIcon,
      };
    },
  },
});
