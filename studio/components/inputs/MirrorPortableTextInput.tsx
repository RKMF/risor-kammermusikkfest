import React, { useCallback, useMemo } from 'react';
import { ArrayInputProps, useFormValue, PatchEvent, set } from 'sanity';
import { Stack, Text, Button, Flex, Card } from '@sanity/ui';

export function createMirrorPortableTextInput(sourceField: string) {
  return function MirrorPortableTextInput(props: ArrayInputProps) {
    const { onChange, value, renderDefault } = props;
    const sourceValue = useFormValue([sourceField]) as any[];

    const isEmpty = !value || value.length === 0;
    const hasSource = sourceValue && sourceValue.length > 0;
    const isUsingMirror = isEmpty && hasSource;
    const canCopy = hasSource; // Always show copy button if source has content

    const handleCopyFromSource = useCallback(() => {
      if (hasSource) {
        // Deep clone the source content to avoid reference issues
        const clonedContent = JSON.parse(JSON.stringify(sourceValue));
        // Use PatchEvent with proper set operation
        onChange(PatchEvent.from([set(clonedContent)]));
      }
    }, [sourceValue, onChange, hasSource]);

    // Show copy button if source has content
    const copyButton = useMemo(() => {
      if (!canCopy) return null;

      return (
        <Card
          padding={3}
          radius={2}
          tone={isEmpty ? 'primary' : 'default'}
          border
          style={{ marginBottom: '12px' }}
        >
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1} muted style={{ flex: 1 }}>
              {isEmpty ? (
                <>
                  Tips: <strong>Norsk innhold tilgjengelig</strong>
                </>
              ) : (
                <>
                  Kopier: <strong>Hent innhold fra norsk versjon</strong>
                </>
              )}
            </Text>
            <Button
              mode="bleed"
              tone="primary"
              fontSize={1}
              padding={2}
              onClick={handleCopyFromSource}
              text={isEmpty ? 'Kopier' : 'Hent innhold'}
            />
          </Flex>
        </Card>
      );
    }, [canCopy, isEmpty, handleCopyFromSource]);

    return (
      <Stack space={3}>
        {copyButton}
        {renderDefault(props)}
      </Stack>
    );
  };
}
