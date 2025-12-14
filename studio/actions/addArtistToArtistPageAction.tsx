import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'

export const addArtistToArtistPageAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {publish} = useDocumentOperation(id, type)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddingToPage, setIsAddingToPage] = useState(false)

  // Only show this action for artist documents
  if (type !== 'artist') {
    return null
  }

  const handlePublish = useCallback(async () => {
    // Check if this is a new publish (not just an update)
    const isNewPublish = draft && !published

    // Publish the document and wait for it to complete
    await publish.execute()

    // If this is a new publish, show dialog
    if (isNewPublish) {
      setDialogOpen(true)
    } else {
      onComplete()
    }
  }, [draft, published, publish, onComplete])

  const handleAddToPage = useCallback(
    async (addToPage: boolean) => {
      if (!addToPage) {
        setDialogOpen(false)
        onComplete()
        return
      }

      setIsAddingToPage(true)

      try {
        // Get the current artistPage document
        const artistPage = await client.fetch(
          `*[_type == "artistPage"][0]{_id, _rev, selectedArtists}`
        )

        if (!artistPage) {
          console.error('Could not find artistPage')
          setDialogOpen(false)
          onComplete()
          return
        }

        // Get the published document ID (without drafts. prefix)
        const publishedId = id.replace(/^drafts\./, '')

        // Check if artist is already in selectedArtists
        const existingArtists = artistPage.selectedArtists || []
        const artistRefs = existingArtists.map((ref: any) => ref._ref)

        if (artistRefs.includes(publishedId)) {
          // Already added, just close dialog
          setDialogOpen(false)
          onComplete()
          return
        }

        // Add artist to artistPage.selectedArtists
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

        setDialogOpen(false)
        onComplete()
      } catch (error) {
        console.error('Error adding artist to artist page:', error)
        setDialogOpen(false)
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
    disabled: !!publish.disabled,
    title: publish.disabled ? 'Ingen endringer å lagre' : undefined,
    onHandle: handlePublish,
    dialog: dialogOpen && {
      type: 'dialog',
      onClose: () => {
        setDialogOpen(false)
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
              onClick={() => handleAddToPage(false)}
              disabled={isAddingToPage}
            />
            <Button
              text="Ja, vis på artistoversikten"
              tone="primary"
              icon={CheckmarkIcon}
              onClick={() => handleAddToPage(true)}
              loading={isAddingToPage}
            />
          </Flex>
        </Stack>
      ),
    },
  }
}
