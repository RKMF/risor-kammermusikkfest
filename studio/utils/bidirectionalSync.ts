import type {SanityClient} from 'sanity'

/**
 * Utility functions for bidirectional reference syncing in Sanity Studio
 */

/**
 * Remove the 'drafts.' prefix from a document ID
 */
export function getPublishedId(id: string): string {
  return id.replace(/^drafts\./, '')
}

/**
 * Get both draft and published IDs for a document
 */
export function getDocumentIds(id: string): {publishedId: string; draftId: string} {
  const publishedId = getPublishedId(id)
  return {
    publishedId,
    draftId: `drafts.${publishedId}`,
  }
}

/**
 * Check if a reference array already contains a reference to a document
 */
export function hasReference(
  references: Array<{_ref: string}> | undefined,
  targetId: string
): boolean {
  if (!references || !Array.isArray(references)) return false
  const publishedId = getPublishedId(targetId)
  return references.some((ref) => getPublishedId(ref._ref) === publishedId)
}

/**
 * Find documents that are missing a reciprocal reference
 * @param client - Sanity client instance
 * @param sourceDocId - The document ID that has references
 * @param sourceFieldName - Field name containing the references (e.g., 'events', 'artist')
 * @param targetType - Document type to query (e.g., 'event', 'artist')
 * @param targetFieldName - Field name in target documents to check (e.g., 'artist', 'events')
 * @returns Array of document IDs that need to be updated
 */
export async function findMissingReciprocalReferences(
  client: SanityClient,
  sourceDocId: string,
  sourceFieldName: string,
  targetType: string,
  targetFieldName: string
): Promise<string[]> {
  const {publishedId} = getDocumentIds(sourceDocId)

  // Get the source document with its references
  const sourceDoc = await client.fetch(
    `*[_id in [$publishedId, $draftId]][0]{
      _id,
      "${sourceFieldName}": ${sourceFieldName}[]._ref
    }`,
    {publishedId, draftId: `drafts.${publishedId}`}
  )

  if (!sourceDoc || !sourceDoc[sourceFieldName] || sourceDoc[sourceFieldName].length === 0) {
    return []
  }

  const referencedIds = sourceDoc[sourceFieldName]

  // Query each referenced document to check if it has the reciprocal reference
  const missingReferences: string[] = []

  for (const targetId of referencedIds) {
    const {publishedId: targetPublishedId} = getDocumentIds(targetId)

    const targetDoc = await client.fetch(
      `*[_id in [$publishedId, $draftId]][0]{
        _id,
        "${targetFieldName}": ${targetFieldName}[]._ref
      }`,
      {publishedId: targetPublishedId, draftId: `drafts.${targetPublishedId}`}
    )

    if (targetDoc && !hasReference(targetDoc[targetFieldName], publishedId)) {
      missingReferences.push(targetDoc._id)
    }
  }

  return missingReferences
}

/**
 * Add a reference to a document's array field
 * @param client - Sanity client instance
 * @param documentId - ID of document to update
 * @param fieldName - Field name to append to
 * @param referenceId - ID of document to reference
 */
export async function addReferenceToDocument(
  client: SanityClient,
  documentId: string,
  fieldName: string,
  referenceId: string
): Promise<void> {
  const {publishedId: refPublishedId} = getDocumentIds(referenceId)

  await client
    .patch(documentId)
    .setIfMissing({[fieldName]: []})
    .append(fieldName, [
      {
        _type: 'reference',
        _ref: refPublishedId,
        _key: `${fieldName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    ])
    .commit()
}

/**
 * Sync reciprocal references for multiple documents
 * @param client - Sanity client instance
 * @param sourceDocId - The source document that has references
 * @param targetDocIds - Array of target document IDs to update
 * @param targetFieldName - Field name in target documents to update
 */
export async function syncReciprocalReferences(
  client: SanityClient,
  sourceDocId: string,
  targetDocIds: string[],
  targetFieldName: string
): Promise<void> {
  for (const targetId of targetDocIds) {
    await addReferenceToDocument(client, targetId, targetFieldName, sourceDocId)
  }
}
