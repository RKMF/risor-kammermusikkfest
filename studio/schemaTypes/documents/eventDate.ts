import { defineField, defineType } from 'sanity';
import { CalendarIcon, ComposeIcon, CogIcon } from '@sanity/icons';
import { DateNoDisplayInput, DateEnDisplayInput } from '../../components/LocalizedDateDisplay';
import { componentValidation } from '../shared/validation';
import { eventDateSlugValidation } from '../../lib/slugValidation';

export const eventDate = defineType({
  name: 'eventDate',
  title: 'Festivaldatoer',
  type: 'document',
  icon: CalendarIcon,
  groups: [
    {
      name: 'basic',
      title: 'Felles innhold',
      icon: CogIcon,
      default: true,
    },
    {
      name: 'no',
      title: 'Norsk (NO)',
      icon: ComposeIcon,
    },
    {
      name: 'en',
      title: 'English (EN)',
      icon: ComposeIcon,
    },
  ],
  fields: [
    defineField({
      name: 'date',
      title: 'Festivaldato',
      type: 'date',
      description: 'Velg dato for arrangementet (ukedag vises automatisk)',
      group: 'basic',
      validation: (Rule) => Rule.required().error('Dato må velges'),
    }),

    defineField({
      name: 'title_display_no',
      title: 'Hvordan datoen vises på norsk',
      type: 'string',
      description: 'Oppdateres automatisk fra valgt dato',
      group: 'no',
      readOnly: true,
      components: { input: DateNoDisplayInput },
    }),

    defineField({
      name: 'slug_no',
      title: 'URL (norsk)',
      type: 'slug',
      description: 'Trykk generer for å lage norsk URL',
      group: 'no',
      options: {
        source: (doc: any) => {
          if (!doc.date || typeof doc.date !== 'string') return 'festivaldato';
          const d = new Date(doc.date as string);
          const weekday = new Intl.DateTimeFormat('nb-NO', { weekday: 'long' })
            .format(d)
            .toLowerCase()
            .normalize('NFD') // fjerner diakritikk
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z]/g, ''); // bare a-z
          const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
          return `${weekday}-${iso}`; // f.eks. tirsdag-2025-06-23
        },
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // Først sjekk avansert slug-validering for unikhet
          const slugValidation = await eventDateSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Så sjekk standard slug-validering
          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),

    defineField({
      name: 'title_display_en',
      title: 'How the date appears in English',
      type: 'string',
      description: 'Updates automatically from the selected date',
      group: 'en',
      readOnly: true,
      components: { input: DateEnDisplayInput },
    }),

    defineField({
      name: 'slug_en',
      title: 'URL (English)',
      type: 'slug',
      description: 'Click generate to create English URL',
      group: 'en',
      options: {
        source: (doc: any) => {
          if (!doc.date || typeof doc.date !== 'string') return 'festival-date';
          const d = new Date(doc.date as string);
          const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })
            .format(d)
            .toLowerCase()
            .replace(/[^a-z]/g, '');
          const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
          return `${weekday}-${iso}`; // tuesday-2025-06-23
        },
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          // Først sjekk avansert slug-validering for unikhet
          const slugValidation = await eventDateSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Så sjekk standard slug-validering
          return componentValidation.slug(Rule).validate(value, context);
        }),
    }),

    defineField({
      name: 'isActive',
      title: 'Aktiv',
      type: 'boolean',
      description: 'Er denne datoen aktiv og tilgjengelig for arrangementer?',
      group: 'basic',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      date: 'date',
      slug_no: 'slug_no.current',
      slug_en: 'slug_en.current',
      isActive: 'isActive',
    },
    prepare({ date, slug_no, slug_en, isActive }) {
      if (!date) {
        return {
          title: 'Ingen dato',
          subtitle: isActive ? 'Aktiv' : 'Inaktiv',
          media: CalendarIcon,
        };
      }

      const d = new Date(date as string);
      const formatted = new Intl.DateTimeFormat('nb-NO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d);
      const title = formatted.charAt(0).toUpperCase() + formatted.slice(1);

      const langs = [slug_no && 'NO', slug_en && 'EN'].filter(Boolean).join(' ');
      const status = isActive ? 'Aktiv' : 'Inaktiv';

      return {
        title,
        subtitle: `${langs ? langs + ' • ' : ''}${status}`,
        media: CalendarIcon,
      };
    },
  },
  orderings: [
    {
      title: 'Dato, eldste først',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Dato, nyeste først',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
});
