import { defineField, defineType } from 'sanity';
import { AddCommentIcon } from '@sanity/icons';
import { componentSpecificValidation, componentValidation } from '../../shared/validation';
import type { QuoteData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

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
export const quoteValidationRules = {
  quote: componentSpecificValidation.quoteText as ValidationRule,
  author: componentValidation.shortTitle as ValidationRule,
  source: componentValidation.longDescription as ValidationRule,
  cite: componentValidation.url as ValidationRule,
} as const;

// Utility function to format quote attribution
export function formatQuoteAttribution(author?: string, source?: string): string {
  if (!author && !source) return '';
  if (author && source) return `${author}, ${source}`;
  return author || source || '';
}

// Utility function to validate quote has required content
export function hasValidQuoteContent(data: QuoteData): boolean {
  return !!(data.quote && data.quote.trim().length > 0);
}

export const quoteComponent = defineType({
  name: 'quoteComponent',
  title: 'Sitater',
  type: 'object',
  icon: AddCommentIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Sitat',
      type: 'text',
      description: 'Sitatet som skal vises',
      validation: componentSpecificValidation.quoteText,
    }),
    defineField({
      name: 'author',
      title: 'Forfatter',
      type: 'string',
      description: 'Hvem som har sagt sitatet',
      validation: componentValidation.shortTitle,
    }),
    defineField({
      name: 'source',
      title: 'Kilde',
      type: 'string',
      description: 'Hvor sitatet kommer fra (bok, artikkel, etc.)',
      validation: componentValidation.longDescription,
    }),
    defineField({
      name: 'cite',
      title: 'Kilde-URL',
      type: 'url',
      description: 'Valgfri URL til den opprinnelige kilden.',
      validation: componentValidation.url,
    }),
  ],
  preview: {
    select: {
      title: 'quote',
      subtitle: 'author',
      source: 'source',
    },
    prepare({ title, subtitle, source }) {
      const displaySubtitle = title ? `${title.substring(0, 40)}...` : 'Ingen innhold';
      const authorInfo = subtitle
        ? `${subtitle}${source ? ` - ${source}` : ''}`
        : source || 'Ingen forfatter';

      return {
        title: 'Sitat',
        subtitle: `${displaySubtitle} • ${authorInfo}`,
        media: AddCommentIcon,
      };
    },
  },
});

// Function to generate HTML from quote data
export const generateQuoteHtml: ComponentHTMLGenerator<QuoteData> = (data: QuoteData): string => {
  if (!data.quote) {
    return '';
  }

  const escapedQuote = escapeHtml(data.quote);
  const escapedAuthor = data.author ? escapeHtml(data.author) : '';
  const escapedSource = data.source ? escapeHtml(data.source) : '';
  const escapedCite = data.cite ? escapeHtml(data.cite) : '';

  let html = '<blockquote';

  if (escapedCite) {
    html += ` cite="${escapedCite}"`;
  }

  html += '>';
  html += escapedQuote;

  // Add attribution if author or source exists
  if (escapedAuthor || escapedSource) {
    html += '<cite>';
    if (escapedAuthor) {
      html += escapedAuthor;
    }
    if (escapedAuthor && escapedSource) {
      html += ', ';
    }
    if (escapedSource) {
      html += escapedSource;
    }
    html += '</cite>';
  }

  html += '</blockquote>';
  return html;
};
