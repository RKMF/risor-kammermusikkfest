import {defineField, defineType} from 'sanity'
import {PlayIcon, MicrophoneIcon} from '@sanity/icons'
import {componentValidation} from '../../shared/validation'
import type {ValidationRule} from '../../shared/types'

export const spotifyComponent = defineType({
  name: 'spotifyComponent',
  title: 'Spotify',
  type: 'object',
  icon: PlayIcon,
  description: 'Legg til Spotify-innhold (låt, album, spilleliste eller artist)',
  fields: [
    defineField({
      name: 'spotifyUrl',
      title: 'Spotify URL',
      type: 'url',
      description:
        'Lim inn Spotify-link (f.eks. https://open.spotify.com/track/... eller https://open.spotify.com/album/...)',
      validation: (Rule) =>
        Rule.required()
          .uri({
            scheme: ['http', 'https'],
          })
          .custom((url) => {
            if (!url) return 'Spotify URL er påkrevd'
            return url.includes('open.spotify.com') || url.includes('spotify:')
              ? true
              : 'Må være en gyldig Spotify URL'
          })
          .error('Spotify URL er påkrevd'),
    }),
  ],
  preview: {
    select: {
      spotifyUrl: 'spotifyUrl',
    },
    prepare({spotifyUrl}) {
      // Extract Spotify type from URL
      let spotifyType = 'Ukjent'
      if (spotifyUrl) {
        if (spotifyUrl.includes('/track/')) spotifyType = 'Låt'
        else if (spotifyUrl.includes('/album/')) spotifyType = 'Album'
        else if (spotifyUrl.includes('/playlist/')) spotifyType = 'Spilleliste'
        else if (spotifyUrl.includes('/artist/')) spotifyType = 'Artist'
      }

      return {
        title: 'Spotify',
        subtitle: spotifyType,
        media: MicrophoneIcon,
      }
    },
  },
})

// Type for Spotify data
export interface SpotifyData {
  _type: 'spotifyComponent'
  _key?: string
  spotifyUrl: string
}

// Type-safe validation functions
export const spotifyValidationRules = {
  spotifyUrl: componentValidation.title as ValidationRule,
} as const

// Utility function to extract Spotify ID from URL
export function extractSpotifyId(url: string): string | null {
  if (!url) return null

  // Handle spotify: URIs (e.g., spotify:track:xxxxx)
  if (url.startsWith('spotify:')) {
    const parts = url.split(':')
    return parts.length >= 3 ? parts[2] : null
  }

  // Handle open.spotify.com URLs
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
  return match ? match[2] : null
}

// Utility function to determine Spotify embed type
export function getSpotifyEmbedType(url: string): 'track' | 'album' | 'playlist' | 'artist' | null {
  if (!url) return null

  if (url.includes('/track/') || url.includes('spotify:track:')) return 'track'
  if (url.includes('/album/') || url.includes('spotify:album:')) return 'album'
  if (url.includes('/playlist/') || url.includes('spotify:playlist:')) return 'playlist'
  if (url.includes('/artist/') || url.includes('spotify:artist:')) return 'artist'

  return null
}

// Utility function to generate Spotify embed URL
export function generateSpotifyEmbedUrl(url: string, compact: boolean = false): string | null {
  const embedType = getSpotifyEmbedType(url)
  const spotifyId = extractSpotifyId(url)

  if (!embedType || !spotifyId) return null

  return `https://open.spotify.com/embed/${embedType}/${spotifyId}${compact ? '?utm_source=generator&theme=0' : '?utm_source=generator'}`
}

// Utility function to validate Spotify data has required fields
export function hasValidSpotifyData(data: SpotifyData): boolean {
  return !!(data.spotifyUrl && extractSpotifyId(data.spotifyUrl))
}
