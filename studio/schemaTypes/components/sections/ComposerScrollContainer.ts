import {defineField, defineType} from 'sanity'
import {ComposeIcon} from '@sanity/icons'
import {componentValidation, contentValidation} from '../../shared/validation'
import {excludeAlreadySelected} from '../../shared/referenceFilters'

export const composerScrollContainer = defineType({
  name: 'composerScrollContainer',
  title: 'Composer Scroll Container',
  type: 'object',
  icon: ComposeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Tittel for komponist scroll-containeren (valgfritt)',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'items',
      title: 'Komponister',
      type: 'array',
      description: 'Legg til mellom 2 og 8 komponister som skal vises i horisontal scroll',
      of: [{type: 'reference', to: [{type: 'composer'}]}],
      validation: contentValidation.scrollContainerItems,
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
    defineField({
      name: 'showScrollbar',
      title: 'Vis scrollbar',
      type: 'boolean',
      description: 'Om scrollbaren skal være synlig eller skjult',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({title, items}) {
      const itemCount = items?.length || 0
      return {
        title: 'Komponister',
        subtitle: `${title || 'Scroll Container'} • ${itemCount} komponister`,
        media: ComposeIcon,
      }
    },
  },
})
