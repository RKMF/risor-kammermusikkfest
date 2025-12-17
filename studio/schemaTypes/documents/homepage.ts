import { defineField, defineType } from 'sanity';
import { DocumentIcon, ComposeIcon, CogIcon, LinkIcon } from '@sanity/icons';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { seoFields, seoGroup } from '../objects/seoFields';
import { componentValidation } from '../shared/validation';
import type { HomepageData } from '../shared/types';
import { getLanguageStatus } from '../shared/previewHelpers';
import { publishingGroup } from '../shared/publishingFields';

export const homepage = defineType({
  name: 'homepage',
  title: 'Forsider',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    {
      name: 'admin',
      title: 'Administrativt',
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
    publishingGroup,
    seoGroup,
  ],
  fields: [
    // ADMINISTRATIVT
    defineField({
      name: 'adminTitle',
      title: 'Administrativ tittel',
      type: 'string',
      description:
        'OBS: Kun for Studio-oversikt - vises IKKE på nettsiden. Bruk beskrivende navn som "Juleforsiden 2024" eller "Påskekampanje"',
      validation: componentValidation.title,
      group: 'admin',
    }),

    // HEADER-LENKER NORSK (vises i blå boks med logo)
    defineField({
      name: 'headerLinks_no',
      title: 'Header-lenker',
      type: 'array',
      description:
        'Opptil 4 CTA-lenker som vises i header-boksen ved siden av logoen. Hvis tom, vises ingen header-boks.',
      group: 'no',
      validation: (Rule) => Rule.max(4).error('Maks 4 header-lenker'),
      of: [
        {
          type: 'object',
          name: 'headerLink',
          title: 'Lenke',
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
              to: [
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
        },
      ],
    }),

    // NORSK INNHOLD
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'pageBuilder',
      description: 'Innhold som vises under header-boksen (marquee, seksjoner, etc.)',
      group: 'no',
    }),

    // HEADER-LENKER ENGELSK (displayed in blue box with logo)
    defineField({
      name: 'headerLinks_en',
      title: 'Header links',
      type: 'array',
      description:
        'Up to 4 CTA links displayed in the header box next to the logo. If empty, no header box is shown.',
      group: 'en',
      validation: (Rule) => Rule.max(4).error('Max 4 header links'),
      of: [
        {
          type: 'object',
          name: 'headerLinkEn',
          title: 'Link',
          icon: LinkIcon,
          fields: [
            defineField({
              name: 'linkType',
              title: 'Link type',
              type: 'string',
              options: {
                list: [
                  { title: 'External link', value: 'external' },
                  { title: 'Internal page', value: 'internal' },
                ],
                layout: 'radio',
              },
              initialValue: 'internal',
            }),
            defineField({
              name: 'text',
              title: 'Link text',
              type: 'string',
              description: 'The text displayed on the link',
              validation: (Rule) => Rule.required().error('Link text is required'),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
              description: 'Optional subtitle displayed below the link',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'External URL (https://...)',
              hidden: ({ parent }) => parent?.linkType === 'internal',
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const parent = context.parent as { linkType?: string };
                  if (parent?.linkType === 'external' && !value) {
                    return 'URL is required for external links';
                  }
                  return true;
                }),
            }),
            defineField({
              name: 'internalLink',
              title: 'Internal page',
              type: 'reference',
              description: 'Select which page the link should go to',
              to: [
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
                    return 'You must select an internal page';
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
              const linkInfo = linkType === 'internal' ? 'Internal link' : url || 'No URL';
              return {
                title: title || 'No text',
                subtitle: description ? `${description} • ${linkInfo}` : linkInfo,
                media: LinkIcon,
              };
            },
          },
        },
      ],
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'pageBuilder',
      description:
        'Build English homepage with components and content. Start with an H1 heading that becomes the page main title',
      group: 'en',
      components: {
        input: createMirrorPortableTextInput('content_no'),
      },
    }),

    // PUBLISERING
    defineField({
      name: 'homePageType',
      title: 'Forsidetype',
      type: 'string',
      description: 'Velg forsidetype',
      group: 'publishing',
      options: {
        list: [
          { title: 'Standard forside', value: 'default' },
          { title: 'Planlagt forside', value: 'scheduled' },
        ],
        layout: 'radio',
      },
      initialValue: 'scheduled',
    }),
    defineField({
      name: 'scheduledPeriod',
      title: 'Planlagt periode',
      type: 'object',
      group: 'publishing',
      hidden: ({ document }) => document?.homePageType === 'default',
      fieldsets: [
        {
          name: 'timing',
          options: { columns: 2 },
        },
      ],
      fields: [
        {
          name: 'startDate',
          title: 'Startdato',
          type: 'datetime',
          description: 'Når denne forsiden blir aktiv',
          fieldset: 'timing',
        },
        {
          name: 'endDate',
          title: 'Sluttdato',
          type: 'datetime',
          description: 'Når denne forsiden slutter å være aktiv',
          fieldset: 'timing',
        },
      ],
    }),
    ...seoFields,
  ],
  preview: {
    select: {
      adminTitle: 'adminTitle',
      homePageType: 'homePageType',
      startDate: 'scheduledPeriod.startDate',
      endDate: 'scheduledPeriod.endDate',
      hasNorwegian: 'content_no',
      hasEnglish: 'content_en',
    },
    prepare({ adminTitle, homePageType, startDate, endDate, hasNorwegian, hasEnglish }) {
      // Use shared helper for language status
      const langStatus = getLanguageStatus({ hasNorwegian, hasEnglish });
      const langText = langStatus !== 'Ingen språk valgt' ? ` • ${langStatus}` : '';

      // Period status
      const periodStatus =
        homePageType === 'default'
          ? 'Standard forside'
          : startDate && endDate
            ? `${new Date(startDate).toLocaleDateString('nb-NO')} ${new Date(startDate).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} → ${new Date(endDate).toLocaleDateString('nb-NO')} ${new Date(endDate).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
            : 'Ingen periode satt';

      return {
        title: adminTitle || 'Uten tittel',
        subtitle: `${periodStatus}${langText}`,
        media: DocumentIcon,
      };
    },
  },
});
