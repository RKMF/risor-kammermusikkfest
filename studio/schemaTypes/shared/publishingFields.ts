/**
 * Shared publishing and scheduling fields for document schemas
 *
 * These reusable field definitions consolidate duplicate publishing logic
 * across document types (artist, article, page, event, homepage).
 */

import { defineField } from 'sanity';
import { CogIcon } from '@sanity/icons';
import { crossFieldValidation } from './validation';
import { PublishingStatusInput } from '../../components/inputs/PublishingStatusInput';

/**
 * Publishing status field - controls content visibility
 *
 * Options:
 * - published: Content is immediately visible
 * - draft: Content is saved but not visible
 * - scheduled: Content visibility controlled by date range
 *
 * @param groupName - Name of the group this field belongs to (default: 'publishing')
 * @returns Sanity field definition
 */
export const publishingStatusField = (groupName = 'publishing') =>
  defineField({
    name: 'publishingStatus',
    title: 'Publiseringsstatus',
    type: 'string',
    options: {
      list: [
        { title: 'Synlig på nett umiddelbart', value: 'published' },
        { title: 'Kun synlig på testside', value: 'staging' },
        { title: 'Lagre uten å bli synlig på nett', value: 'draft' },
        { title: 'Planlegg periode', value: 'scheduled' },
      ],
      layout: 'radio',
    },
    initialValue: 'published',
    validation: (Rule) => Rule.required(),
    group: groupName,
    components: {
      input: PublishingStatusInput,
    },
  });

/**
 * Scheduled period field - defines start and end dates for scheduled content
 *
 * Only visible when publishingStatus is set to 'scheduled'
 * Contains startDate and endDate fields arranged in two columns
 *
 * @param groupName - Name of the group this field belongs to (default: 'publishing')
 * @param contentType - Type of content for description text (default: 'innhold')
 * @returns Sanity field definition
 */
export const scheduledPeriodField = (groupName = 'publishing', contentType = 'innhold') =>
  defineField({
    name: 'scheduledPeriod',
    title: 'Planlagt periode',
    type: 'object',
    hidden: ({ document }) => document?.publishingStatus !== 'scheduled',
    group: groupName,
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
        description: `Når denne ${contentType} blir synlig på nettsiden`,
        fieldset: 'timing',
        validation: crossFieldValidation.requiredWhen('publishingStatus', 'scheduled'),
      },
      {
        name: 'endDate',
        title: 'Sluttdato',
        type: 'datetime',
        description: `Når denne ${contentType} slutter å være synlig på nettsiden`,
        fieldset: 'timing',
        validation: crossFieldValidation.requiredWhen('publishingStatus', 'scheduled'),
      },
    ],
  });

/**
 * Publishing group definition for document schema
 *
 * Use this in the groups array of your document type definition
 */
export const publishingGroup = {
  name: 'publishing',
  title: 'Publisering',
  icon: CogIcon,
};

/**
 * Convenience function to get both publishing fields at once
 *
 * Usage:
 * ```ts
 * fields: [
 *   ...otherFields,
 *   ...publishingFields('publishing', 'artikkelen'),
 *   ...seoFields,
 * ]
 * ```
 *
 * @param groupName - Name of the group (default: 'publishing')
 * @param contentType - Type of content for description text (default: 'innhold')
 * @returns Array of both publishing field definitions
 */
export function publishingFields(groupName = 'publishing', contentType = 'innhold') {
  return [publishingStatusField(groupName), scheduledPeriodField(groupName, contentType)];
}
