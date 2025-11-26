import {defineField, defineType} from 'sanity'
import {DocumentIcon} from '@sanity/icons'
import {componentValidation, contentValidation} from '../../shared/validation'
import type {ArtistScrollContainerData, ComponentHTMLGenerator, ValidationRule} from '../../shared/types'
import {excludeAlreadySelected} from '../../shared/referenceFilters'

export const artistScrollContainer = defineType({
  name: 'artistScrollContainer',
  title: 'Artist Scroll Container',
  type: 'object',
  icon: DocumentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Tittel for artist scroll-containeren (valgfritt)',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'items',
      title: 'Artister',
      type: 'array',
      description: 'Legg til mellom 2 og 8 artister som skal vises i horisontal scroll',
      of: [{type: 'reference', to: [{type: 'artist'}]}],
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
  ],
  preview: {
    select: {
      title: 'title',
      items: 'items',
    },
    prepare({title, items}) {
      const itemCount = items?.length || 0
      return {
        title: 'Artister',
        subtitle: `${title || 'Scroll Container'} • ${itemCount} artister (4:5 kort)`,
        media: DocumentIcon,
      }
    },
  },
})

// Funksjon for å generere HTML fra artist scroll container data
export const generateArtistScrollHtml: ComponentHTMLGenerator<ArtistScrollContainerData> = (data: ArtistScrollContainerData): string => {
  if (!data.items || data.items.length === 0) {
    return ''
  }

  const containerClass = 'artist-scroll-container'
  const scrollbarClass = data.showScrollbar ? '' : 'hide-scrollbar'

  const itemsHtml = data.items
    .map((artist) => {
      if (!artist) return ''

      const artistName = artist.name || ''
      const artistImage = artist.image?.asset?.url || ''
      const artistImageAlt = artist.image?.alt || artistName || ''
      const artistBio = artist.bio || ''
      const artistGenres = artist.genres?.map((genre: any) => genre.title).join(', ') || ''

      return `
        <div class="artist-item">
          <div class="artist-card">
            ${artistImage ? `<div class="artist-image"><img src="${artistImage}" alt="${escapeHtml(artistImageAlt)}" /></div>` : ''}
            <div class="artist-content">
              <h4 class="artist-name">${escapeHtml(artistName)}</h4>
              ${artistGenres ? `<div class="artist-genres">${escapeHtml(artistGenres)}</div>` : ''}
              ${artistBio ? `<div class="artist-bio">${escapeHtml(artistBio.substring(0, 100))}${artistBio.length > 100 ? '...' : ''}</div>` : ''}
            </div>
          </div>
        </div>
      `
    })
    .join('')

  const titleHtml = data.title
    ? `<h3 class="artist-scroll-title">${escapeHtml(data.title)}</h3>`
    : ''

  return `
    <div class="${containerClass} ${scrollbarClass}">
      ${titleHtml}
      <div class="artist-scroll-wrapper">
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
export const artistScrollContainerValidationRules = {
  title: componentValidation.title as ValidationRule,
  items: contentValidation.scrollContainerItems as ValidationRule,
} as const

// Utility function to validate artist scroll container has content
export function hasValidArtistScrollContent(data: ArtistScrollContainerData): boolean {
  return !!(data.items && data.items.length > 0)
}

// Utility function to get artist count
export function getArtistCount(data: ArtistScrollContainerData): number {
  return data.items?.length || 0
}

// Utility function to generate container classes
export function generateArtistScrollClasses(data: ArtistScrollContainerData): string[] {
  const classes = ['artist-scroll-container']

  if (!data.showScrollbar) {
    classes.push('hide-scrollbar')
  }

  return classes
}

// Utility function to generate scroll container CSS
export function generateArtistScrollCSS(): string {
  return `
    .artist-scroll-container {
      width: 100%;
      overflow-x: auto;
      padding: 1rem 0;
    }

    .artist-scroll-container.hide-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .artist-scroll-container.hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    .artist-scroll-wrapper {
      display: flex;
      gap: 1rem;
      padding: 0 1rem;
    }

    .artist-item {
      flex: 0 0 auto;
      min-width: 200px;
      max-width: 300px;
    }

    .artist-card {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .artist-card:hover {
      transform: translateY(-2px);
    }

    .artist-image {
      width: 100%;
      aspect-ratio: 4/5;
      overflow: hidden;
    }

    .artist-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .artist-content {
      padding: 1rem;
    }

    .artist-name {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .artist-genres {
      font-size: 0.9rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .artist-bio {
      font-size: 0.85rem;
      line-height: 1.4;
      color: var(--text-secondary, #666);
    }

    .artist-scroll-title {
      margin: 0 0 1rem 1rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
  `
}
