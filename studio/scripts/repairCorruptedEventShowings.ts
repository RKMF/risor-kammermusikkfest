import { getCliClient } from 'sanity/cli';

interface CorruptedEventDocument {
  _id: string;
  title_no?: string;
  title_en?: string;
  showings?: unknown;
}

interface CliOptions {
  dryRun: boolean;
  ids?: Set<string>;
}

function parseCliOptions(argv: string[]): CliOptions {
  const dryRun = !argv.includes('--no-dry-run');
  const idsArg = argv.find((arg) => arg.startsWith('--ids='));
  const ids = idsArg
    ? new Set(
        idsArg
          .slice('--ids='.length)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      )
    : undefined;

  return { dryRun, ids };
}

function isCorruptedShowingsValue(value: unknown): boolean {
  return Boolean(
    value &&
      !Array.isArray(value) &&
      typeof value === 'object' &&
      'eventDateValue' in value
  );
}

async function run() {
  const { dryRun, ids } = parseCliOptions(process.argv.slice(2));
  const client = getCliClient({ apiVersion: '2025-01-01' });
  const events = await client.fetch<CorruptedEventDocument[]>(
    `*[
      _type == "event" &&
      defined(showings.eventDateValue)
    ]{
      _id,
      title_no,
      title_en,
      showings
    }`
  );

  const targets = events.filter((event) => {
    if (!isCorruptedShowingsValue(event.showings)) {
      return false;
    }

    if (!ids || ids.size === 0) {
      return true;
    }

    return ids.has(event._id) || (event._id.startsWith('drafts.') && ids.has(event._id.slice(7)));
  });

  if (targets.length === 0) {
    console.log('No matching corrupted event showings found.');
    return;
  }

  for (const event of targets) {
    const title = event.title_no || event.title_en || 'Untitled event';

    if (dryRun) {
      console.log(`[dry-run] Would unset corrupted showings on ${event._id} | ${title}`);
      continue;
    }

    await client.patch(event._id).unset(['showings']).commit();
    console.log(`Unset corrupted showings on ${event._id} | ${title}`);
  }

  if (dryRun) {
    console.log(`Dry run complete. ${targets.length} documents would be updated.`);
  } else {
    console.log(`Repair complete. Updated ${targets.length} documents.`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
