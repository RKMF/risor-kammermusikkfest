import { getCliClient } from 'sanity/cli';

interface CorruptedEventDocument {
  _id: string;
  title_no?: string;
  title_en?: string;
  showings?: {
    _type?: string;
    eventDateValue?: string;
    eventStartTimeValue?: string;
  };
}

async function run() {
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

  if (events.length === 0) {
    console.log('No corrupted event showings found.');
    return;
  }

  console.log(`Found ${events.length} event documents with corrupted showings data:`);

  for (const event of events) {
    const title = event.title_no || event.title_en || 'Untitled event';
    const start = event.showings?.eventStartTimeValue || 'unset';
    const date = event.showings?.eventDateValue || 'unset';
    console.log(`- ${event._id} | ${title} | showings.eventDateValue=${date} | showings.eventStartTimeValue=${start}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
