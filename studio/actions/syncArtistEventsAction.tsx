import { useCallback, useState } from 'react';
import { type DocumentActionComponent, useClient, useDocumentOperation } from 'sanity';
import { CheckmarkIcon, PublishIcon } from '@sanity/icons';
import { Button, Flex, Stack, Text } from '@sanity/ui';
import {
  findMissingReciprocalReferences,
  syncReciprocalReferences,
} from '../utils/bidirectionalSync';

export const syncArtistEventsAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion: '2025-01-01' });
  const { publish } = useDocumentOperation(id, type);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [missingReferences, setMissingReferences] = useState<string[]>([]);
  const [eventCount, setEventCount] = useState(0);

  // Only show this action for artist documents
  if (type !== 'artist') {
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
        'events', // Artist's field containing event references
        'event', // Target document type
        'artist' // Field in events that should reference back to this artist
      );

      if (missing.length > 0) {
        setMissingReferences(missing);
        setEventCount(missing.length);
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
          'artist' // Field name in events to update
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
