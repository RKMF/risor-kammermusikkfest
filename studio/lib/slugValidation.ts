import type { ValidationContext } from 'sanity';

/**
 * Creates a unique slug validation function for a specific document type
 * @param documentType - The document type to check for unique slugs
 * @returns Validation function that checks for slug uniqueness
 */
export function createUniqueSlugValidation(documentType: string) {
  return async (slug: { current?: string } | undefined, context: ValidationContext) => {
    if (!slug?.current) return true;

    const { document, getClient } = context;
    const client = getClient({ apiVersion: '2025-01-01' });

    // Get the current document ID, handling both published and draft documents
    const currentDocId = document?._id?.replace(/^drafts\./, '');

    // Query for documents with the same slug, excluding the current document (both published and draft versions)
    const query = `*[_type == $type && slug.current == $slug && _id != $id && _id != $draftId][0]`;
    const params = {
      type: documentType,
      slug: slug.current,
      id: currentDocId,
      draftId: `drafts.${currentDocId}`,
    };

    try {
      const existing = await client.fetch(query, params);
      return existing
        ? `Slug "${slug.current}" is already in use. Please choose a different one.`
        : true;
    } catch (error) {
      console.error('Error validating slug uniqueness:', error);
      // Return true to allow saving if validation fails (graceful degradation)
      return true;
    }
  };
}

/**
 * Special validation for event slugs that checks both Norwegian and English slug fields
 */
export async function eventSlugValidation(
  slug: { current?: string } | undefined,
  context: ValidationContext
) {
  if (!slug?.current) return true;

  const { document, getClient } = context;
  const client = getClient({ apiVersion: '2025-01-01' });
  const currentDocId = document?._id?.replace(/^drafts\./, '');

  // Check if this slug exists in slug_no OR slug_en on OTHER events (not this one)
  const query = `*[
    _type == "event"
    && _id != $id
    && _id != $draftId
    && (slug_no.current == $slug || slug_en.current == $slug)
  ][0]`;

  const params = {
    slug: slug.current,
    id: currentDocId,
    draftId: `drafts.${currentDocId}`,
  };

  try {
    const existing = await client.fetch(query, params);
    return existing
      ? `Slug "${slug.current}" er allerede i bruk på et annet arrangement. Velg en annen.`
      : true;
  } catch (error) {
    console.error('Error validating slug uniqueness:', error);
    return true;
  }
}

/**
 * Pre-configured validation functions for common document types
 */
export const venueSlugValidation = createUniqueSlugValidation('venue');
export const artistSlugValidation = createUniqueSlugValidation('artist');
export const articleSlugValidation = createUniqueSlugValidation('article');
export const pageSlugValidation = createUniqueSlugValidation('page');
export const eventDateSlugValidation = createUniqueSlugValidation('eventDate');
