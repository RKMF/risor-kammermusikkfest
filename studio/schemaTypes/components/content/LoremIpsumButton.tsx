import { Button, Stack } from '@sanity/ui';
import { TextIcon } from '@sanity/icons';
import { type InputProps, set, unset } from 'sanity';
import { useCallback } from 'react';

// Norwegian lorem ipsum text
const LOREM_IPSUM = [
  {
    _type: 'block',
    _key: 'lorem1',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'lorem1span',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        marks: [],
      },
    ],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'lorem2',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'lorem2span',
        text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        marks: [],
      },
    ],
    markDefs: [],
  },
];

export function LoremIpsumInput(props: InputProps) {
  const { value, onChange, renderDefault } = props;

  const handleInsertLorem = useCallback(() => {
    onChange(set(LOREM_IPSUM));
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  const isEmpty = !value || (Array.isArray(value) && value.length === 0);

  return (
    <Stack space={3}>
      <Stack space={2}>
        <Button
          icon={TextIcon}
          text="Fyll med Lorem Ipsum"
          tone="primary"
          mode="ghost"
          onClick={handleInsertLorem}
          style={{ width: 'fit-content' }}
        />
        {!isEmpty && (
          <Button
            text="Tøm innhold"
            tone="critical"
            mode="ghost"
            onClick={handleClear}
            style={{ width: 'fit-content' }}
          />
        )}
      </Stack>
      {renderDefault(props)}
    </Stack>
  );
}
