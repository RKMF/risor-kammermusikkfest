import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'

export const addEventToProgramPageAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {publish} = useDocumentOperation(id, type)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddingToProgram, setIsAddingToProgram] = useState(false)

  // Only show this action for event documents
  if (type !== 'event') {
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

  const handleAddToProgram = useCallback(async (addToProgram: boolean) => {
    if (!addToProgram) {
      setDialogOpen(false)
      onComplete()
      return
    }

    setIsAddingToProgram(true)

    try {
      // Get the current programPage document
      const programPage = await client.fetch(
        `*[_type == "programPage"][0]{_id, _rev, selectedEvents}`
      )

      if (!programPage) {
        console.error('Could not find programPage')
        setDialogOpen(false)
        onComplete()
        return
      }

      // Get the published document ID (without drafts. prefix)
      const publishedId = id.replace(/^drafts\./, '')

      // Check if event is already in selectedEvents
      const existingEvents = programPage.selectedEvents || []
      const eventRefs = existingEvents.map((ref: any) => ref._ref)

      if (eventRefs.includes(publishedId)) {
        // Already added, just close dialog
        setDialogOpen(false)
        onComplete()
        return
      }

      // Add event to programPage.selectedEvents
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

      setDialogOpen(false)
      onComplete()
    } catch (error) {
      console.error('Error adding event to program page:', error)
      setDialogOpen(false)
      onComplete()
    } finally {
      setIsAddingToProgram(false)
    }
  }, [id, client, onComplete])

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
    },
  }
}
