import { defineField, defineType } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons';
import { componentValidation, componentSpecificValidation } from '../../shared/validation';
import type { TitleData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

// HTML escape utility function
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const title = defineType({
  name: 'title',
  title: 'Tittel',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'mainTitle',
      title: 'Hovedtittel (H1)',
      type: 'string',
      description: 'Hovedtittelen til dokumentet. Denne vises som en H1-tag.',
      validation: componentSpecificValidation.headingText,
    }),
    defineField({
      name: 'subtitle',
      title: 'Undertittel (H2)',
      type: 'string',
      description: 'Valgfri undertittel som vises som en H2-tag under hovedtittelen.',
      validation: componentSpecificValidation.headingText,
    }),
  ],
  preview: {
    select: {
      title: 'mainTitle',
      subtitle: 'subtitle',
    },
    prepare({ title, subtitle }) {
      return {
        title: 'Tittel',
        subtitle: `${title || 'Uten tittel'}${subtitle ? ` • Undertittel: ${subtitle}` : ''}`,
        media: DocumentTextIcon,
      };
    },
  },
});

// Type-safe validation functions
export const titleValidationRules = {
  mainTitle: componentSpecificValidation.headingText as ValidationRule,
  subtitle: componentSpecificValidation.headingText as ValidationRule,
} as const;

// Utility function to validate title has required content
export function hasValidTitleContent(data: TitleData): boolean {
  return !!(data.mainTitle && data.mainTitle.trim().length > 0);
}

// Utility function to generate SEO-friendly title
export function generateSeoTitle(data: TitleData, siteName?: string): string {
  const parts = [];

  if (data.mainTitle) {
    parts.push(data.mainTitle);
  }

  if (data.subtitle) {
    parts.push(data.subtitle);
  }

  if (siteName) {
    parts.push(siteName);
  }

  return parts.join(' | ');
}
