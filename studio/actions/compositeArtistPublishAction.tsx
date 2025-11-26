import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {PublishIcon, CheckmarkIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {
  findMissingReciprocalReferences,
  syncReciprocalReferences,
} from '../utils/bidirectionalSync'

/**
 * Composite publish action for artists that:
 * 1. Checks for missing reciprocal event references (before publishing)
 * 2. Publishes the document
 * 3. Shows event sync dialog if needed (adds artist to events)
 * 4. Shows artist page dialog for new publishes (adds artist to artist listing)
 */
export const compositeArtistPublishAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {publish} = useDocumentOperation(id, type)

  // Dialog states
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [artistPageDialogOpen, setArtistPageDialogOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAddingToPage, setIsAddingToPage] = useState(false)

  // Event sync state
  const [missingEventRefs, setMissingEventRefs] = useState<string[]>([])
  const [eventCount, setEventCount] = useState(0)

  // Only apply to artist documents
  if (type !== 'artist') {
    return null
  }

  const isNewPublish = draft && !published

  // Step 1: Check for missing event references, then publish
  const handlePublish = useCallback(async () => {
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

    // Show event sync dialog if needed (based on what we found before publishing)
    if (missing.length > 0) {
      setMissingEventRefs(missing)
      setEventCount(missing.length)
      setEventDialogOpen(true)
    } else if (isNewPublish) {
      // If no event sync needed, check if we should show artist page dialog
      setArtistPageDialogOpen(true)
    } else {
      onComplete()
    }
  }, [publish, client, id, isNewPublish, onComplete])

  // Step 2: Handle event sync
  const handleEventSync = useCallback(
    async (shouldSync: boolean) => {
      if (!shouldSync) {
        setEventDialogOpen(false)
        // After event dialog, check if we should show artist page dialog
        if (isNewPublish) {
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

        // After syncing, check if we should show artist page dialog
        if (isNewPublish) {
          setArtistPageDialogOpen(true)
        } else {
          onComplete()
        }
      } catch (error) {
        console.error('Error syncing reciprocal references:', error)
        setEventDialogOpen(false)
        onComplete()
      } finally {
        setIsSyncing(false)
      }
    },
    [client, id, missingEventRefs, isNewPublish, onComplete]
  )

  // Step 3: Handle artist page addition
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
    dialog: eventDialogOpen
      ? {
          type: 'dialog',
          onClose: () => {
            setEventDialogOpen(false)
            onComplete()
          },
          header: 'Synkroniser arrangementer?',
          content: (
            <Stack space={4} padding={4}>
              <Text>
                {eventCount === 1
                  ? 'Det er 1 arrangement som ikke har denne artisten i sin artistliste.'
                  : `Det er ${eventCount} arrangementer som ikke har denne artisten i sine artistlister.`}
              </Text>
              <Text>Vil du legge til denne artisten automatisk i arrangementene?</Text>
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
