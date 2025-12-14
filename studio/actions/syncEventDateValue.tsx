import {useCallback, useEffect} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'

/**
 * Document action that automatically syncs eventDateValue from referenced eventDate
 * This enables proper sorting of events by date + time in Studio lists
 * Runs automatically when publishing
 */
export const syncEventDateValue: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {patch, publish} = useDocumentOperation(id, type)

  // Only apply to event documents
  if (type !== 'event') {
    return null
  }

  const doc = draft || published
  const eventDateRef = (doc?.eventDate as {_ref?: string} | undefined)?._ref

  const syncDateValue = useCallback(async () => {
    if (!eventDateRef) {
      return
    }

    try {
      // Fetch the actual date from the referenced eventDate document
      const dateValue = await client.fetch<string>(
        `*[_id == $ref][0].date`,
        {ref: eventDateRef}
      )

      if (dateValue) {
        // Patch the document to update eventDateValue
        patch.execute([{set: {eventDateValue: dateValue}}])
      }
    } catch (error) {
      console.error('Failed to sync eventDateValue:', error)
    }
  }, [eventDateRef, client, patch])

  // Auto-sync when publishing
  const handlePublish = useCallback(async () => {
    // First sync the date value
    await syncDateValue()

    // Then publish
    publish.execute()

    onComplete()
  }, [syncDateValue, publish, onComplete])

  // Replace the default publish action
  return {
    label: 'Lagre',
    onHandle: handlePublish,
    disabled: !!publish.disabled,
  }
}
