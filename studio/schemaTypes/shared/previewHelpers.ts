/**
 * Shared preview helper functions for document schemas
 *
 * These functions consolidate duplicate preview logic across document types
 * (artist, article, page, event, homepage) to maintain consistency and reduce
 * code duplication.
 */

/**
 * Interface for language field detection
 * Different document types have different field names, so we check all possibilities
 */
interface LanguageFields {
  // Common fields across most document types
  title_no?: string;
  title_en?: string;
  excerpt_no?: string;
  excerpt_en?: string;
  content_no?: any;
  content_en?: any;

  // Artist-specific fields
  instrument_no?: string;
  instrument_en?: string;

  // Boolean flags (for backward compatibility)
  hasNorwegian?: boolean;
  hasEnglish?: boolean;
}

/**
 * Determines publishing status text based on document state and scheduling
 *
 * @param _id - Document ID (used to check if published or draft)
 * @param publishingStatus - Status from publishingStatus field ('published', 'draft', 'scheduled')
 * @param scheduledStart - Start date for scheduled content
 * @param scheduledEnd - End date for scheduled content
 * @returns Status text in Norwegian: 'Publisert', 'Utkast', 'Live', 'Venter', or 'Utløpt'
 */
export function getPublishingStatusText(
  _id: string | undefined,
  publishingStatus?: string,
  scheduledStart?: string,
  scheduledEnd?: string
): string {
  // Check if document is published (not a draft)
  const isPublished = _id && !_id.startsWith('drafts.');
  let statusText = isPublished ? 'Publisert' : 'Utkast';

  // Handle staging status
  if (publishingStatus === 'staging') {
    statusText = 'Staging';
    return statusText;
  }

  // Handle scheduled content timing
  if (publishingStatus === 'scheduled' && scheduledStart && scheduledEnd) {
    const now = new Date();
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (now >= start && now <= end) {
      statusText = 'Live'; // Currently within scheduled period
    } else if (now < start) {
      statusText = 'Venter'; // Waiting for scheduled start
    } else {
      statusText = 'Utløpt'; // Past scheduled end date
    }
  }

  return statusText;
}

/**
 * Determines which languages have content in a multilingual document
 *
 * This function checks for Norwegian and English content across various field types.
 * It handles different field naming patterns used by different document types.
 *
 * @param fields - Object containing various language-specific fields
 * @returns Language status string: 'NO', 'EN', 'NO EN', or 'Ingen språk valgt'
 */
export function getLanguageStatus(fields: LanguageFields): string {
  const languages: string[] = [];

  // Check for Norwegian content
  // We check multiple possible field names to support different document types
  const hasNorwegian =
    fields.hasNorwegian || // Boolean flag (some document types)
    fields.title_no ||
    fields.excerpt_no ||
    fields.content_no ||
    fields.instrument_no; // Artist-specific

  if (hasNorwegian) {
    languages.push('NO');
  }

  // Check for English content
  const hasEnglish =
    fields.hasEnglish || // Boolean flag (some document types)
    fields.title_en ||
    fields.excerpt_en ||
    fields.content_en ||
    fields.instrument_en; // Artist-specific

  if (hasEnglish) {
    languages.push('EN');
  }

  // Return formatted language status
  return languages.length > 0 ? languages.join(' ') : 'Ingen språk valgt';
}
