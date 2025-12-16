import { defineField, defineType } from 'sanity';
import { DocumentIcon } from '@sanity/icons';
import { componentValidation, componentSpecificValidation } from '../../shared/validation';
import type { ImageData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

export const imageComponent = defineType({
  name: 'imageComponent',
  title: 'Bilde',
  type: 'object',
  icon: DocumentIcon,
  description: 'Last opp et bilde med alt-tekst og bildetekst for bedre tilgjengelighet',
  fields: [
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      description:
        'Last opp eller velg et bilde. Sanity optimaliserer bildet automatisk for nettsiden.',
      validation: componentValidation.image,
      options: {
        hotspot: true,
        accept: 'image/*',
      },
    }),
    defineField({
      name: 'credit',
      title: 'Kreditering',
      type: 'string',
      description:
        'Hvem som har tatt eller eier bildet (f.eks. "Foto: John Doe" eller "Kilde: Unsplash")',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'alt',
      title: 'Alt-tekst',
      type: 'string',
      description: 'Beskriv bildet for tilgjengelighet og SEO.',
      validation: componentSpecificValidation.imageAlt,
    }),
    defineField({
      name: 'caption',
      title: 'Bildetekst',
      type: 'string',
      description: 'Valgfri tekst som vises under bildet',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Bildeformat',
      type: 'string',
      description: 'Velg format for bildet når det vises alene (ikke i scroll-containere)',
      options: {
        list: [
          { title: 'Kvadrat (1:1)', value: '1:1' },
          { title: 'Portrett (4:5)', value: '4:5' },
          { title: 'Stående (9:16)', value: '9:16' },
          { title: 'Landskap (4:3)', value: '4:3' },
        ],
        layout: 'radio',
      },
      initialValue: '4:5',
    }),
  ],
  preview: {
    select: {
      title: 'alt',
      subtitle: 'caption',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: 'Bilde',
        subtitle: `${title || 'Uten alt-tekst'} • ${subtitle || 'Ingen bildetekst'}`,
        media: media || DocumentIcon,
      };
    },
  },
});

// TypeScript interface for image optimization options
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
}

// Funksjon for å generere optimaliserte bilde-URLer
// Merk: Dette krever @sanity/image-url pakken
export function generateOptimizedImageUrl(
  imageAsset: any,
  options: ImageOptimizationOptions = {}
): string | null {
  if (!imageAsset?.asset?.url) {
    return null;
  }

  const { width, height, quality = 80, format = 'webp', fit = 'crop' } = options;

  const baseUrl = imageAsset.asset.url;
  const params = new URLSearchParams({
    auto: 'format',
    fit,
    q: quality.toString(),
    fm: format,
  });

  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());

  return `${baseUrl}?${params.toString()}`;
}

// HTML escape utility function
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Type-safe validation functions
export const imageValidationRules = {
  image: componentValidation.image as ValidationRule,
  alt: componentSpecificValidation.imageAlt as ValidationRule,
  title: componentValidation.title as ValidationRule,
} as const;

// Utility function to check if image has valid asset
export function hasValidImageAsset(imageData: ImageData): boolean {
  return !!imageData.image?.asset?.url;
}

// Utility function to build responsive image srcset
export function buildResponsiveImageSrcSet(imageAsset: any, baseWidth: number = 800): string {
  if (!imageAsset?.asset?.url) return '';

  const baseUrl = imageAsset.asset.url;
  const sizes = [400, 600, 800, 1200, 1600];

  return sizes
    .map((width) => `${baseUrl}?auto=format&fit=crop&w=${width}&q=80 ${width}w`)
    .join(', ');
}
