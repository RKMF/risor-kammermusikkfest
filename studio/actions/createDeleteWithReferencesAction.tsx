import {useCallback, useState} from 'react'
import {type DocumentActionComponent, useClient, useDocumentOperation} from 'sanity'
import {TrashIcon} from '@sanity/icons'
import {Button, Flex, Stack, Text} from '@sanity/ui'

export interface ReferenceCleanupConfig {
  // Document type this action applies to
  documentType: string

  // Norwegian singular label for the document type (used in UI)
  labelSingular: string

  // Reference patterns to clean up
  references: Array<{
    // Document type that contains the reference
    referringType: string

    // Field path within the referring document
    fieldPath: string

    // Norwegian label for display (e.g., "oversiktsside", "arrangement")
    displayLabel: string

    // Singular form for count display
    singularForm: string

    // Plural form for count display
    pluralForm: string
  }>
}

interface AffectedReference {
  type: string
  count: number
  displayLabel: string
  singularForm: string
  pluralForm: string
}

export function createDeleteWithReferencesAction(
  config: ReferenceCleanupConfig
): DocumentActionComponent {
  return (props) => {
    const {id, type, onComplete} = props
    const client = useClient({apiVersion: '2025-01-01'})
    const {delete: deleteOp} = useDocumentOperation(id, type)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [affectedReferences, setAffectedReferences] = useState<AffectedReference[]>([])

    // Only show this action for the configured document type
    if (type !== config.documentType) {
      return null
    }

    const handleDelete = useCallback(async () => {
      // Get the published document ID (without drafts. prefix)
      const publishedId = id.replace(/^drafts\./, '')

      // Query all reference types in parallel
      const referenceQueries = config.references.map(async (ref) => {
        const results = await client.fetch(
          `*[_type == $referringType && references($id)]{
            _id,
            "hasReference": count(${ref.fieldPath}[_ref == $id]) > 0
          }`,
          {referringType: ref.referringType, id: publishedId}
        )

        const count = results.filter((r: any) => r.hasReference).length

        return {
          type: ref.referringType,
          count,
          displayLabel: ref.displayLabel,
          singularForm: ref.singularForm,
          pluralForm: ref.pluralForm,
        }
      })

      const results = await Promise.all(referenceQueries)
      setAffectedReferences(results)
      setDialogOpen(true)
    }, [id, client, config.references])

    const confirmDelete = useCallback(async () => {
      setIsDeleting(true)

      try {
        const publishedId = id.replace(/^drafts\./, '')

        // Clean up references from all referring document types
        for (const ref of config.references) {
          const documents = await client.fetch(
            `*[_type == $referringType && references($id)]{
              _id,
              _rev,
              "${ref.fieldPath}": ${ref.fieldPath}
            }`,
            {referringType: ref.referringType, id: publishedId}
          )

          for (const doc of documents) {
            const currentReferences = doc[ref.fieldPath] || []
            const updatedReferences = currentReferences.filter(
              (reference: any) => reference._ref !== publishedId
            )

            await client
              .patch(doc._id)
              .set({[ref.fieldPath]: updatedReferences})
              .commit()
          }
        }

        // Delete both draft and published versions
        const draftId = `drafts.${publishedId}`
        await Promise.all([
          client.delete(publishedId).catch(() => {}), // Ignore if doesn't exist
          client.delete(draftId).catch(() => {}), // Ignore if doesn't exist
        ])

        setDialogOpen(false)
        onComplete()
      } catch (error) {
        console.error(`Error deleting ${config.documentType}:`, error)
        setDialogOpen(false)
        onComplete()
      } finally {
        setIsDeleting(false)
      }
    }, [id, client, config, onComplete])

    return {
      label: 'Slett',
      icon: TrashIcon,
      tone: 'critical',
      disabled: !!deleteOp.disabled,
      onHandle: handleDelete,
      dialog: dialogOpen && {
        type: 'dialog',
        onClose: () => {
          setDialogOpen(false)
          onComplete()
        },
        header: `Slett ${config.labelSingular}`,
        content: (
          <Stack space={4} padding={4}>
            {affectedReferences.some((ref) => ref.count > 0) ? (
              <>
                <Text>
                  {config.labelSingular.charAt(0).toUpperCase() + config.labelSingular.slice(1)}en
                  vil bli fjernet fra:
                </Text>
                <ul style={{margin: 0, paddingLeft: '1.5em'}}>
                  {affectedReferences
                    .filter((ref) => ref.count > 0)
                    .map((ref, i) => (
                      <li key={i}>
                        <Text>
                          {ref.count} {ref.count > 1 ? ref.pluralForm : ref.singularForm}
                        </Text>
                      </li>
                    ))}
                </ul>
                <Text weight="semibold">Vil du fortsette med slettingen?</Text>
              </>
            ) : (
              <Text>
                Er du sikker på at du vil slette {config.labelSingular === 'artist' ? 'denne' : 'dette'}{' '}
                {config.labelSingular}
                {config.labelSingular === 'artist' ? 'en' : 'et'}?
              </Text>
            )}
            <Flex gap={3} justify="flex-end">
              <Button
                text="Avbryt"
                mode="ghost"
                onClick={() => {
                  setDialogOpen(false)
                  onComplete()
                }}
                disabled={isDeleting}
              />
              <Button
                text={`Slett ${config.labelSingular}`}
                tone="critical"
                icon={TrashIcon}
                onClick={confirmDelete}
                loading={isDeleting}
              />
            </Flex>
          </Stack>
        ),
      },
    }
  }
}
