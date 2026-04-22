import { defineField, defineType } from 'sanity';
import { CalendarIcon } from '@sanity/icons';
import { excludeAlreadySelected } from '../../shared/referenceFilters';
import { MultiSelectReferenceInput } from '../../components/inputs/MultiSelectReferenceInput';

export const homepageEventCardsComponent = defineType({
  name: 'homepageEventCardsComponent',
  title: 'Forside-arrangementer',
  type: 'object',
  icon: CalendarIcon,
  description:
    'Manuelt kuratert liste med arrangementskort for forsiden. Bruker samme kortvisning som programsiden.',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Valgfri seksjonstittel over arrangementskortene.',
    }),
    defineField({
      name: 'items',
      title: 'Arrangementer',
      type: 'array',
      description:
        'Velg arrangementene som skal vises på forsiden. Rekkefølgen her brukes direkte på nettsiden.',
      of: [{ type: 'reference', to: [{ type: 'event' }] }],
      options: {
        filter: excludeAlreadySelected(),
      },
      components: {
        input: MultiSelectReferenceInput,
      },
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(12)
          .error('Legg til mellom 1 og 12 arrangementer.'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({ title, items }) {
      const eventCount = items?.length || 0;
      return {
        title: title || 'Forside-arrangementer',
        subtitle: `${eventCount} arrangementer`,
        media: CalendarIcon,
      };
    },
  },
});
