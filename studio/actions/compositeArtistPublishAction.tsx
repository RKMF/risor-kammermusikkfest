import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {PublishIcon, CheckmarkIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text, Spinner} from '@sanity/ui'
import {
  findMissingReciprocalReferences,
  syncReciprocalReferences,
  findOrphanedReciprocalReferences,
  removeReciprocalReferences,
} from '../utils/bidirectionalSync'

/**
 * Composite publish action for artists that:
 * 1. Checks for missing reciprocal event references (before publishing)
 * 2. Publishes the document
 * 3. Checks for orphaned event references (after publishing)
 * 4. Shows event sync dialog if needed (adds artist to events)
 * 5. Shows orphaned event cleanup dialog if needed (removes artist from events)
 * 6. Shows artist page dialog for new publishes (adds artist to artist listing)
 */
export const compositeArtistPublishAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {publish} = useDocumentOperation(id, type)

  // Dialog states
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [orphanedEventDialogOpen, setOrphanedEventDialogOpen] = useState(false)
  const [artistPageDialogOpen, setArtistPageDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isAddingToPage, setIsAddingToPage] = useState(false)

  // Event sync state
  const [missingEventRefs, setMissingEventRefs] = useState<string[]>([])
  const [eventCount, setEventCount] = useState(0)
  const [eventNames, setEventNames] = useState<string[]>([])

  // Orphaned event cleanup state
  const [orphanedEventRefs, setOrphanedEventRefs] = useState<string[]>([])
  const [orphanedEventCount, setOrphanedEventCount] = useState(0)
  const [orphanedEventNames, setOrphanedEventNames] = useState<string[]>([])

  // Only apply to artist documents
  if (type !== 'artist') {
    return null
  }

  const isNewPublish = draft && !published

  // Step 1: Check for missing event references, publish, then check for orphaned references
  const handlePublish = useCallback(async () => {
    // Show loading dialog immediately
    setLoadingDialogOpen(true)

    // Check for missing reciprocal event references BEFORE publishing
    // This ensures we query the draft document which has the current data
    let missing: string[] = []
    try {
      missing = await findMissingReciprocalReferences(
        client,
        id,
        'events', // Artist's field containing event references
        'event', // Target document type
        'artist' // Field in events that should reference back to this artist
      )
    } catch (error) {
      console.error('[Artist Publish] Error checking reciprocal references:', error)
    }

    // Publish the document
    await publish.execute()

    // Check for orphaned references AFTER publishing
    let orphaned: string[] = []
    try {
      orphaned = await findOrphanedReciprocalReferences(
        client,
        id,
        'events',
        'event',
        'artist'
      )
    } catch (error) {
      console.error('[Artist Publish] Error checking orphaned references:', error)
    }

    setOrphanedEventRefs(orphaned)
    setOrphanedEventCount(orphaned.length)

    // Close loading dialog before showing other dialogs
    setLoadingDialogOpen(false)

    // Show event sync dialog if needed (additions)
    if (missing.length > 0) {
      setMissingEventRefs(missing)
      setEventCount(missing.length)

      // Fetch event names for display
      const names = await Promise.all(
        missing.map(async (eventId) => {
          const event = await client.fetch<{title?: string; title_no?: string; title_en?: string}>(
            `*[_id == $id][0]{title, title_no, title_en}`,
            {id: eventId}
          )
          return event?.title_no || event?.title_en || event?.title || 'Ukjent arrangement'
        })
      )
      setEventNames(names)

      setEventDialogOpen(true)
    } else if (orphaned.length > 0) {
      // Fetch orphaned event names for display
      const orphanedNames = await Promise.all(
        orphaned.map(async (eventId) => {
          const event = await client.fetch<{title?: string; title_no?: string; title_en?: string}>(
            `*[_id == $id][0]{title, title_no, title_en}`,
            {id: eventId}
          )
          return event?.title_no || event?.title_en || event?.title || 'Ukjent arrangement'
        })
      )
      setOrphanedEventNames(orphanedNames)

      setOrphanedEventDialogOpen(true)
    } else if (isNewPublish) {
      // If no sync needed, check if we should show artist page dialog
      setArtistPageDialogOpen(true)
    } else {
      onComplete()
    }
  }, [publish, client, id, isNewPublish, onComplete])

  // Step 2: Handle event sync (additions)
  const handleEventSync = useCallback(
    async (shouldSync: boolean) => {
      if (!shouldSync) {
        setEventDialogOpen(false)
        if (orphanedEventRefs.length > 0) {
          setOrphanedEventDialogOpen(true)
        } else if (isNewPublish) {
          setArtistPageDialogOpen(true)
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
          missingEventRefs,
          'artist' // Field name in events to update
        )

        setEventDialogOpen(false)

        if (orphanedEventRefs.length > 0) {
          setOrphanedEventDialogOpen(true)
        } else if (isNewPublish) {
          setArtistPageDialogOpen(true)
        } else {
          onComplete()
        }
      } catch (error) {
        console.error('Error syncing reciprocal references:', error)
        setEventDialogOpen(false)
        if (isNewPublish) {
          setArtistPageDialogOpen(true)
        } else {
          onComplete()
        }
      } finally {
        setIsSyncing(false)
      }
    },
    [client, id, missingEventRefs, orphanedEventRefs, isNewPublish, onComplete]
  )

  // Step 3: Handle orphaned event cleanup (removals)
  const handleOrphanedEventCleanup = useCallback(
    async (shouldCleanup: boolean) => {
      if (!shouldCleanup) {
        setOrphanedEventDialogOpen(false)
        // After declining cleanup, check if we should show artist page dialog
        if (isNewPublish) {
          setArtistPageDialogOpen(true)
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
          orphanedEventRefs,
          'artist' // Field name in events to remove from
        )

        setOrphanedEventDialogOpen(false)

        // After cleanup, check if we should show artist page dialog
        if (isNewPublish) {
          setArtistPageDialogOpen(true)
        } else {
          onComplete()
        }
      } catch (error) {
        console.error('Error removing orphaned references:', error)
        setOrphanedEventDialogOpen(false)
        if (isNewPublish) {
          setArtistPageDialogOpen(true)
        } else {
          onComplete()
        }
      } finally {
        setIsRemoving(false)
      }
    },
    [client, id, orphanedEventRefs, isNewPublish, onComplete]
  )

  // Step 4: Handle artist page addition
  const handleAddToArtistPage = useCallback(
    async (addToPage: boolean) => {
      if (!addToPage) {
        setArtistPageDialogOpen(false)
        onComplete()
        return
      }

      setIsAddingToPage(true)

      try {
        const artistPage = await client.fetch(
          `*[_type == "artistPage"][0]{_id, _rev, selectedArtists}`
        )

        if (!artistPage) {
          console.error('Could not find artistPage')
          setArtistPageDialogOpen(false)
          onComplete()
          return
        }

        const publishedId = id.replace(/^drafts\./, '')
        const existingArtists = artistPage.selectedArtists || []
        const artistRefs = existingArtists.map((ref: any) => ref._ref)

        if (artistRefs.includes(publishedId)) {
          setArtistPageDialogOpen(false)
          onComplete()
          return
        }

        await client
          .patch(artistPage._id)
          .setIfMissing({selectedArtists: []})
          .append('selectedArtists', [
            {
              _type: 'reference',
              _ref: publishedId,
              _key: `artist-${Date.now()}`,
            },
          ])
          .commit()

        setArtistPageDialogOpen(false)
        onComplete()
      } catch (error) {
        console.error('Error adding artist to artist page:', error)
        setArtistPageDialogOpen(false)
        onComplete()
      } finally {
        setIsAddingToPage(false)
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
    dialog: loadingDialogOpen
      ? {
          type: 'dialog',
          header: 'Lagrer artist',
          content: (
            <Stack space={4} padding={4}>
              <Flex justify="center" align="center" direction="column" gap={3} style={{minHeight: '100px'}}>
                <Spinner />
                <Text>Lagrer artist...</Text>
              </Flex>
            </Stack>
          ),
        }
      : eventDialogOpen
      ? {
          type: 'dialog',
          onClose: () => {
            setEventDialogOpen(false)
            if (isNewPublish) {
              setArtistPageDialogOpen(true)
            } else {
              onComplete()
            }
          },
          header: 'Synkroniser arrangementer?',
          content: (
            <Stack space={4} padding={4}>
              <Text>
                {eventCount === 1
                  ? 'Dette arrangementet har ikke denne artisten i sin artistliste:'
                  : `Disse ${eventCount} arrangementene har ikke denne artisten i sine artistlister:`}
              </Text>
              <Stack space={2} paddingLeft={3}>
                {eventNames.map((name, index) => (
                  <Text key={index} size={2}>
                    • {name}
                  </Text>
                ))}
              </Stack>
              <Text>Vil du legge til denne artisten automatisk i {eventCount === 1 ? 'arrangementet' : 'arrangementene'}?</Text>
              <Text size={1} muted>
                Dette sikrer at forholdet mellom artist og arrangement er toveis.
              </Text>
              <Flex gap={3} justify="flex-end">
                <Button
                  text="Nei, ikke synkroniser"
                  mode="ghost"
                  onClick={() => handleEventSync(false)}
                  disabled={isSyncing}
                />
                <Button
                  text="Ja, synkroniser"
                  tone="primary"
                  icon={CheckmarkIcon}
                  onClick={() => handleEventSync(true)}
                  loading={isSyncing}
                />
              </Flex>
            </Stack>
          ),
        }
      : orphanedEventDialogOpen
        ? {
            type: 'dialog',
            onClose: () => {
              setOrphanedEventDialogOpen(false)
              if (isNewPublish) {
                setArtistPageDialogOpen(true)
              } else {
                onComplete()
              }
            },
            header: 'Fjern artisten fra arrangementer?',
            content: (
              <Stack space={4} padding={4}>
                <Text>
                  {orphanedEventCount === 1
                    ? 'Dette arrangementet har fremdeles denne artisten i sin liste, men artisten har ikke lenger arrangementet:'
                    : `Disse ${orphanedEventCount} arrangementene har fremdeles denne artisten i sine lister, men artisten har ikke lenger disse arrangementene:`}
                </Text>
                <Stack space={2} paddingLeft={3}>
                  {orphanedEventNames.map((name, index) => (
                    <Text key={index} size={2}>
                      • {name}
                    </Text>
                  ))}
                </Stack>
                <Text>Vil du fjerne denne artisten automatisk fra {orphanedEventCount === 1 ? 'arrangementet' : 'arrangementene'}?</Text>
                <Text size={1} muted>
                  Dette sikrer at forholdet mellom artist og arrangement forblir toveis.
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Button
                    text="Nei, ikke fjern"
                    mode="ghost"
                    onClick={() => handleOrphanedEventCleanup(false)}
                    disabled={isRemoving}
                  />
                  <Button
                    text="Ja, fjern"
                    tone="primary"
                    icon={CheckmarkIcon}
                    onClick={() => handleOrphanedEventCleanup(true)}
                    loading={isRemoving}
                  />
                </Flex>
              </Stack>
            ),
          }
        : artistPageDialogOpen
        ? {
            type: 'dialog',
            onClose: () => {
              setArtistPageDialogOpen(false)
              onComplete()
            },
            header: 'Legg til på artistoversikten?',
            content: (
              <Stack space={4} padding={4}>
                <Text>Vil du at denne artisten skal vises på artistoversikten?</Text>
                <Text size={1} muted>
                  Du kan også legge det til senere under Artistoversikt → Artister-fanen.
                </Text>
                <Flex gap={3} justify="flex-end">
                  <Button
                    text="Nei, ikke vis på artistoversikten"
                    mode="ghost"
                    onClick={() => handleAddToArtistPage(false)}
                    disabled={isAddingToPage}
                  />
                  <Button
                    text="Ja, vis på artistoversikten"
                    tone="primary"
                    icon={CheckmarkIcon}
                    onClick={() => handleAddToArtistPage(true)}
                    loading={isAddingToPage}
                  />
                </Flex>
              </Stack>
            ),
          }
        : false,
  }
}
