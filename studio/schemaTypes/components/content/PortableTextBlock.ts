import { defineField, defineType } from 'sanity';
import { TextIcon } from '@sanity/icons';
import { LoremIpsumInput } from './LoremIpsumButton';

export const portableTextBlock = defineType({
  name: 'portableTextBlock',
  title: 'Tekst',
  type: 'object',
  icon: TextIcon,
  description:
    'Opprett rik tekst med formatering, lenker, lister og mer. Perfekt for artikler og beskrivelser.',
  fields: [
    defineField({
      name: 'content',
      title: 'Innhold',
      type: 'portableText',
      description: 'Rik tekst med formatering, overskrifter, lister og mer',
      components: {
        input: LoremIpsumInput,
      },
    }),
  ],
  preview: {
    select: {
      content: 'content',
    },
    prepare({ content }) {
      // Hent første tekst fra portable text
      const firstText = content?.[0]?.children?.[0]?.text || '';
      const displayTitle = 'Tekst';
      const displaySubtitle = firstText ? `${firstText.substring(0, 50)}...` : 'Ingen innhold';

      return {
        title: displayTitle,
        subtitle: displaySubtitle,
        media: TextIcon,
      };
    },
  },
});
