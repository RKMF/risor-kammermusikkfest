import React, { useEffect, useState, useCallback } from 'react';
import { StringInputProps, useClient, useFormValue } from 'sanity';
import { Stack, Card, Text, Flex, Box, Spinner } from '@sanity/ui';
import { WarningOutlineIcon } from '@sanity/icons';

interface ReferencingDocument {
  _id: string;
  _type: string;
  title?: string;
  title_no?: string;
  title_en?: string;
  name?: string;
}

// Map document types to Norwegian display names
const typeDisplayNames: Record<string, string> = {
  artist: 'Artist',
  event: 'Arrangement',
  article: 'Artikkel',
  artistPage: 'Artistoversikt',
  programPage: 'Programside',
  articlePage: 'Artikkelside',
  homepage: 'Forside',
  page: 'Side',
};

/**
 * Custom input component for publishingStatus field
 * Shows a warning when user selects 'draft' (hide content)
 * listing where the content is referenced
 */
export function PublishingStatusInput(props: StringInputProps) {
  const { value, onChange, schemaType } = props;
  const [references, setReferences] = useState<ReferencingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const client = useClient({ apiVersion: '2025-01-01' });

  // Get the document ID using useFormValue
  const documentId = useFormValue(['_id']) as string | undefined;
  // Remove 'drafts.' prefix if present to get the published ID
  const publishedId = documentId?.replace(/^drafts\./, '') || '';

  // Query for documents that reference this document
  const queryReferences = useCallback(async () => {
    if (!publishedId) {
      console.log('[PublishingStatusInput] No publishedId, skipping query');
      return;
    }

    console.log('[PublishingStatusInput] Querying references for:', publishedId);
    setLoading(true);
    try {
      // Query for all documents that reference this document
      const results = await client.fetch<ReferencingDocument[]>(
        `*[references($id) && !(_id in path('drafts.**'))]{
          _id,
          _type,
          title,
          title_no,
          title_en,
          name
        }`,
        { id: publishedId }
      );
      console.log('[PublishingStatusInput] Found references:', results);
      setReferences(results);
      setHasQueried(true);
    } catch (error) {
      console.error('[PublishingStatusInput] Error querying references:', error);
    } finally {
      setLoading(false);
    }
  }, [client, publishedId]);

  // Query references when value changes to 'draft'
  useEffect(() => {
    if (value === 'draft' && !hasQueried) {
      queryReferences();
    }
  }, [value, hasQueried, queryReferences]);

  // Reset query state when value changes away from 'draft'
  useEffect(() => {
    if (value !== 'draft') {
      setHasQueried(false);
    }
  }, [value]);

  // Get display title for a referencing document
  const getDisplayTitle = (doc: ReferencingDocument): string => {
    return doc.title_no || doc.title || doc.title_en || doc.name || 'Uten tittel';
  };

  // Get display type name
  const getTypeName = (type: string): string => {
    return typeDisplayNames[type] || type;
  };

  // Group references by type for better display
  const groupedReferences = references.reduce(
    (acc, doc) => {
      const type = doc._type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, ReferencingDocument[]>
  );

  return (
    <Stack space={3}>
      {/* Render the default radio button input */}
      {props.renderDefault(props)}

      {/* Show loading spinner while checking references */}
      {value === 'draft' && loading && (
        <Card padding={3} radius={2} tone="default" border>
          <Flex align="center" gap={2}>
            <Spinner muted />
            <Text size={1} muted>
              Sjekker referanser...
            </Text>
          </Flex>
        </Card>
      )}

      {/* Show warning ONLY when 'draft' is selected AND there are references */}
      {value === 'draft' && !loading && references.length > 0 && (
        <Card padding={4} radius={2} tone="caution" border>
          <Stack space={4}>
            <Flex align="flex-start" gap={3}>
              <Box style={{ flexShrink: 0, marginTop: '2px' }}>
                <Text size={2}>
                  <WarningOutlineIcon />
                </Text>
              </Box>
              <Stack space={4}>
                <Text size={2} weight="semibold">
                  NB: Dette innholdet er referert andre steder
                </Text>

                <Text size={2}>
                  Når du skjuler dette innholdet, vil det automatisk forsvinne fra:
                </Text>

                <Stack space={3}>
                  {Object.entries(groupedReferences).map(([type, docs]) => (
                    <Box key={type}>
                      <Text size={2} weight="semibold">
                        {getTypeName(type)}
                      </Text>
                      <Stack space={2} marginTop={2} marginLeft={3}>
                        {docs.map((doc) => (
                          <Text key={doc._id} size={2}>
                            • {getDisplayTitle(doc)}
                          </Text>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>

                <Text size={2} muted>
                  Innholdet vil vises igjen automatisk når du endrer status tilbake til "Synlig på
                  nett".
                </Text>
              </Stack>
            </Flex>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
