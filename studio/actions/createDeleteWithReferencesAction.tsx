import { useCallback, useState } from 'react';
import { type DocumentActionComponent, useClient, useDocumentOperation } from 'sanity';
import { TrashIcon } from '@sanity/icons';
import { Button, Flex, Stack, Text } from '@sanity/ui';

export interface ReferenceCleanupConfig {
  // Document type this action applies to
  documentType: string;

  // Norwegian singular label for the document type (used in UI)
  labelSingular: string;
}

interface BlockingReferenceDocument {
  _id: string;
  _type: string;
  adminTitle?: string;
  title?: string;
  title_no?: string;
  title_en?: string;
  name?: string;
  publishingStatus?: string;
}

function isNotFoundDeleteError(error: unknown): boolean {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';

  return statusCode === 404 || /not found/i.test(message);
}

async function deleteDocumentIfExists(client: ReturnType<typeof useClient>, documentId: string) {
  try {
    await client.delete(documentId);
  } catch (error) {
    if (isNotFoundDeleteError(error)) {
      return;
    }

    throw error;
  }
}

export function createDeleteWithReferencesAction(
  config: ReferenceCleanupConfig
): DocumentActionComponent {
  return (props) => {
    const { id, type, onComplete } = props;
    const client = useClient({ apiVersion: '2025-01-01' });
    const { delete: deleteOp } = useDocumentOperation(id, type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [blockingReferences, setBlockingReferences] = useState<BlockingReferenceDocument[]>([]);

    // Only show this action for the configured document type
    if (type !== config.documentType) {
      return null;
    }

    const handleDelete = useCallback(async () => {
      // Get the published document ID (without drafts. prefix)
      const publishedId = id.replace(/^drafts\./, '');
      const draftId = `drafts.${publishedId}`;

      const allReferences = await client.fetch<BlockingReferenceDocument[]>(
        `*[
          references($id) &&
          !(_id in [$publishedId, $draftId])
        ] | order(_type asc, coalesce(adminTitle, title_no, title_en, title, name, _id) asc) {
          _id,
          _type,
          adminTitle,
          title,
          title_no,
          title_en,
          name,
          publishingStatus
        }`,
        { id: publishedId, publishedId, draftId }
      );

      setBlockingReferences(allReferences);
      setDialogOpen(true);
    }, [id, client]);

    const confirmDelete = useCallback(async () => {
      setIsDeleting(true);

      try {
        const publishedId = id.replace(/^drafts\./, '');
        const draftId = `drafts.${publishedId}`;
        await Promise.all([
          deleteDocumentIfExists(client, publishedId),
          deleteDocumentIfExists(client, draftId),
        ]);

        setDialogOpen(false);
        onComplete();
      } catch (error) {
        console.error(`Error deleting ${config.documentType}:`, error);
        setDialogOpen(false);
        onComplete();
      } finally {
        setIsDeleting(false);
      }
    }, [id, client, config.documentType, onComplete]);

    return {
      label: 'Slett',
      icon: TrashIcon,
      tone: 'critical',
      disabled: !!deleteOp.disabled,
      onHandle: handleDelete,
      dialog: dialogOpen && {
        type: 'dialog',
        onClose: () => {
          setDialogOpen(false);
          onComplete();
        },
        header: `Slett ${config.labelSingular}`,
        content: (
          <Stack space={4} padding={4}>
            {blockingReferences.length > 0 ? (
              <>
                <Text>
                  Dette {config.labelSingular}et kan ikke slettes før referansene under er fjernet:
                </Text>
                <ul style={{ margin: 0, paddingLeft: '1.5em' }}>
                  {blockingReferences.map((ref, i) => {
                    const label =
                      ref.adminTitle ||
                      ref.title_no ||
                      ref.title_en ||
                      ref.title ||
                      ref.name ||
                      ref._id;

                    return (
                      <li key={i}>
                        <Text>
                          {label} ({ref._type})
                        </Text>
                      </li>
                    );
                  })}
                </ul>
                <Text muted size={1}>
                  Fjern referansene først, og prøv deretter å slette på nytt.
                </Text>
              </>
            ) : (
              <Text>
                Er du sikker på at du vil slette{' '}
                {config.labelSingular === 'artist' ? 'denne' : 'dette'} {config.labelSingular}
                {config.labelSingular === 'artist' ? 'en' : 'et'}?
              </Text>
            )}
            <Flex gap={3} justify="flex-end">
              <Button
                text={blockingReferences.length > 0 ? 'Lukk' : 'Avbryt'}
                mode="ghost"
                onClick={() => {
                  setDialogOpen(false);
                  onComplete();
                }}
                disabled={isDeleting}
              />
              {blockingReferences.length === 0 && (
                <Button
                  text={`Slett ${config.labelSingular}`}
                  tone="critical"
                  icon={TrashIcon}
                  onClick={confirmDelete}
                  loading={isDeleting}
                />
              )}
            </Flex>
          </Stack>
        ),
      },
    };
  };
}
