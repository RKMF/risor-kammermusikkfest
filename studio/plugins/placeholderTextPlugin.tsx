import React from 'react';
import { Button, Flex, Text } from '@sanity/ui';
import { ComposeIcon } from '@sanity/icons';
import { definePlugin, set } from 'sanity';

const PLACEHOLDER_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames.';

const hasValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value);
};

export const placeholderTextPlugin = definePlugin({
  name: 'placeholder-text-plugin',
  form: {
    components: {
      input(props) {
        const { schemaType, renderDefault, onChange, value } = props;

        const isTextField = schemaType.name === 'text';
        const showButton = isTextField;

        if (!showButton) {
          return renderDefault(props);
        }

        return (
          <div>
            <Flex align="center" justify="space-between" style={{ marginBottom: '0.5rem' }}>
              <Text size={1} muted>
                Sett inn placeholder-tekst
              </Text>
              <Button
                icon={ComposeIcon}
                text="Lorem ipsum"
                mode="ghost"
                tone="primary"
                disabled={hasValue(value)}
                onClick={() => onChange(set(PLACEHOLDER_TEXT))}
              />
            </Flex>
            {renderDefault(props)}
          </div>
        );
      },
    },
  },
});
