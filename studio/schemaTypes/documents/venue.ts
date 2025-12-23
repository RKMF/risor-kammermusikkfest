import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';
import { venueSlugValidation } from '../../lib/slugValidation';
import {
  componentValidation,
  componentSpecificValidation,
  crossFieldValidation,
} from '../shared/validation';

export const venue = defineType({
  name: 'venue',
  title: 'Spillesteder',
  type: 'document',
  icon: HomeIcon,
  fieldsets: [
    {
      name: 'link',
      title: 'Adresse',
      description: 'Lenke til Google Maps eller annen lokasjon',
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Navn på spillested',
      type: 'string',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'slug',
      title: 'URL',
      type: 'slug',
      description: 'Trykk generer for å lage URL',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.warning().custom(async (value, context) => {
          // First check custom slug validation
          const slugValidation = await venueSlugValidation(value, context);
          if (slugValidation !== true) return slugValidation;

          // Then check if slug is missing (only if title exists)
          if (!value?.current && context.document?.title) {
            return 'Trykk generer for å lage URL';
          }
          return true;
        }),
    }),
    defineField({
      name: 'address',
      title: 'Postadresse',
      type: 'string',
      description: 'F.eks. Storgata 3, 0150 Byen',
      fieldset: 'link',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Lenke-URL',
      type: 'url',
      description: 'Lenke til kart eller nettside (f.eks. Google Maps)',
      fieldset: 'link',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        })
          .warning('Må være en gyldig URL (http/https)')
          .custom((value, context) => {
            // If address is filled in, URL should also be provided
            if (context.document?.address && !value) {
              return 'Lenke-URL bør fylles ut når adresse er definert';
            }
            return true;
          }),
    }),
    defineField({
      name: 'linkTarget',
      title: 'Lenke-mål',
      type: 'string',
      description: 'Hvordan lenken skal åpnes',
      fieldset: 'link',
      options: {
        list: [
          { title: 'Samme fane', value: '_self' },
          { title: 'Ny fane (anbefalt)', value: '_blank' },
        ],
        layout: 'radio',
      },
      initialValue: '_blank',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      address: 'address',
      linkUrl: 'linkUrl',
    },
    prepare({ title, address, linkUrl }) {
      let hostname = 'Ingen URL';
      try {
        if (linkUrl) {
          hostname = new URL(linkUrl).hostname;
        }
      } catch (error) {
        hostname = 'Ugyldig URL';
      }

      return {
        title: title,
        subtitle: `${address || 'Ingen adresse'} • ${hostname}`,
        media: HomeIcon,
      };
    },
  },
});
