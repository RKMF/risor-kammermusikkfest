import { defineField, defineType } from 'sanity';
import { ClockIcon } from '@sanity/icons';

export const countdownComponent = defineType({
  name: 'countdownComponent',
  title: 'Nedtelling',
  type: 'object',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Innledende tekst',
      type: 'string',
      description: 'Tekst som vises foran nedtellingen, f.eks. "Festivalen starter om"',
    }),
    defineField({
      name: 'targetDate',
      title: 'Dato og tid',
      type: 'datetime',
      description: 'Velg dato og tidspunkt for nedtellingen',
      validation: (Rule) => Rule.required().error('Dato og tid må velges'),
      options: {
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        timeStep: 15,
      },
    }),
    defineField({
      name: 'style',
      title: 'Visuell stil',
      type: 'string',
      options: {
        list: [
          { title: 'Stor (hero)', value: 'large' },
          { title: 'Kompakt', value: 'compact' },
          { title: 'Minimal (tekstlinje)', value: 'minimal' },
        ],
        layout: 'radio',
      },
      initialValue: 'compact',
    }),
    defineField({
      name: 'completedMessage',
      title: 'Melding når nedtelling er ferdig',
      type: 'string',
      description: 'Tekst som vises når tiden er ute',
      initialValue: 'Tiden er ute!',
    }),
    defineField({
      name: 'hideWhenComplete',
      title: 'Skjul når ferdig',
      type: 'boolean',
      description: 'Skjul komponenten helt når nedtellingen er over',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      targetDate: 'targetDate',
      style: 'style',
    },
    prepare({ title, targetDate, style }) {
      const dateStr = targetDate
        ? new Date(targetDate).toLocaleString('nb-NO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Ingen dato valgt';

      return {
        title: title || 'Nedtelling',
        subtitle: `${dateStr} • ${style || 'compact'} stil`,
        media: ClockIcon,
      };
    },
  },
});
