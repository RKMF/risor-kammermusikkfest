import { defineField, defineType } from 'sanity';
import { MenuIcon } from '@sanity/icons';

export const marqueeComponent = defineType({
  name: 'marqueeComponent',
  title: 'Rullende tekst',
  type: 'object',
  icon: MenuIcon,
  description: 'Tekst som ruller horisontalt over skjermen',
  fields: [
    defineField({
      name: 'text',
      title: 'Tekst',
      type: 'string',
      description: 'Teksten som skal rulle over skjermen',
      validation: (Rule) =>
        Rule.required().min(1).max(200).error('Teksten er påkrevd (maks 200 tegn)'),
    }),
  ],
  preview: {
    select: {
      text: 'text',
    },
    prepare({ text }) {
      const displayText = text
        ? text.length > 40
          ? `${text.substring(0, 40)}...`
          : text
        : 'Ingen tekst';
      return {
        title: 'Rullende tekst',
        subtitle: displayText,
        media: MenuIcon,
      };
    },
  },
});
