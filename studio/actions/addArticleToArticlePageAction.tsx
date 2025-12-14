import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {CheckmarkIcon, PublishIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'

export const addArticleToArticlePageAction: DocumentActionComponent = (props) => {
  const {id, type, draft, published, onComplete} = props
  const client = useClient({apiVersion: '2025-01-01'})
  const {publish} = useDocumentOperation(id, type)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAddingToPage, setIsAddingToPage] = useState(false)

  // Only show this action for article documents
  if (type !== 'article') {
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
        // Get the current articlePage document
        const articlePage = await client.fetch(
          `*[_type == "articlePage"][0]{_id, _rev, selectedArticles}`
        )

        if (!articlePage) {
          console.error('Could not find articlePage')
          setDialogOpen(false)
          onComplete()
          return
        }

        // Get the published document ID (without drafts. prefix)
        const publishedId = id.replace(/^drafts\./, '')

        // Check if article is already in selectedArticles
        const existingArticles = articlePage.selectedArticles || []
        const articleRefs = existingArticles.map((ref: any) => ref._ref)

        if (articleRefs.includes(publishedId)) {
          // Already added, just close dialog
          setDialogOpen(false)
          onComplete()
          return
        }

        // Add article to articlePage.selectedArticles
        await client
          .patch(articlePage._id)
          .setIfMissing({selectedArticles: []})
          .append('selectedArticles', [
            {
              _type: 'reference',
              _ref: publishedId,
              _key: `article-${Date.now()}`,
            },
          ])
          .commit()

        setDialogOpen(false)
        onComplete()
      } catch (error) {
        console.error('Error adding article to article page:', error)
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
      header: 'Legg til på artikkeloversikten?',
      content: (
        <Stack space={4} padding={4}>
          <Text>Vil du at denne artikkelen skal vises på artikkeloversikten?</Text>
          <Text size={1} muted>
            Du kan også legge det til senere under Artikkeloversikt → Artikler-fanen.
          </Text>
          <Flex gap={3} justify="flex-end">
            <Button
              text="Nei, ikke vis på artikkeloversikten"
              mode="ghost"
              onClick={() => handleAddToPage(false)}
              disabled={isAddingToPage}
            />
            <Button
              text="Ja, vis på artikkeloversikten"
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
