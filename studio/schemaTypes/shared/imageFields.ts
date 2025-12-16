import { defineField } from 'sanity';
import { ImageIcon } from '@sanity/icons';
import { componentValidation, componentSpecificValidation, seoValidation } from './validation';
import type { ValidationRule, SchemaGroup } from './types';

/**
 * Reusable multilingual image fields for documents
 * Provides consistent image handling across all document types
 */
export const multilingualImageFields = (fieldNamePrefix = 'image') => {
  const isRequired = fieldNamePrefix === 'featuredImage';
  const title = fieldNamePrefix === 'featuredImage' ? 'Bilde' : 'Hovedbilde';

  // Dynamic descriptions based on field type
  let description = 'Hovedbilde - brukes på siden og når siden deles på sosiale medier';
  if (fieldNamePrefix === 'featuredImage') {
    description =
      'Last opp eller velg et bilde som representerer årets festival - brukes når sider deles på sosiale medier';
  } else if (fieldNamePrefix === 'image') {
    // Check context to determine if this is a page/article with optional image
    description = 'Hovedbilde - brukes på siden og når siden deles på sosiale medier';
  }

  return [
    defineField({
      name: fieldNamePrefix,
      title,
      type: 'image',
      description,
      group: 'image',
      validation: isRequired ? componentValidation.image : componentValidation.optionalImage,
      options: {
        hotspot: true,
        accept: 'image/*',
      },
    }),
    defineField({
      name: `${fieldNamePrefix}Credit_no`,
      title: 'Kreditering (norsk)',
      type: 'string',
      description: 'Hvem som har tatt eller eier bildet på norsk (f.eks. "Foto: John Doe")',
      group: 'image',
      fieldset: 'imageCredit',
    }),
    defineField({
      name: `${fieldNamePrefix}Credit_en`,
      title: 'Kreditering (English)',
      type: 'string',
      description: 'Who took or owns the image in English (e.g. "Photo: John Doe")',
      group: 'image',
      fieldset: 'imageCredit',
    }),
    defineField({
      name: `${fieldNamePrefix}Alt_no`,
      title: 'Alt-tekst (norsk)',
      type: 'string',
      description: 'Beskriv bildet for tilgjengelighet på norsk',
      group: 'image',
      fieldset: 'altText',
      validation: componentSpecificValidation.imageAlt,
    }),
    defineField({
      name: `${fieldNamePrefix}Alt_en`,
      title: 'Alt-tekst (English)',
      type: 'string',
      description: 'Describe the image for accessibility in English',
      group: 'image',
      fieldset: 'altText',
      validation: componentSpecificValidation.imageAlt,
    }),
  ];
};

/**
 * Fieldsets for organizing image fields
 */
export const imageFieldsets = [
  {
    name: 'altText',
    title: 'Alt-tekst',
    options: { columns: 2 },
  },
  {
    name: 'imageCredit',
    title: 'Kreditering',
    options: { columns: 2 },
  },
];

/**
 * Standard image group for documents
 */
export const imageGroup: SchemaGroup = {
  name: 'image',
  title: 'Hovedbilde',
  icon: ImageIcon,
};

/**
 * Alternative image fields for cases where only one language is needed
 * or for special image types (like featured images)
 */
