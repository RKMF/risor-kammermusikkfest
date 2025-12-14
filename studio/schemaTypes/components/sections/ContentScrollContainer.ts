import {defineField, defineType} from 'sanity'
import {InlineElementIcon} from '@sanity/icons'

export const contentScrollContainer = defineType({
  name: 'contentScrollContainer',
  title: 'Innholdskarusell',
  type: 'object',
  icon: InlineElementIcon,
  description: 'Horisontal scrollende karusell med blandet innhold (Instagram-stil)',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Tittel over karusellen (valgfritt)',
      validation: (Rule) => Rule.max(100),
    }),
    defineField({
      name: 'items',
      title: 'Innhold',
      type: 'array',
      description: 'Legg til innhold. Alt vises som 4:5 kort - bildets aspect ratio ignoreres.',
      of: [
        {type: 'imageComponent'},
        {type: 'videoComponent'},
        {type: 'quoteComponent'},
        {type: 'portableTextBlock'},
      ],
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(12)
          .error('Karusellen må ha mellom 2 og 12 elementer'),
    }),
    defineField({
      name: 'showScrollbar',
      title: 'Vis scrollbar',
      type: 'boolean',
      description: 'Vis eller skjul scrollbar',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
      showScrollbar: 'showScrollbar',
    },
    prepare({title, items, showScrollbar}) {
      const itemCount = items?.length || 0
      const scrollbarStatus = showScrollbar ? 'med scrollbar' : 'uten scrollbar'

      return {
        title: title || 'Innholdskarusell',
        subtitle: `${itemCount} elementer (4:5 kort) • ${scrollbarStatus}`,
        media: InlineElementIcon,
      }
    },
  },
})

