import {getCliClient} from 'sanity/cli'

const client = getCliClient()

/**
 * Migration script to fix corrupted artist/event references
 *
 * HISTORICAL NOTE (2025-01-26):
 * This script was created to fix what appeared to be corrupted reference data in the database.
 * However, it turned out the issue was NOT in the database, but in the GROQ query that was
 * fetching the data.
 *
 * The bug was in bidirectionalSync.ts where the query used:
 *   "${targetFieldName}": ${targetFieldName}[]._ref
 * This extracted only the _ref values, converting proper objects to plain strings.
 *
 * Fixed by changing to:
 *   "${targetFieldName}": ${targetFieldName}[]
 * Which returns the full reference objects with _ref, _key, and _type.
 *
 * This script is kept for historical reference and in case actual data corruption occurs
 * in the future.
 */
async function fixCorruptedReferences() {
  console.log('🔍 Starting migration: Fix Corrupted Artist/Event References\n')

  let totalFixed = 0

  // ===== FIX EVENT ARTIST REFERENCES =====
  console.log('📋 Step 1: Searching for corrupted event artist references...')

  const events = await client.fetch(`
    *[_type == "event" && defined(artist) && count(artist) > 0]{
      _id,
      title,
      artist
    }
  `)

  console.log(`   Found ${events.length} events with artist references\n`)

  for (const event of events) {
    // Check if first item is a plain string (indicates corruption)
    if (event.artist && event.artist.length > 0 && typeof event.artist[0] === 'string') {
      console.log(`   ⚠️  CORRUPTED: "${event.title}" (${event._id})`)
      console.log(`       Current format:`, event.artist)

      // Convert plain strings to proper reference objects
      const fixedRefs = event.artist.map((id: string, index: number) => ({
        _type: 'reference',
        _ref: id,
        _key: `artist-${Date.now()}-${index}`,
      }))

      console.log(`       Fixed format:`, fixedRefs)

      try {
        await client.patch(event._id).set({artist: fixedRefs}).commit()
        console.log(`       ✅ Successfully fixed!\n`)
        totalFixed++
      } catch (error) {
        console.error(`       ❌ Error fixing event ${event._id}:`, error)
      }
    }
  }

  // ===== FIX ARTIST EVENT REFERENCES =====
  console.log('\n📋 Step 2: Searching for corrupted artist event references...')

  const artists = await client.fetch(`
    *[_type == "artist" && defined(events) && count(events) > 0]{
      _id,
      name,
      events
    }
  `)

  console.log(`   Found ${artists.length} artists with event references\n`)

  for (const artist of artists) {
    // Check if first item is a plain string (indicates corruption)
    if (artist.events && artist.events.length > 0 && typeof artist.events[0] === 'string') {
      console.log(`   ⚠️  CORRUPTED: "${artist.name}" (${artist._id})`)
      console.log(`       Current format:`, artist.events)

      // Convert plain strings to proper reference objects
      const fixedRefs = artist.events.map((id: string, index: number) => ({
        _type: 'reference',
        _ref: id,
        _key: `event-${Date.now()}-${index}`,
      }))

      console.log(`       Fixed format:`, fixedRefs)

      try {
        await client.patch(artist._id).set({events: fixedRefs}).commit()
        console.log(`       ✅ Successfully fixed!\n`)
        totalFixed++
      } catch (error) {
        console.error(`       ❌ Error fixing artist ${artist._id}:`, error)
      }
    }
  }

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(60))
  console.log('✨ Migration complete!')
  console.log(`   Total documents fixed: ${totalFixed}`)
  console.log('='.repeat(60) + '\n')

  if (totalFixed === 0) {
    console.log('✅ No corrupted references found. Database is clean!')
  } else {
    console.log('✅ All corrupted references have been fixed.')
    console.log('   Bidirectional sync should now work correctly.')
  }
}

// Run the migration
fixCorruptedReferences()
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
