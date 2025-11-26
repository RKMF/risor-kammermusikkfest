import {defineField, defineType} from 'sanity'
import {CalendarIcon} from '@sanity/icons'
import {componentValidation, contentValidation} from '../../shared/validation'
import type {EventScrollContainerData, ComponentHTMLGenerator, ValidationRule} from '../../shared/types'
import {excludeAlreadySelected} from '../../shared/referenceFilters'

export const eventScrollContainer = defineType({
  name: 'eventScrollContainer',
  title: 'Event Scroll Container',
  type: 'object',
  icon: CalendarIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Tittel for event scroll-containeren (valgfritt)',
      validation: componentValidation.title,
    }),
        defineField({
      name: 'items',
      title: 'Arrangementer',
      type: 'array',
      description: 'Legg til mellom 2 og 8 arrangementer som skal vises i horisontal scroll',
              of: [{type: 'reference', to: [{type: 'event'}]}],
      validation: contentValidation.scrollContainerItems,
      options: {
        filter: excludeAlreadySelected(),
      },
    }),
    defineField({
      name: 'showScrollbar',
      title: 'Vis scrollbar',
      type: 'boolean',
      description: 'Om scrollbaren skal være synlig eller skjult',
      initialValue: false,
    }),
    defineField({
      name: 'showDate',
      title: 'Vis dato',
      type: 'boolean',
      description: 'Om datoen skal vises på event-kortene',
      initialValue: true,
    }),
    defineField({
      name: 'showTime',
      title: 'Vis klokkeslett',
      type: 'boolean',
      description: 'Om klokkeslettet skal vises på event-kortene',
      initialValue: true,
    }),
    defineField({
      name: 'showVenue',
      title: 'Vis spillested',
      type: 'boolean',
      description: 'Om spillestedet skal vises på event-kortene',
      initialValue: true,
    }),
    defineField({
      name: 'showArtists',
      title: 'Vis artister',
      type: 'boolean',
      description: 'Om artistene skal vises på event-kortene',
      initialValue: true,
    }),
    defineField({
      name: 'sortBy',
      title: 'Sorter etter',
      type: 'string',
      description: 'Hvordan arrangementene skal sorteres',
      options: {
        list: [
          {title: 'Dato (tidligst først)', value: 'date-asc'},
          {title: 'Dato (senest først)', value: 'date-desc'},
          {title: 'Alfabetisk (tittel)', value: 'title-asc'},
          {title: 'Manuell rekkefølge', value: 'manual'},
        ],
      },
      initialValue: 'date-asc',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({title, items}) {
      const eventCount = items?.length || 0
      return {
        title: 'Arrangementer',
        subtitle: `${title || 'Scroll Container'} • ${eventCount} arrangementer (4:5 kort)`,
        media: CalendarIcon,
      }
    },
  },
})

