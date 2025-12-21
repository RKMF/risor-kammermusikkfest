import { defineField, defineType } from 'sanity';
import { UsersIcon } from '@sanity/icons';
import { componentValidation } from '../shared/validation';

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsorer',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Sponsornavn',
      type: 'string',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'logo',
      title: 'Sponsorlogo',
      type: 'image',
      options: { hotspot: true },
      description: 'Last opp logo (SVG anbefales for best kvalitet)',
    }),
    defineField({
      name: 'url',
      title: 'Lenke til sponsor',
      type: 'url',
      description: 'URL til sponsor nettside',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }).warning('Må være en gyldig URL (http/https)'),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
      url: 'url',
    },
    prepare({ title, media, url }) {
      return {
        title: title || 'Uten navn',
        subtitle: url ? 'Har lenke' : 'Ingen lenke',
        media: media || UsersIcon,
      };
    },
  },
});
