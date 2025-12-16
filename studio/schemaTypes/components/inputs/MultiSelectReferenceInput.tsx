import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrayOfObjectsInputProps, set, unset, useClient } from 'sanity';
import {
  Stack,
  Card,
  Checkbox,
  Flex,
  Box,
  Text,
  TextInput,
  Spinner,
  Dialog,
  Button,
} from '@sanity/ui';
import { SearchIcon, AddIcon } from '@sanity/icons';

interface ReferenceItem {
  _id: string;
  _type: string;
  title?: string;
  title_no?: string;
  title_en?: string;
  name?: string;
  [key: string]: any;
}

interface Reference {
  _type: 'reference';
  _key: string;
  _ref: string;
}

export function MultiSelectReferenceInput(props: ArrayOfObjectsInputProps) {
  const { value = [], onChange, schemaType } = props;
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const client = useClient({ apiVersion: '2025-01-01' });

  // Extract the reference type from schema
  const referenceType = schemaType.of?.[0]?.to?.[0]?.name;

  // Get button text based on reference type
  const getButtonText = useCallback(() => {
    switch (referenceType) {
      case 'artist':
        return 'Velg flere artister';
      case 'event':
        return 'Velg flere arrangementer';
      case 'composer':
        return 'Velg flere komponister';
      case 'article':
        return 'Velg flere artikler';
      default:
        return 'Velg flere elementer';
    }
  }, [referenceType]);

  useEffect(() => {
    if (!referenceType) {
      setLoading(false);
      return;
    }

    // Fetch all available documents of the reference type
    client
      .fetch<ReferenceItem[]>(
        `*[_type == $type && !(_id in path('drafts.**'))] | order(coalesce(title, title_no, name) asc) {
          _id,
          _type,
          title,
          title_no,
          title_en,
          name
        }`,
        { type: referenceType }
      )
      .then((fetchedItems) => {
        setItems(fetchedItems);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching references:', error);
        setLoading(false);
      });
  }, [referenceType, client]);

  // Get display title for an item
  const getDisplayTitle = useCallback((item: ReferenceItem): string => {
    return item.title_no || item.title || item.title_en || item.name || 'Uten tittel';
  }, []);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const title = getDisplayTitle(item).toLowerCase();
      return title.includes(query);
    });
  }, [items, searchQuery, getDisplayTitle]);

  // Track currently selected IDs in the array
  const currentlySelectedIds = useMemo(() => {
    return new Set((value || []).map((ref: Reference) => ref._ref));
  }, [value]);

  // Open dialog and initialize selection state
  const handleOpenDialog = useCallback(() => {
    setSelectedItems(new Set(currentlySelectedIds));
    setSearchQuery('');
    setDialogOpen(true);
  }, [currentlySelectedIds]);

  // Close dialog without saving
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedItems(new Set());
  }, []);

  // Toggle item selection in the dialog
  const handleToggleItem = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  // Save selected items and close dialog
  const handleSaveSelection = useCallback(() => {
    // Build new array of references
    const newReferences: Reference[] = Array.from(selectedItems).map((itemId) => ({
      _type: 'reference',
      _key: `${itemId}-${Date.now()}`, // Unique key
      _ref: itemId,
    }));

    // Update the field value
    if (newReferences.length > 0) {
      onChange(set(newReferences));
    } else {
      onChange(unset());
    }

    setDialogOpen(false);
    setSelectedItems(new Set());
  }, [selectedItems, onChange]);

  if (loading) {
    return (
      <Card padding={4} border radius={2}>
        <Flex align="center" justify="center" padding={4}>
          <Spinner />
          <Box marginLeft={3}>
            <Text muted>Laster...</Text>
          </Box>
        </Flex>
      </Card>
    );
  }

  if (!referenceType) {
    return (
      <Card padding={4} border radius={2} tone="critical">
        <Text>Feil: Kunne ikke finne referansetype i skjema</Text>
      </Card>
    );
  }

  return (
    <>
      {/* Render the default array input UI (shows selected items as chips) */}
      <Stack space={3}>
        {props.renderDefault(props)}

        {/* Custom "Add multiple" button */}
        <Card padding={3} borderTop>
          <Button
            icon={AddIcon}
            text={getButtonText()}
            mode="ghost"
            onClick={handleOpenDialog}
            tone="primary"
          />
        </Card>
      </Stack>

      {/* Modal dialog for multi-select */}
      {dialogOpen && (
        <Dialog
          id="multi-select-dialog"
          header="Velg elementer"
          width={1}
          onClose={handleCloseDialog}
          onClickOutside={handleCloseDialog}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button text="Avbryt" mode="ghost" onClick={handleCloseDialog} />
                <Button
                  text={`Legg til ${selectedItems.size} valgte`}
                  tone="primary"
                  onClick={handleSaveSelection}
                  disabled={selectedItems.size === 0}
                />
              </Flex>
            </Box>
          }
        >
          <Card padding={4}>
            <Stack space={4}>
              {/* Search input */}
              <TextInput
                icon={SearchIcon}
                placeholder="Søk..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
              />

              {/* Checkbox list */}
              <Card border padding={4} radius={2} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Stack space={3}>
                  {filteredItems.length === 0 ? (
                    <Text muted>
                      {searchQuery ? 'Ingen resultater funnet' : 'Ingen elementer tilgjengelig'}
                    </Text>
                  ) : (
                    filteredItems.map((item) => (
                      <Flex key={item._id} align="center">
                        <Checkbox
                          checked={selectedItems.has(item._id)}
                          onChange={(event) =>
                            handleToggleItem(item._id, event.currentTarget.checked)
                          }
                        />
                        <Box marginLeft={3}>
                          <Text>{getDisplayTitle(item)}</Text>
                        </Box>
                      </Flex>
                    ))
                  )}
                </Stack>
              </Card>

              {/* Selection counter */}
              <Card padding={3} tone="primary" radius={2}>
                <Text size={1} muted>
                  {selectedItems.size} valgt av {items.length}
                </Text>
              </Card>
            </Stack>
          </Card>
        </Dialog>
      )}
    </>
  );
}
