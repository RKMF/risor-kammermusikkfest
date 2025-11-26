import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {PublishIcon, CheckmarkIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {
  findMissingReciprocalReferences,
  syncReciprocalReferences,
  findOrphanedReciprocalReferences,
  removeReciprocalReferences,
} from '../utils/bidirectionalSync'

/**
 * Composite publish action for events that:
 * 1. Checks for missing reciprocal artist references (before publishing)
 * 2. Syncs eventDateValue from referenced eventDate (for sorting)
 * 3. Publishes the document
 * 4. Checks for orphaned artist references (after publishing)
 * 5. Shows artist sync dialog if needed (adds event to artists)
 * 6. Shows orphaned artist cleanup dialog if needed (removes event from artists)
 * 7. Shows program page dialog for new publishes
 */
export const compositeEventPublishAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {patch, publish} = useDocumentOperation(id, type)

  // Dialog states
  const [artistDialogOpen, setArtistDialogOpen] = useState(false)
  const [orphanedArtistDialogOpen, setOrphanedArtistDialogOpen] = useState(false)
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAddingToProgram, setIsAddingToProgram] = useState(false)

  // Artist sync state
  const [missingArtistRefs, setMissingArtistRefs] = useState<string[]>([])
  const [artistCount, setArtistCount] = useState(0)

  // Orphaned artist cleanup state
  const [orphanedArtistRefs, setOrphanedArtistRefs] = useState<string[]>([])
  const [orphanedArtistCount, setOrphanedArtistCount] = useState(0)

  // Only apply to event documents
  if (type !== 'event') {
    return null
  }

  const doc = draft || published
  const eventDateRef = doc?.eventDate?._ref
  const isNewPublish = draft && !published

  // Step 1: Sync eventDateValue
  const syncDateValue = useCallback(async () => {
    if (!eventDateRef) {
      return
    }

    try {
      const dateValue = await client.fetch<string>(
        `*[_id == $ref][0].date`,
        {ref: eventDateRef}
      )

      if (dateValue) {
        patch.execute([{set: {eventDateValue: dateValue}}])
      }
    } catch (error) {
      console.error('Failed to sync eventDateValue:', error)
    }
  }, [eventDateRef, client, patch])

  // Step 2 & 3 & 4: Check for missing artist references, sync date, publish, check for orphaned references
  const handlePublish = useCallback(async () => {
    // Check for missing reciprocal artist references BEFORE publishing
    // This ensures we query the draft document which has the current data
    let missing: string[] = []
    try {
      missing = await findMissingReciprocalReferences(
        client,
        id,
        'artist',
        'artist',
        'events'
      )
    } catch (error) {
      console.error('[Event Publish] Error checking reciprocal references:', error)
    }

    // Sync the date value
    await syncDateValue()

    // Publish the document
    await publish.execute()

    // Check for orphaned references AFTER publishing
    let orphaned: string[] = []
    try {
      orphaned = await findOrphanedReciprocalReferences(
        client,
        id,
        'artist',
        'artist',
        'events'
      )
    } catch (error) {
      console.error('[Event Publish] Error checking orphaned references:', error)
    }

    setOrphanedArtistRefs(orphaned)
    setOrphanedArtistCount(orphaned.length)

    // Show artist sync dialog if needed (additions)
    if (missing.length > 0) {
      setMissingArtistRefs(missing)
      setArtistCount(missing.length)
      setArtistDialogOpen(true)
    } else if (orphaned.length > 0) {
      setOrphanedArtistDialogOpen(true)
    } else if (isNewPublish) {
      // If no sync needed, check if we should show program dialog
      setProgramDialogOpen(true)
    } else {
      onComplete()
    }
  }, [syncDateValue, publish, client, id, isNewPublish, onComplete])

  // Step 5: Handle artist sync (additions)
  const handleArtistSync = useCallback(
    async (shouldSync: boolean) => {
      if (!shouldSync) {
        setArtistDialogOpen(false)
        if (orphanedArtistRefs.length > 0) {
          setOrphanedArtistDialogOpen(true)
        } else if (isNewPublish) {
          setProgramDialogOpen(true)
        } else {
          onComplete()
        }
        return
      }

      setIsSyncing(true)

      try {
        await syncReciprocalReferences(
          client,
          id,
          missingArtistRefs,
          'events'
        )

        setArtistDialogOpen(false)

        if (orphanedArtistRefs.length > 0) {
          setOrphanedArtistDialogOpen(true)
        } else if (isNewPublish) {
          setProgramDialogOpen(true)
        } else {
          onComplete()
        }
      } catch (error) {
        console.error('Error syncing reciprocal references:', error)
        setArtistDialogOpen(false)
        onComplete()
      } finally {
        setIsSyncing(false)
      }
    },
    [client, id, missingArtistRefs, orphanedArtistRefs, isNewPublish, onComplete]
  )

  // Step 6: Handle orphaned artist cleanup (removals)
  const handleOrphanedArtistCleanup = useCallback(
    async (shouldCleanup: boolean) => {
      if (!shouldCleanup) {
        setOrphanedArtistDialogOpen(false)
        // After declining cleanup, check if we should show program dialog
        if (isNewPublish) {
          setProgramDialogOpen(true)
        } else {
          onComplete()
        }
        return
      }

      setIsRemoving(true)

      try {
        await removeReciprocalReferences(
          client,
          id,
          orphanedArtistRefs,
          'events' // Field name in artists to remove from
        )

        setOrphanedArtistDialogOpen(false)

        // After cleanup, check if we should show program dialog
        if (isNewPublish) {
          setProgramDialogOpen(true)
        } else {
          onComplete()
        }
      } catch (error) {
        console.error('Error removing orphaned references:', error)
        setOrphanedArtistDialogOpen(false)
        onComplete()
      } finally {
        setIsRemoving(false)
      }
    },
    [client, id, orphanedArtistRefs, isNewPublish, onComplete]
  )

  // Step 7: Handle program page addition
  const handleAddToProgram = useCallback(
    async (addToProgram: boolean) => {
      if (!addToProgram) {
        setProgramDialogOpen(false)
        onComplete()
        return
      }

      setIsAddingToProgram(true)

      try {
        const programPage = await client.fetch(
          `*[_type == "programPage"][0]{_id, _rev, selectedEvents}`
        )

        if (!programPage) {
          console.error('Could not find programPage')
          setProgramDialogOpen(false)
          onComplete()
          return
        }

        const publishedId = id.replace(/^drafts\./, '')
        const existingEvents = programPage.selectedEvents || []
        const eventRefs = existingEvents.map((ref: any) => ref._ref)

        if (eventRefs.includes(publishedId)) {
          setProgramDialogOpen(false)
          onComplete()
          return
        }

        await client
          .patch(programPage._id)
          .setIfMissing({selectedEvents: []})
          .append('selectedEvents', [
            {
              _type: 'reference',
              _ref: publishedId,
              _key: `event-${Date.now()}`,
            },
          ])
          .commit()

        setProgramDialogOpen(false)
        onComplete()
      } catch (error) {
        console.error('Error adding event to program page:', error)
        setProgramDialogOpen(false)
        onComplete()
      } finally {
        setIsAddingToProgram(false)
      }
    },
    [id, client, onComplete]
  )

  return {
    label: 'Lagre',
    icon: PublishIcon,
    disabled: publish.disabled,
    title: publish.disabled ? 'Ingen endringer å lagre' : undefined,
    onHandle: handlePublish,
    dialog: artistDialogOpen
      ? {
          type: 'dialog',
          onClose: () => {
            setArtistDialogOpen(false)
            onComplete()
          },
          header: 'Synkroniser artister?',
          content: (
            <Stack space={4} padding={4}>
              <Text>
                {artistCount === 1
                  ? 'Det er 1 artist som ikke har dette arrangementet i sin arrangementsliste.'
                  : `Det er ${artistCount} artister som ikke har dette arrangementet i sine arrangementslister.`}
              </Text>
              <Text>Vil du legge til dette arrangementet automatisk hos artistene?</Text>
              <Text size={1} muted>
                Dette sikrer at forholdet mellom artist og arrangement er toveis.
              </Text>
              <Flex gap={3} justify="flex-end">
                <Button
                  text="Nei, ikke synkroniser"
                  mode="ghost"
                  onClick={() => handleArtistSync(false)}
                  disabled={isSyncing}
                />
                <Button
                  text="Ja, synkroniser"
                  tone="primary"
                  icon={CheckmarkIcon}
                  onClick={() => handleArtistSync(true)}
                  loading={isSyncing}
                />
              </Flex>
            </Stack>
          ),
        }
      : orphanedArtistDialogOpen
        ? {
            type: 'dialog',
            onClose: () => {
              setOrphanedArtistDialogOpen(false)
              onComplete()
            },
            header: 'Fjern arrangementet fra artister?',
            content: (
              <Stack space={4} padding={4}>
                <Text>
                  {orphanedArtistCount === 1
                    ? 'Det er 1 artist som fremdeles har dette arrangementet i sin arrangementsliste, men arrangementet har ikke lenger artisten i sin liste.'
                    : `Det er ${orphanedArtistCount} artister som fremdeles har dette arrangementet i sine arrangementslister, men arrangementet har ikke lenger disse artistene i sin liste.`}
                </Text>
                <Text>Vil du fjerne dette arrangementet automatisk fra artistene?</Text>
                <Text size={1} muted>
                  Dette sikrer at forholdet mellom artist og arrangement forblir toveis.
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Button
                    text="Nei, ikke fjern"
                    mode="ghost"
                    onClick={() => handleOrphanedArtistCleanup(false)}
                    disabled={isRemoving}
                  />
                  <Button
                    text="Ja, fjern"
                    tone="primary"
                    icon={CheckmarkIcon}
                    onClick={() => handleOrphanedArtistCleanup(true)}
                    loading={isRemoving}
                  />
                </Flex>
              </Stack>
            ),
          }
        : programDialogOpen
        ? {
            type: 'dialog',
            onClose: () => {
              setProgramDialogOpen(false)
              onComplete()
            },
            header: 'Legg til på programsiden?',
            content: (
              <Stack space={4} padding={4}>
                <Text>
                  Vil du at dette arrangementet skal vises på programsiden?
                </Text>
                <Text size={1} muted>
                  Du kan også legge det til senere under Programside → Arrangementer-fanen.
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Button
                    text="Nei, ikke vis på programsiden"
                    mode="ghost"
                    onClick={() => handleAddToProgram(false)}
                    disabled={isAddingToProgram}
                  />
                  <Button
                    text="Ja, vis på programsiden"
                    tone="primary"
                    icon={CheckmarkIcon}
                    onClick={() => handleAddToProgram(true)}
                    loading={isAddingToProgram}
                  />
                </Flex>
              </Stack>
            ),
          }
        : false,
  }
}
