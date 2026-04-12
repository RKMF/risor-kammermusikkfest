import { createClient } from '@sanity/client'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'dnk98dp0'
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production'
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || '2025-01-01'
const token = import.meta.env.SANITY_API_READ_TOKEN

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token,
  perspective: 'published',
  stega: false,
})
