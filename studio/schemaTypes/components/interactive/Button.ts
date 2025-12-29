import { defineField, defineType } from 'sanity';
import { BoltIcon } from '@sanity/icons';
import { buttonURLValidation } from '../../../lib/urlValidation';
import { componentSpecificValidation } from '../../shared/validation';
import type { ButtonData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

export const buttonComponent = defineType({
  name: 'buttonComponent',
  title: 'Knapp',
  type: 'object',
  icon: BoltIcon,
  description: 'Opprett knapp for enten lenke eller handling',
  groups: [
    {
      name: 'content',
      title: 'Innhold & Innstillinger',
      default: true,
    },
  ],
  fields: [
    defineField({
      name: 'text',
      title: 'Knappetekst',
      type: 'string',
      group: 'content',
      description: 'Teksten som vises på knappen',
      validation: componentSpecificValidation.buttonText,
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      group: 'content',
      description: 'Lenken knappen skal gå til (f.eks. https://example.com)',
      validation: (Rule) => Rule.required().custom(buttonURLValidation),
    }),
    defineField({
      name: 'style',
      title: 'Stil',
      type: 'string',
      group: 'content',
      description: 'Velg stil på knappen',
      options: {
        list: [
          { title: 'Primær (blå bakgrunn, hvit tekst)', value: 'primary' },
          { title: 'Sekundær (grå bakgrunn, hvit tekst)', value: 'secondary' },
          { title: 'Utkant (gjennomsiktig, blå ramme)', value: 'outline' },
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'fullWidth',
      title: 'Full bredde',
      type: 'boolean',
      group: 'content',
      description: 'Strekk knappen over full container-bredde',
      initialValue: false,
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Åpne i ny fane',
      type: 'boolean',
      group: 'content',
      description: 'Åpne lenken i en ny fane',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'text',
      style: 'style',
      fullWidth: 'fullWidth',
    },
    prepare({ title, style, fullWidth }: { title?: string; style?: string; fullWidth?: boolean }) {
      const styleMap: Record<string, string> = {
        primary: 'Primær',
        secondary: 'Sekundær',
        outline: 'Utkant',
      };
      const styleDesc = styleMap[style || 'primary'] || 'Primær';

      const widthText = fullWidth ? ' • Full bredde' : '';

      return {
        title: 'Knapp',
        subtitle: `${title || 'Uten tekst'} • ${styleDesc}${widthText}`,
        media: BoltIcon,
      };
    },
  },
});

// Type-safe validation functions
export const buttonValidationRules = {
  text: componentSpecificValidation.buttonText as ValidationRule,
  url: (Rule: any) => Rule.required().custom(buttonURLValidation) as ValidationRule,
} as const;
