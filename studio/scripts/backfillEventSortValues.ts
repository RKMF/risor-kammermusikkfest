import { getCliClient } from 'sanity/cli';
import {
  collectReferencedEventDateIds,
  getPrimaryEventSortValuesFromReferences,
} from '../lib/eventSortValues';

interface EventDocument {
  _id: string;
  showings?: Array<{ eventDate?: { _ref?: string }; startTime?: string }>;
  occurrences?: Array<{
    eventDate?: { _ref?: string };
    showings?: Array<{ startTime?: string }>;
  }>;
  eventDate?: { _ref?: string };
  eventTime?: { startTime?: string };
  eventDateValue?: string;
  eventStartTimeValue?: string;
}

interface EventDateDocument {
  _id: string;
  date?: string;
}

interface CliOptions {
  dryRun: boolean;
}

function parseCliOptions(argv: string[]): CliOptions {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

async function run() {
  const { dryRun } = parseCliOptions(process.argv.slice(2));
  const client = getCliClient({ apiVersion: '2025-01-01' });
  const events = await client.fetch<EventDocument[]>(
    `*[_type == "event"]{
      _id,
      showings,
      occurrences,
      eventDate,
      eventTime,
      eventDateValue,
      eventStartTimeValue
    }`
  );

  let changed = 0;
  const changedEventIds: string[] = [];

  for (const event of events) {
    const dateIds = collectReferencedEventDateIds(event);
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

    const nextValues = getPrimaryEventSortValuesFromReferences(event, dateByRef);
    const nextDateValue = nextValues.eventDateValue;
    const nextStartTimeValue = nextValues.eventStartTimeValue;

    if (
      nextDateValue === event.eventDateValue &&
      nextStartTimeValue === event.eventStartTimeValue
    ) {
      continue;
    }

    changed += 1;
    changedEventIds.push(event._id);

    if (dryRun) {
      console.log(
        `[dry-run] ${event._id}: ${event.eventDateValue || 'unset'} ${event.eventStartTimeValue || 'unset'} -> ${nextDateValue || 'unset'} ${nextStartTimeValue || 'unset'}`
      );
      continue;
    }

    let patch = client.patch(event._id);

    if (nextDateValue) {
      patch = patch.set({ eventDateValue: nextDateValue });
    } else {
      patch = patch.unset(['eventDateValue']);
    }

    if (typeof nextStartTimeValue === 'string') {
      patch = patch.set({ eventStartTimeValue: nextStartTimeValue });
    } else {
      patch = patch.unset(['eventStartTimeValue']);
    }

    await patch.commit();
    console.log(`Updated ${event._id}`);
  }

  if (dryRun) {
    console.log(
      `Dry run complete. ${changed} of ${events.length} event documents would be updated.`
    );
    if (changedEventIds.length > 0) {
      console.log(`Affected event IDs: ${changedEventIds.join(', ')}`);
    }
    return;
  }

  console.log(`Backfill complete. Updated ${changed} of ${events.length} event documents.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
