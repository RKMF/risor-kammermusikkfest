import { useCallback, useState } from 'react';
import { type DocumentActionComponent, useClient, useDocumentOperation } from 'sanity';
import { CheckmarkIcon, PublishIcon } from '@sanity/icons';
import { Button, Flex, Stack, Text } from '@sanity/ui';
import {
  findMissingReciprocalReferences,
  syncReciprocalReferences,
} from '../utils/bidirectionalSync';

export const syncEventArtistsAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion: '2025-01-01' });
  const { publish } = useDocumentOperation(id, type);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [missingReferences, setMissingReferences] = useState<string[]>([]);
  const [artistCount, setArtistCount] = useState(0);

  // Only show this action for event documents
  if (type !== 'event') {
    return null;
  }

  const handlePublish = useCallback(async () => {
    // Publish the document and wait for it to complete
    await publish.execute();

    // Check for missing reciprocal references
    try {
      const missing = await findMissingReciprocalReferences(
        client,
        id,
        'artist', // Event's field containing artist references
        'artist', // Target document type
        'events' // Field in artists that should reference back to this event
      );

      if (missing.length > 0) {
        setMissingReferences(missing);
        setArtistCount(missing.length);
        setDialogOpen(true);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error checking reciprocal references:', error);
      onComplete();
    }
  }, [draft, published, publish, onComplete, client, id]);

  const handleSync = useCallback(
    async (shouldSync: boolean) => {
      if (!shouldSync) {
        setDialogOpen(false);
        onComplete();
        return;
      }

      setIsSyncing(true);

      try {
        await syncReciprocalReferences(
          client,
          id,
          missingReferences,
          'events' // Field name in artists to update
        );

        setDialogOpen(false);
        onComplete();
      } catch (error) {
        console.error('Error syncing reciprocal references:', error);
        setDialogOpen(false);
        onComplete();
      } finally {
        setIsSyncing(false);
      }
    },
    [client, id, missingReferences, onComplete]
  );

  return {
    label: 'Lagre',
    icon: PublishIcon,
    disabled: !!publish.disabled,
    title: publish.disabled ? 'Ingen endringer å lagre' : undefined,
    onHandle: handlePublish,
    dialog: dialogOpen && {
      type: 'dialog',
      onClose: () => {
        setDialogOpen(false);
        onComplete();
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
              onClick={() => handleSync(false)}
              disabled={isSyncing}
            />
            <Button
              text="Ja, synkroniser"
              tone="primary"
              icon={CheckmarkIcon}
              onClick={() => handleSync(true)}
              loading={isSyncing}
            />
          </Flex>
        </Stack>
      ),
    },
  };
};
