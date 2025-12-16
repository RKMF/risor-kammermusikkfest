import { defineField, defineType, defineArrayMember } from 'sanity';
import { LinkIcon } from '@sanity/icons';
import { buttonURLValidation } from '../../../lib/urlValidation';
import { componentSpecificValidation } from '../../shared/validation';

export const linkComponent = defineType({
  name: 'linkComponent',
  title: 'Lenker',
  type: 'object',
  icon: LinkIcon,
  description: 'Lag en gruppe med lenker med valgfri beskrivelsestekst',
  groups: [
    {
      name: 'content',
      title: 'Innhold',
      default: true,
    },
  ],
  fields: [
    defineField({
      name: 'links',
      title: 'Lenker',
      type: 'array',
      group: 'content',
      description: 'Legg til én eller flere lenker',
      validation: (Rule) => Rule.min(1).max(10).error('Du må ha mellom 1 og 10 lenker'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'link',
          title: 'Lenke',
          icon: LinkIcon,
          fields: [
            defineField({
              name: 'linkType',
              title: 'Lenketype',
              type: 'string',
              description: 'Velg om lenken skal gå til en ekstern nettside eller en intern side',
              options: {
                list: [
                  { title: 'Ekstern lenke', value: 'external' },
                  { title: 'Intern side', value: 'internal' },
                ],
                layout: 'radio',
              },
              initialValue: 'external',
            }),
            defineField({
              name: 'text',
              title: 'Lenketekst',
              type: 'string',
              description: 'Synlig tekst for lenken',
              validation: componentSpecificValidation.linkText,
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Hvor lenken skal gå (https://, mailto:, eller tel:)',
              hidden: ({ parent }) => parent?.linkType === 'internal',
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const parent = context.parent as { linkType?: string; internalLink?: any };
                  const linkType = parent?.linkType || 'external';

                  // If no linkType set, check if this is an old external link
                  if (!parent?.linkType && !parent?.internalLink && !value) {
                    return 'URL er påkrevd';
                  }

                  if (linkType === 'external' && !value) {
                    return 'URL er påkrevd for eksterne lenker';
                  }
                  if (value) {
                    return buttonURLValidation(value, context);
                  }
                  return true;
                }),
            }),
            defineField({
              name: 'internalLink',
              title: 'Intern side',
              type: 'reference',
              description: 'Velg hvilken side lenken skal gå til',
              to: [
                { type: 'homepage' },
                { type: 'programPage' },
                { type: 'artistPage' },
                { type: 'articlePage' },
                { type: 'page' },
                { type: 'event' },
                { type: 'artist' },
                { type: 'article' },
              ],
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
            defineField({
              name: 'description',
              title: 'Beskrivelse',
              type: 'string',
              description: 'Valgfri kort tekst under lenken (én linje)',
              validation: (Rule) => Rule.max(150).warning('Beskrivelsen bør være under 150 tegn'),
            }),
            defineField({
              name: 'openInNewTab',
              title: 'Åpne i ny fane',
              type: 'boolean',
              description: 'Åpne lenken i en ny fane (kun for eksterne lenker)',
              initialValue: false,
            }),
          ],
          preview: {
            select: {
              title: 'text',
              url: 'url',
              linkType: 'linkType',
              internalLink: 'internalLink',
              openInNewTab: 'openInNewTab',
            },
            prepare({ title, url, linkType, internalLink, openInNewTab }) {
              const newTabText = openInNewTab ? ' • Ny fane' : '';
              let linkDestination = 'Ingen URL';

              if (linkType === 'internal') {
                linkDestination = internalLink
                  ? `Intern: ${internalLink._ref?.slice(0, 8)}...`
                  : 'Ingen side valgt';
              } else {
                linkDestination = url || 'Ingen URL';
              }

              return {
                title: title || 'Uten tekst',
                subtitle: `${linkDestination}${newTabText}`,
                media: LinkIcon,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      links: 'links',
    },
    prepare({ links }) {
      const linkCount = links?.length || 0;
      const firstLinkText = links?.[0]?.text || 'Ingen lenker';

      return {
        title: 'Lenker',
        subtitle: `${linkCount} lenke${linkCount !== 1 ? 'r' : ''} • ${firstLinkText}${linkCount > 1 ? '...' : ''}`,
        media: LinkIcon,
      };
    },
  },
});
