import {getCliClient} from 'sanity/cli'

/**
 * One-time migration script to populate eventDateValue for existing events
 * Run with: npx sanity exec scripts/migrateEventDateValue.ts --with-user-token
 */
async function migrateEventDateValue() {
  const client = getCliClient()

  console.log('Starting migration of eventDateValue field...')

  // Fetch all events with their referenced date
  const events = await client.fetch<Array<{
    _id: string
    eventDate: {_ref: string}
    date?: string
  }>>(`
    *[_type == "event" && defined(eventDate)] {
      _id,
      eventDate,
      "date": eventDate->date
    }
  `)

  console.log(`Found ${events.length} events to migrate`)

  if (events.length === 0) {
    console.log('No events to migrate')
    return
  }

  // Create transaction to update all events
  let transaction = client.transaction()
  let count = 0
  let skipped = 0

  for (const event of events) {
    if (!event.date) {
      console.log(`Skipping ${event._id} - missing date`)
      skipped++
      continue
    }

    transaction = transaction.patch(event._id, {
      set: {eventDateValue: event.date}
    })

    count++

    // Commit in batches of 100
    if (count % 100 === 0) {
      await transaction.commit()
      console.log(`Migrated ${count} events...`)
      transaction = client.transaction()
    }
  }

  // Commit remaining
  if (count % 100 !== 0) {
    await transaction.commit()
  }

  console.log(`✓ Successfully migrated ${count} events`)
  if (skipped > 0) {
    console.log(`⚠ Skipped ${skipped} events without dates`)
  }
}

migrateEventDateValue().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
