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
 * Handles both proper reference objects AND corrupted plain string IDs (for backwards compatibility)
 */
export function hasReference(
  references: Array<{_ref: string} | string> | undefined,
  targetId: string
): boolean {
  if (!references || !Array.isArray(references)) return false

  const publishedId = getPublishedId(targetId)

  return references.some((ref) => {
    // Handle plain string (corrupted data format - should not occur with fixed GROQ query)
    if (typeof ref === 'string') {
      console.warn('[BiSync] ⚠️ Found corrupted string reference:', ref)
      return getPublishedId(ref) === publishedId
    }

    // Handle proper reference object
    if (!ref || !ref._ref) return false
    return getPublishedId(ref._ref) === publishedId
  })
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
  // Use order(_id desc) to ensure draft is returned first if it exists (drafts. sorts after published IDs)
  // This is critical - without ordering, GROQ returns non-deterministic results
  const sourceDoc = await client.fetch(
    `*[_id in [$publishedId, $draftId]] | order(_id desc)[0]{
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

    // Use order(_id desc) to ensure draft is returned first if it exists
    // This prevents checking stale published versions when a draft exists
    const targetDoc = await client.fetch(
      `*[_id in [$publishedId, $draftId]] | order(_id desc)[0]{
        _id,
        "${targetFieldName}": ${targetFieldName}[]
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

/**
 * Find documents that have a reciprocal reference but shouldn't (orphaned references)
 * This is the inverse of findMissingReciprocalReferences - finds references that need to be REMOVED
 * @param client - Sanity client instance
 * @param sourceDocId - The document ID that had references removed
 * @param sourceFieldName - Field name containing the references (e.g., 'events', 'artist')
 * @param targetType - Document type to query (e.g., 'event', 'artist')
 * @param targetFieldName - Field name in target documents to check (e.g., 'artist', 'events')
 * @returns Array of document IDs that have orphaned references and need cleanup
 */
export async function findOrphanedReciprocalReferences(
  client: SanityClient,
  sourceDocId: string,
  sourceFieldName: string,
  targetType: string,
  targetFieldName: string
): Promise<string[]> {
  const {publishedId} = getDocumentIds(sourceDocId)

  // Get the source document with its current references
  // Use order(_id desc) to ensure draft is returned first if it exists
  const sourceDoc = await client.fetch(
    `*[_id in [$publishedId, $draftId]] | order(_id desc)[0]{
      _id,
      "${sourceFieldName}": ${sourceFieldName}[]._ref
    }`,
    {publishedId, draftId: `drafts.${publishedId}`}
  )

  // Get current references from source document (empty array if none)
  const currentReferences = sourceDoc?.[sourceFieldName] || []

  // Find all documents of target type that reference this source document
  // These are documents that THINK they're related to the source
  const query = `*[_type == $targetType && references($sourceId)]{
    _id,
    "${targetFieldName}": ${targetFieldName}[]
  }`

  const referencingDocs = await client.fetch(query, {
    targetType,
    sourceId: publishedId,
  })

  // Find documents that reference the source but are NOT in the source's current reference list
  const orphanedReferences: string[] = []

  for (const doc of referencingDocs) {
    const docPublishedId = getPublishedId(doc._id)

    // Check if this document is still in the source's reference list
    const stillReferenced = currentReferences.some(
      (refId: string) => getPublishedId(refId) === docPublishedId
    )

    // If the document references the source but is NOT in source's list, it's orphaned
    if (!stillReferenced) {
      orphanedReferences.push(doc._id)
    }
  }

  return orphanedReferences
}

/**
 * Remove a reference from a document's array field
 * @param client - Sanity client instance
 * @param documentId - ID of document to update
 * @param fieldName - Field name to remove from
 * @param referenceId - ID of document reference to remove
 */
export async function removeReferenceFromDocument(
  client: SanityClient,
  documentId: string,
  fieldName: string,
  referenceId: string
): Promise<void> {
  const {publishedId, draftId} = getDocumentIds(documentId)
  const {publishedId: refPublishedId} = getDocumentIds(referenceId)

  // Fetch the current document to get its reference array
  // Use order(_id desc) to ensure draft is returned first if it exists
  const doc = await client.fetch(
    `*[_id in [$publishedId, $draftId]] | order(_id desc)[0]{
      _id,
      "${fieldName}": ${fieldName}[]
    }`,
    {publishedId, draftId}
  )

  if (!doc || !doc[fieldName]) {
    return // Nothing to remove
  }

  // Filter out the reference we want to remove
  const updatedReferences = doc[fieldName].filter((ref: {_ref: string}) => {
    return getPublishedId(ref._ref) !== refPublishedId
  })

  // Update the document with the filtered array (use the actual doc._id which might be draft)
  await client.patch(doc._id).set({[fieldName]: updatedReferences}).commit()
}

/**
 * Remove reciprocal references from multiple documents
 * @param client - Sanity client instance
 * @param sourceDocId - The source document that had references removed
 * @param targetDocIds - Array of target document IDs to clean up
 * @param targetFieldName - Field name in target documents to remove from
 */
export async function removeReciprocalReferences(
  client: SanityClient,
  sourceDocId: string,
  targetDocIds: string[],
  targetFieldName: string
): Promise<void> {
  for (const targetId of targetDocIds) {
    await removeReferenceFromDocument(client, targetId, targetFieldName, sourceDocId)
  }
}
