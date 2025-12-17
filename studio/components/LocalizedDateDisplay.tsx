import React from 'react';
import { Card, Text } from '@sanity/ui';
import { useFormValue } from 'sanity';

// Norsk: "Tirsdag 23. juni"
function formatNo(dateStr: string) {
  const d = new Date(dateStr); // Sanity date = "YYYY-MM-DD" → tolkes i lokal tid
  const formatted = new Intl.DateTimeFormat('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
  // Kapitalisér første bokstav
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Engelsk: "Tuesday 23 June" (uten ordinal for enkelhet)
function formatEn(dateStr: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function DateNoDisplayInput() {
  const date = useFormValue(['date']) as string | undefined;
  const text = date ? formatNo(date) : 'Velg en dato først';
  return (
    <Card padding={3} radius={2} shadow={1}>
      <Text size={2}>{text}</Text>
    </Card>
  );
}

export function DateEnDisplayInput() {
  const date = useFormValue(['date']) as string | undefined;
  const text = date ? formatEn(date) : 'Select a date first';
  return (
    <Card padding={3} radius={2} shadow={1}>
      <Text size={2}>{text}</Text>
    </Card>
  );
}
