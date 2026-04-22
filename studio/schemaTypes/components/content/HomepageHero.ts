import { defineField, defineType } from 'sanity';
import { LinkIcon, ImageIcon } from '@sanity/icons';

const heroLinkReferenceTargets = [
  { type: 'programPage' },
  { type: 'artistPage' },
  { type: 'articlePage' },
  { type: 'page' },
  { type: 'event' },
  { type: 'artist' },
  { type: 'article' },
] as const;

export const homepageHeroLink = defineType({
  name: 'homepageHeroLink',
  title: 'Hero-lenke',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'linkType',
      title: 'Lenketype',
      type: 'string',
      options: {
        list: [
          { title: 'Ekstern lenke', value: 'external' },
          { title: 'Intern side', value: 'internal' },
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'text',
      title: 'Lenketekst',
      type: 'string',
      description: 'Teksten som vises på lenken',
      validation: (Rule) => Rule.required().error('Lenketekst er påkrevd'),
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'string',
      description: 'Valgfri undertekst som vises under lenken',
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Ekstern URL (https://...)',
      hidden: ({ parent }) => parent?.linkType === 'internal',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string };
          if (parent?.linkType === 'external' && !value) {
            return 'URL er påkrevd for eksterne lenker';
          }
          return true;
        }),
    }),
    defineField({
      name: 'internalLink',
      title: 'Intern side',
      type: 'reference',
      description: 'Velg hvilken side lenken skal gå til',
      to: [...heroLinkReferenceTargets],
      weak: true,
      hidden: ({ parent }) => parent?.linkType !== 'internal',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string };
          if (parent?.linkType === 'internal' && !value) {
            return 'Du må velge en intern side';
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: {
      title: 'text',
      description: 'description',
      linkType: 'linkType',
      url: 'url',
    },
    prepare({ title, description, linkType, url }) {
      const linkInfo = linkType === 'internal' ? 'Intern lenke' : url || 'Ingen URL';
      return {
        title: title || 'Uten tekst',
        subtitle: description ? `${description} • ${linkInfo}` : linkInfo,
        media: LinkIcon,
      };
    },
  },
});

export const homepageHeroComponent = defineType({
  name: 'homepageHeroComponent',
  title: 'Forside-hero',
  type: 'object',
  icon: ImageIcon,
  description: 'Blå hero-boks med tekstlogo og opptil fire CTA-lenker.',
  fields: [
    defineField({
      name: 'links',
      title: 'Hero-lenker',
      type: 'array',
      description:
        'Opptil 4 CTA-lenker som vises ved siden av tekstlogoen. Hvis tom, vises bare logoen.',
      validation: (Rule) => Rule.max(4).error('Maks 4 hero-lenker'),
      of: [{ type: 'homepageHeroLink' }],
    }),
  ],
  preview: {
    select: {
      links: 'links',
    },
    prepare({ links }) {
      const linkCount = links?.length || 0;
      return {
        title: 'Forside-hero',
        subtitle: linkCount > 0 ? `${linkCount} CTA-lenker` : 'Kun logo',
        media: ImageIcon,
      };
    },
  },
});
