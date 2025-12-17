import { defineField, defineType } from 'sanity';
import { ThLargeIcon } from '@sanity/icons';

export const gridComponent = defineType({
  name: 'gridComponent',
  title: 'Rutenett',
  type: 'object',
  icon: ThLargeIcon,
  description: 'Vis innhold i et rutenett som tilpasser seg skjermstørrelsen',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri tittel over rutenettet',
    }),
    defineField({
      name: 'columns',
      title: 'Antall kolonner',
      type: 'string',
      description: 'Hvor mange kolonner skal rutenettet ha på desktop?',
      options: {
        list: [
          { title: '2 kolonner', value: '2' },
          { title: '3 kolonner', value: '3' },
        ],
        layout: 'radio',
      },
      initialValue: '3',
      validation: (Rule) => Rule.required().error('Velg antall kolonner'),
    }),
    defineField({
      name: 'items',
      title: 'Innhold',
      type: 'array',
      description: 'Legg til bilder, videoer, sitater eller Spotify-innhold',
      of: [
        { type: 'imageComponent' },
        { type: 'videoComponent' },
        { type: 'quoteComponent' },
        { type: 'spotifyComponent' },
      ],
      validation: (Rule) =>
        Rule.required().min(4).max(12).error('Rutenettet må ha mellom 4 og 12 elementer'),
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Sideforhold',
      type: 'string',
      description: 'Velg sideforholdet for alle elementer',
      options: {
        list: [
          { title: '4:5 (portrett)', value: '4:5' },
          { title: '1:1 (kvadrat)', value: '1:1' },
        ],
        layout: 'radio',
      },
      initialValue: '4:5',
    }),
    defineField({
      name: 'gap',
      title: 'Avstand mellom elementer',
      type: 'string',
      description: 'Hvor mye plass skal det være mellom elementene?',
      options: {
        list: [
          { title: 'Liten', value: 'small' },
          { title: 'Medium', value: 'medium' },
          { title: 'Stor', value: 'large' },
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      columns: 'columns',
      items: 'items',
      aspectRatio: 'aspectRatio',
      gap: 'gap',
    },
    prepare({ title, columns, items, aspectRatio, gap }) {
      const itemCount = items?.length || 0;
      const columnText = columns === '2' ? '2 kolonner' : '3 kolonner';
      const gapText = gap === 'small' ? 'liten' : gap === 'large' ? 'stor' : 'medium';
      const aspectText = aspectRatio || '4:5';

      return {
        title: title || 'Rutenett',
        subtitle: `${columnText} • ${itemCount} elementer • ${aspectText} • ${gapText} avstand`,
        media: ThLargeIcon,
      };
    },
  },
});
