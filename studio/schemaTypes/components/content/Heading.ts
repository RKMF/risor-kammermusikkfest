import { defineField, defineType } from 'sanity';
import { BlockContentIcon } from '@sanity/icons';
import { componentSpecificValidation, componentValidation } from '../../shared/validation';
import type { HeadingData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

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
export const headingValidationRules = {
  level: componentValidation.title as ValidationRule,
  text: componentSpecificValidation.headingText as ValidationRule,
} as const;

export const heading = defineType({
  name: 'headingComponent',
  title: 'Overskrift',
  type: 'object',
  icon: BlockContentIcon,
  description: 'Opprett overskrifter (H2-H4) for å strukturere innholdet ditt.',
  fields: [
    defineField({
      name: 'level',
      title: 'Nivå',
      type: 'string',
      description: 'Velg overskriftens nivå (H2-H4)',
      options: {
        list: [
          { title: 'H2 - Underskrift', value: 'h2' },
          { title: 'H3 - Mindre underskrift', value: 'h3' },
          { title: 'H4 - Liten overskrift', value: 'h4' },
        ],
      },
      validation: componentValidation.title,
    }),
    defineField({
      name: 'text',
      title: 'Overskriftstekst',
      type: 'string',
      description: 'Teksten som skal vises som overskrift',
      validation: componentSpecificValidation.headingText,
    }),
    defineField({
      name: 'id',
      title: 'Anker-ID (valgfritt)',
      type: 'slug',
      description:
        'Unik ID for overskriften som brukes for direkte lenker til denne seksjonen. Trykk "Generer" for å lage automatisk fra overskriftsteksten.',
      options: {
        source: (doc: any, options: any) => {
          // Hent tekst fra parent objekt
          const parent = options.parent;
          return parent?.text || '';
        },
        maxLength: 96,
        isUnique: () => true,
      },
    }),
  ],
  preview: {
    select: {
      level: 'level',
      text: 'text',
      id: 'id',
    },
    prepare({ level, text, id }) {
      const displayLevel = level ? level.toUpperCase() : 'H?';
      const displayText = text || 'Ingen overskriftstekst';
      const displayId = id?.current ? ` • Anker: #${id.current}` : '';

      return {
        title: 'Overskrift',
        subtitle: `${displayLevel}: ${displayText}${displayId}`,
        media: BlockContentIcon,
      };
    },
  },
});

// Utility function to generate ID from text if not provided
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .substring(0, 50) // Limit length
    .trim();
}

// TypeScript interface for heading hierarchy validation
export interface HeadingHierarchyValidation {
  isValid: boolean;
  errors: string[];
}

// TypeScript interface for heading in hierarchy
export interface HeadingInHierarchy {
  level: string;
  text: string;
}

// Validation function to check heading hierarchy
export function validateHeadingHierarchy(
  headings: HeadingInHierarchy[],
  hasTitleH2?: boolean
): HeadingHierarchyValidation {
  const errors: string[] = [];

  // Check if H2 exists when title has H2
  if (hasTitleH2) {
    const hasH2InHeadings = headings.some((h) => h.level === 'h2');
    if (hasH2InHeadings) {
      errors.push('H2 bør bare brukes i Tittel-komponenten, ikke i Overskrifter');
    }
  }

  // Check for proper hierarchy (H2 -> H3 -> H4 -> H5 -> H6)
  let previousLevel = 2; // Start with H2 since H1 is not available in Headings
  headings.forEach((heading, index) => {
    const currentLevel = parseInt(heading.level.slice(1));

    if (currentLevel - previousLevel > 1) {
      errors.push(
        `Overskriftshierarki-feil ved "${heading.text}": Kan ikke hoppe fra H${previousLevel} til H${currentLevel}`
      );
    }

    previousLevel = currentLevel;
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
