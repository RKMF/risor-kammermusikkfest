import { defineField, defineType } from 'sanity';
import { DocumentIcon, ComposeIcon, CogIcon } from '@sanity/icons';
import { createMirrorPortableTextInput } from '../../components/inputs/MirrorPortableTextInput';
import { seoFields, seoGroup } from '../objects/seoFields';
import { componentValidation } from '../shared/validation';
import type { HomepageData } from '../shared/types';
import { getHomepageStatusText, getLanguageStatus } from '../shared/previewHelpers';
import { publishingGroup } from '../shared/publishingFields';

interface HomepageIdentitySource {
  _id?: string;
}

interface HomepageScheduledPeriodValue {
  startDate?: string;
  endDate?: string;
}

function getHomepageIdentity(document: {_id?: string} = {}) {
  const publishedId = document._id?.replace(/^drafts\./, '');
  return {
    draftId: publishedId ? `drafts.${publishedId}` : undefined,
    publishedId,
  };
}

async function findConflictingDefaultHomepage(document: {_id?: string}, context: any) {
  const client = context.getClient({apiVersion: '2024-10-01'});
  const { draftId, publishedId } = getHomepageIdentity(document);

  return client.fetch(
    `*[
      _type == "homepage" &&
      homePageType == "default" &&
      !(_id in [$draftId, $publishedId])
    ][0]{
      _id,
      adminTitle
    }`,
    { draftId, publishedId }
  );
}

async function findOverlappingHomepage(document: any, context: any) {
  const client = context.getClient({apiVersion: '2024-10-01'});
  const { draftId, publishedId } = getHomepageIdentity(document);

  return client.fetch(
    `*[
      _type == "homepage" &&
      homePageType == "scheduled" &&
      defined(scheduledPeriod.startDate) &&
      defined(scheduledPeriod.endDate) &&
      !(_id in [$draftId, $publishedId]) &&
      scheduledPeriod.startDate < $endDate &&
      scheduledPeriod.endDate > $startDate
    ] | order(scheduledPeriod.startDate desc)[0]{
      _id,
      adminTitle,
      scheduledPeriod
    }`,
    {
      draftId,
      publishedId,
      startDate: document?.scheduledPeriod?.startDate,
      endDate: document?.scheduledPeriod?.endDate,
    }
  );
}

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

    // NORSK INNHOLD
    defineField({
      name: 'content_no',
      title: 'Sideinnhold (norsk)',
      type: 'homepagePageBuilder',
      description:
        'Bygg norsk forside med komponenter og innhold. Forside-tittel (H1) brukes som hovedtittel over hero-seksjonen.',
      group: 'no',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'content_en',
      title: 'Page content (English)',
      type: 'homepagePageBuilder',
      description:
        'Build English homepage with components and content. Homepage title (H1) becomes the main title above the hero section.',
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
      validation: (Rule) =>
        Rule.required().custom(async (value, context) => {
          if (value !== 'default') {
            return true;
          }

          const conflictingDefault = await findConflictingDefaultHomepage(
            (context.document as HomepageIdentitySource | undefined) ?? {},
            context
          );
          if (!conflictingDefault) {
            return true;
          }

          return {
            message: `En annen standard forside finnes allerede: "${conflictingDefault.adminTitle || conflictingDefault._id}"`,
            level: 'warning',
          };
        }),
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
      validation: (Rule) =>
        Rule.custom(async (value, context) => {
          const isScheduled = context.document?.homePageType === 'scheduled';
          const scheduledPeriod = (value as HomepageScheduledPeriodValue | undefined) ?? {};

          if (!isScheduled) {
            return true;
          }

          const startDate = scheduledPeriod.startDate;
          const endDate = scheduledPeriod.endDate;

          if (!startDate || !endDate) {
            return 'Startdato og sluttdato er påkrevd for planlagte forsider';
          }

          if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
            return 'Sluttdato må være etter startdato';
          }

          const overlappingHomepage = await findOverlappingHomepage(context.document ?? {}, context);
          if (!overlappingHomepage) {
            return true;
          }

          return {
            message: `Overlapper med "${overlappingHomepage.adminTitle || overlappingHomepage._id}"`,
            level: 'warning',
          };
        }),
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

      const statusText = getHomepageStatusText(homePageType, startDate, endDate);
      const dateRangeText =
        homePageType === 'scheduled' && startDate && endDate
          ? ` • ${new Date(startDate).toLocaleDateString('nb-NO')} ${new Date(startDate).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })} → ${new Date(endDate).toLocaleDateString('nb-NO')} ${new Date(endDate).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}`
          : '';

      return {
        title: adminTitle || 'Uten tittel',
        subtitle: `${statusText}${dateRangeText}${langText}`,
        media: DocumentIcon,
      };
    },
  },
});
