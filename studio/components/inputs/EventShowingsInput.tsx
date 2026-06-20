import React, { useEffect } from 'react';
import { ArrayOfObjectsInputProps, PatchEvent, set, unset, useClient, useFormValue } from 'sanity';
import {
  collectReferencedEventDateIds,
  getPrimaryEventSortValuesFromReferences,
} from '../../lib/eventSortValues';

interface EventDateDocument {
  _id: string;
  date?: string;
}

export function EventShowingsInput(props: ArrayOfObjectsInputProps) {
  const { onChange, renderDefault } = props;
  const client = useClient({ apiVersion: '2025-01-01' });

  const showings = useFormValue(['showings']) as Array<{ eventDate?: { _ref?: string }; startTime?: string }> | undefined;
  const occurrences = useFormValue(['occurrences']) as Array<{
    eventDate?: { _ref?: string };
    showings?: Array<{ startTime?: string }>;
  }> | undefined;
  const eventDate = useFormValue(['eventDate']) as { _ref?: string } | undefined;
  const eventTime = useFormValue(['eventTime']) as { startTime?: string } | undefined;
  const eventDateValue = useFormValue(['eventDateValue']) as string | undefined;
  const eventStartTimeValue = useFormValue(['eventStartTimeValue']) as string | undefined;

  useEffect(() => {
    let cancelled = false;

    async function syncSortValues() {
      try {
        const dateIds = collectReferencedEventDateIds({ showings, occurrences, eventDate });
        const dateByRef = new Map<string, string>();

        if (dateIds.length > 0) {
          const eventDates = await client.fetch<EventDateDocument[]>(
            `*[_id in $ids]{_id, date}`,
            { ids: dateIds }
          );

          for (const item of eventDates) {
            if (item?._id && item.date) {
              dateByRef.set(item._id, item.date);
            }
          }
        }

        if (cancelled) {
          return;
        }

        const nextValues = getPrimaryEventSortValuesFromReferences(
          { showings, occurrences, eventDate, eventTime },
          dateByRef
        );

        const nextDateValue = nextValues.eventDateValue;
        const nextStartTimeValue = nextValues.eventStartTimeValue;

        if (
          nextDateValue === eventDateValue &&
          nextStartTimeValue === eventStartTimeValue
        ) {
          return;
        }

        const patches = [
          nextDateValue ? set(nextDateValue, ['eventDateValue']) : unset(['eventDateValue']),
          typeof nextStartTimeValue === 'string'
            ? set(nextStartTimeValue, ['eventStartTimeValue'])
            : unset(['eventStartTimeValue']),
        ];

        onChange(PatchEvent.from(patches));
      } catch (error) {
        console.error('Failed to sync event sort values while editing:', error);
      }
    }

    void syncSortValues();

    return () => {
      cancelled = true;
    };
  }, [
    client,
    eventDate,
    eventDateValue,
    eventStartTimeValue,
    eventTime,
    occurrences,
    onChange,
    showings,
  ]);

  return renderDefault(props);
}
