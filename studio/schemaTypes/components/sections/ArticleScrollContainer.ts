import { defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons';
import { componentValidation, contentValidation } from '../../shared/validation';
import { excludeAlreadySelected } from '../../shared/referenceFilters';

export const articleScrollContainer = defineType({
  name: 'articleScrollContainer',
  title: 'Artikkelkarusell',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Tittel for artikkelkarusellen (valgfritt)',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'items',
      title: 'Artikler',
      type: 'array',
      description: 'Legg til mellom 2 og 12 artikler som skal vises i horisontal scroll',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
      validation: (Rule) => Rule.required().min(2).max(12).error('Velg mellom 2 og 12 artikler'),
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
    defineField({
      name: 'sortBy',
      title: 'Sorter etter',
      type: 'string',
      description: 'Hvordan artiklene skal sorteres',
      options: {
        list: [
          { title: 'Nyeste først', value: 'date-desc' },
          { title: 'Eldste først', value: 'date-asc' },
          { title: 'Alfabetisk (tittel)', value: 'title-asc' },
          { title: 'Manuell rekkefølge', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'date-desc',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({ title, items }) {
      const itemCount = items?.length || 0;
      return {
        title: 'Artikler',
        subtitle: `${title || 'Artikkelkarusell'} • ${itemCount} artikler`,
        media: DocumentTextIcon,
      };
    },
  },
});