// Funksjon for å generere HTML fra event scroll container data
export const generateEventScrollHtml: ComponentHTMLGenerator<EventScrollContainerData> = (data: EventScrollContainerData): string => {
  if (!data.items || data.items.length === 0) {
    return ''
  }

  const containerClass = 'event-scroll-container'
  const scrollbarClass = data.showScrollbar ? '' : 'hide-scrollbar'
  const cardFormatClass = data.cardFormat
    ? `card-format-${data.cardFormat.replace(':', '-')}`
    : 'card-format-16-9'

  // Sorter arrangementer basert på valgt sortering
  let sortedEvents = [...data.items]
  switch (data.sortBy) {
    case 'date-asc':
      sortedEvents.sort((a, b) => {
        const dateA = a.eventDate?.date ? new Date(a.eventDate.date) : new Date(0)
        const dateB = b.eventDate?.date ? new Date(b.eventDate.date) : new Date(0)
        return dateA.getTime() - dateB.getTime()
      })
      break
    case 'date-desc':
      sortedEvents.sort((a, b) => {
        const dateA = a.eventDate?.date ? new Date(a.eventDate.date) : new Date(0)
        const dateB = b.eventDate?.date ? new Date(b.eventDate.date) : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
      break
    case 'title-asc':
      sortedEvents.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case 'manual':
    default:
      // Behold manuell rekkefølge
      break
  }

  const itemsHtml = sortedEvents
    .map((event) => {
      if (!event) return ''

      const eventDate = event.eventDate?.date ? new Date(event.eventDate.date) : null
      const dateString = eventDate ? eventDate.toLocaleDateString('nb-NO') : ''
      const timeString = event.eventTime || ''
      const venueName = event.venue?.title || ''
      const artistNames = event.artists?.map((artist: any) => artist.name).join(', ') || ''

      const dateHtml =
        data.showDate && dateString ? `<div class="event-date">${escapeHtml(dateString)}</div>` : ''
      const timeHtml =
        data.showTime && timeString ? `<div class="event-time">${escapeHtml(timeString)}</div>` : ''
      const venueHtml =
        data.showVenue && venueName ? `<div class="event-venue">${escapeHtml(venueName)}</div>` : ''
      const artistsHtml =
        data.showArtists && artistNames
          ? `<div class="event-artists">${escapeHtml(artistNames)}</div>`
          : ''

      const imageUrl = event.image?.asset?.url || ''
      const imageAlt = event.image?.alt || event.title || ''

      return `
        <div class="event-item">
          <div class="event-card">
            ${imageUrl ? `<div class="event-image"><img src="${imageUrl}" alt="${escapeHtml(imageAlt)}" /></div>` : ''}
            <div class="event-content">
              <h4 class="event-title">${escapeHtml(event.title || '')}</h4>
              ${dateHtml}
              ${timeHtml}
              ${venueHtml}
              ${artistsHtml}
              ${event.buttonText ? `<a href="${event.buttonUrl || '#'}" class="event-button" ${event.buttonOpenInNewTab ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(event.buttonText)}</a>` : ''}
            </div>
          </div>
        </div>
      `
    })
    .join('')

  const titleHtml = data.title
    ? `<h3 class="event-scroll-title">${escapeHtml(data.title)}</h3>`
    : ''

  return `
    <div class="${containerClass} ${scrollbarClass} ${cardFormatClass}">
      ${titleHtml}
      <div class="event-scroll-wrapper">
        ${itemsHtml}
      </div>
    </div>
  `
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Type-safe validation functions
export const eventScrollContainerValidationRules = {
  title: componentValidation.title as ValidationRule,
  items: contentValidation.scrollContainerItems as ValidationRule,
} as const

// Utility function to validate event scroll container has content
export function hasValidEventScrollContent(data: EventScrollContainerData): boolean {
  return !!(data.items && data.items.length > 0)
}

// Utility function to get event count
export function getEventCount(data: EventScrollContainerData): number {
  return data.items?.length || 0
}

// Utility function to generate container classes
export function generateEventScrollClasses(data: EventScrollContainerData): string[] {
  const classes = ['event-scroll-container']

  if (!data.showScrollbar) {
    classes.push('hide-scrollbar')
  }

  if (data.cardFormat) {
    classes.push(`card-format-${data.cardFormat.replace(':', '-')}`)
  } else {
    classes.push('card-format-16-9')
  }

  return classes
}

// Utility function to sort events
export function sortEvents(events: any[], sortBy: string): any[] {
  const sortedEvents = [...events]

  switch (sortBy) {
    case 'date-asc':
      return sortedEvents.sort((a, b) => {
        const dateA = a.eventDate?.date ? new Date(a.eventDate.date) : new Date(0)
        const dateB = b.eventDate?.date ? new Date(b.eventDate.date) : new Date(0)
        return dateA.getTime() - dateB.getTime()
      })
    case 'date-desc':
      return sortedEvents.sort((a, b) => {
        const dateA = a.eventDate?.date ? new Date(a.eventDate.date) : new Date(0)
        const dateB = b.eventDate?.date ? new Date(b.eventDate.date) : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
    case 'title-asc':
      return sortedEvents.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    case 'manual':
    default:
      return sortedEvents
  }
}

// Utility function to check if sort option is valid
export function isValidSortOption(sortBy: string): boolean {
  return ['date-asc', 'date-desc', 'title-asc', 'manual'].includes(sortBy)
}

// Utility function to format event date
export function formatEventDate(date: string | Date, locale: string = 'nb-NO'): string {
  const eventDate = typeof date === 'string' ? new Date(date) : date
  return eventDate.toLocaleDateString(locale)
}

// Utility function to generate event scroll container CSS
export function generateEventScrollCSS(): string {
  return `
    .event-scroll-container {
      width: 100%;
      overflow-x: auto;
      padding: 1rem 0;
    }

    .event-scroll-container.hide-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .event-scroll-container.hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    .event-scroll-wrapper {
      display: flex;
      gap: 1rem;
      padding: 0 1rem;
    }

    .event-item {
      flex: 0 0 auto;
      min-width: 250px;
      max-width: 350px;
    }

    .event-card {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
      background: white;
    }

    .event-card:hover {
      transform: translateY(-2px);
    }

    .event-image {
      width: 100%;
      aspect-ratio: var(--card-aspect-ratio, 16/9);
      overflow: hidden;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-format-16-9 .event-image {
      --card-aspect-ratio: 16/9;
    }

    .card-format-4-5 .event-image {
      --card-aspect-ratio: 4/5;
    }

    .event-content {
      padding: 1rem;
    }

    .event-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .event-date {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--primary-color, #007acc);
      margin-bottom: 0.25rem;
    }

    .event-time {
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.25rem;
    }

    .event-venue {
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .event-artists {
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
      margin-bottom: 1rem;
      font-style: italic;
    }

    .event-button {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: var(--primary-color, #007acc);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .event-button:hover {
      background-color: var(--primary-hover, #005fa3);
    }

    .event-scroll-title {
      margin: 0 0 1rem 1rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
  `
}