export const singleImageFields = (
  fieldNamePrefix = 'image',
  options: {
    title?: string;
    description?: string;
    language?: 'no' | 'en' | 'both';
    required?: boolean;
  } = {}
) => {
  const {
    title = 'Bilde',
    description = 'Last opp et bilde',
    language = 'both',
    required = false,
  } = options;

  const fields = [
    defineField({
      name: fieldNamePrefix,
      title,
      type: 'image',
      description,
      group: 'image',
      options: {
        hotspot: true,
        accept: 'image/*',
      },
      validation: required ? componentValidation.image : componentValidation.optionalImage,
    }),
  ];

  // Add credit fields based on language preference
  if (language === 'both' || language === 'no') {
    fields.push(
      defineField({
        name: `${fieldNamePrefix}Credit_no`,
        title: 'Kreditering (norsk)',
        type: 'string',
        description: 'Hvem som har tatt eller eier bildet på norsk',
        group: 'image',
        fieldset: 'imageCredit',
      })
    );
  }

  if (language === 'both' || language === 'en') {
    fields.push(
      defineField({
        name: `${fieldNamePrefix}Credit_en`,
        title: 'Kreditering (English)',
        type: 'string',
        description: 'Who took or owns the image in English',
        group: 'image',
        fieldset: 'imageCredit',
      })
    );
  }

  // Add alt text fields based on language preference
  if (language === 'both' || language === 'no') {
    fields.push(
      defineField({
        name: `${fieldNamePrefix}Alt_no`,
        title: 'Alt-tekst (norsk)',
        type: 'string',
        description: 'Beskriv bildet for tilgjengelighet på norsk',
        group: 'image',
        fieldset: 'altText',
        validation: componentSpecificValidation.imageAlt,
      })
    );
  }

  if (language === 'both' || language === 'en') {
    fields.push(
      defineField({
        name: `${fieldNamePrefix}Alt_en`,
        title: 'Alt-tekst (English)',
        type: 'string',
        description: 'Describe the image for accessibility in English',
        group: 'image',
        fieldset: 'altText',
        validation: componentSpecificValidation.imageAlt,
      })
    );
  }

  return fields;
};

/**
 * Helper function to get image field names for a given prefix
 */
export const getImageFieldNames = (fieldNamePrefix = 'image') => ({
  image: fieldNamePrefix,
  creditNo: `${fieldNamePrefix}Credit_no`,
  creditEn: `${fieldNamePrefix}Credit_en`,
  altNo: `${fieldNamePrefix}Alt_no`,
  altEn: `${fieldNamePrefix}Alt_en`,
});

/**
 * TypeScript interfaces for image data
 */
export interface MultilingualImageData {
  [key: string]: any; // The image field (dynamic key)
  // Credit fields will have pattern: {prefix}Credit_no, {prefix}Credit_en
  // Alt fields will have pattern: {prefix}Alt_no, {prefix}Alt_en
}

export interface ImageFieldConfig {
  fieldNamePrefix?: string;
  title?: string;
  description?: string;
  language?: 'no' | 'en' | 'both';
  required?: boolean;
}

// Type-safe validation functions for images
export const imageValidationRules = {
  image: componentValidation.image as ValidationRule,
  optionalImage: componentValidation.optionalImage as ValidationRule,
  imageAlt: componentSpecificValidation.imageAlt as ValidationRule,
} as const;

// Utility function to validate multilingual image data
export function validateMultilingualImageData(
  data: MultilingualImageData,
  fieldPrefix: string = 'image'
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const imageField = data[fieldPrefix];
  const altNoField = data[`${fieldPrefix}Alt_no`];
  const altEnField = data[`${fieldPrefix}Alt_en`];

  if (imageField && !altNoField && !altEnField) {
    errors.push('Minst én alt-tekst (norsk eller engelsk) må fylles ut når bilde er valgt');
  }

  if (altNoField && altNoField.length < 10) {
    errors.push('Norsk alt-tekst bør være minst 10 tegn lang');
  }

  if (altEnField && altEnField.length < 10) {
    errors.push('Engelsk alt-tekst bør være minst 10 tegn lang');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Utility function to get the appropriate alt text based on language
export function getLocalizedAltText(
  data: MultilingualImageData,
  fieldPrefix: string,
  language: 'no' | 'en'
): string | undefined {
  const altField = language === 'no' ? `${fieldPrefix}Alt_no` : `${fieldPrefix}Alt_en`;
  return data[altField];
}

// Utility function to get the appropriate credit based on language
export function getLocalizedCredit(
  data: MultilingualImageData,
  fieldPrefix: string,
  language: 'no' | 'en'
): string | undefined {
  const creditField = language === 'no' ? `${fieldPrefix}Credit_no` : `${fieldPrefix}Credit_en`;
  return data[creditField];
}
