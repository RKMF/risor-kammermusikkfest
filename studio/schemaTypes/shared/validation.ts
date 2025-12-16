/**
 * Standard validation patterns for consistency across components
 */

export const componentValidation = {
  // Text fields
  title: (Rule: any) =>
    Rule.required().min(1).max(100).warning('Titler bør være mellom 1-100 tegn'),
  shortTitle: (Rule: any) => Rule.max(50).warning('Korte titler bør være under 50 tegn'),
  description: (Rule: any) => Rule.max(150).warning('Beskrivelser bør være under 150 tegn'),
  longDescription: (Rule: any) =>
    Rule.max(2000).warning('Lange beskrivelser bør være under 2000 tegn'),

  // URL fields
  url: (Rule: any) =>
    Rule.uri({
      scheme: ['http', 'https'],
    }).warning('Må være en gyldig URL (http/https)'),

  // Email fields
  email: (Rule: any) => Rule.email().warning('Må være en gyldig e-postadresse'),

  // Array fields
  itemsMinMax: (min: number, max: number) => (Rule: any) =>
    Rule.min(min).max(max).error(`Må ha mellom ${min} og ${max} elementer`),

  // Image fields
  image: (Rule: any) => Rule.required().error('Bilde er påkrevd'),
  optionalImage: (Rule: any) => Rule.warning('Bilde anbefales for bedre visning'),

  // Slug fields
  slug: (Rule: any) => Rule.required().error('URL-slug er påkrevd for denne siden'),

  // Number fields
  positiveNumber: (Rule: any) => Rule.positive().integer().warning('Må være et positivt heltall'),
  percentage: (Rule: any) => Rule.min(0).max(100).warning('Må være mellom 0 og 100'),

  // Date fields
  futureDate: (Rule: any) =>
    Rule.min(new Date().toISOString().split('T')[0]).warning('Dato bør være i fremtiden'),

  // Common patterns
  phoneNumber: (Rule: any) =>
    Rule.regex(/^[\+]?[0-9\s\-\(\)]+$/).warning('Ikke et gyldig telefonnummer'),
};

/**
 * Content validation helpers
 */
export const contentValidation = {
  // Festival-specific validation
  festivalYear: (Rule: any) => {
    const currentYear = new Date().getFullYear();
    return Rule.min(currentYear - 1)
      .max(currentYear + 5)
      .warning(`Festivalår bør være mellom ${currentYear - 1} og ${currentYear + 5}`);
  },

  // Event validation
  eventCapacity: (Rule: any) =>
    Rule.min(1).max(10000).warning('Kapasitet bør være mellom 1 og 10,000 personer'),

  // Artist validation
  artistGenres: (Rule: any) =>
    Rule.min(1).max(5).warning('Velg mellom 1 og 5 sjangre for artisten'),

  // Component-specific validation
  accordionPanels: (Rule: any) =>
    Rule.min(1).max(10).error('Accordion må ha mellom 1 og 10 paneler'),

  scrollContainerItems: (Rule: any) =>
    Rule.min(2).max(8).error('Scroll container må ha mellom 2 og 8 elementer'),

  layoutItems: (Rule: any) => Rule.min(1).max(12).error('Layout må ha mellom 1 og 12 elementer'),
};

/**
 * SEO validation helpers
 */
export const seoValidation = {
  metaTitle: (Rule: any) => Rule.max(60).warning('Meta tittel bør være under 60 tegn for SEO'),
  metaDescription: (Rule: any) =>
    Rule.max(160).warning('Meta beskrivelse bør være under 160 tegn for SEO'),
  altText: (Rule: any) =>
    Rule.max(125).warning('Alt-tekst bør være under 125 tegn for tilgjengelighet'),
};

/**
 * Accessibility validation helpers
 */
export const a11yValidation = {
  ariaLabel: (Rule: any) => Rule.min(1).max(100).warning('ARIA label bør være mellom 1-100 tegn'),
  contrastRatio: (Rule: any) =>
    Rule.custom((value: string) => {
      // This would need a contrast checking function in practice
      return true; // Placeholder
    }).warning('Sjekk kontrast for tilgjengelighet'),
};

/**
 * Component-specific validation patterns
 */
export const componentSpecificValidation = {
  // Button validation
  buttonText: (Rule: any) =>
    Rule.required().min(1).max(30).error('Knappetekst er påkrevd og må være under 30 tegn'),

  // Link validation
  linkText: (Rule: any) =>
    Rule.required().min(1).max(50).error('Lenketekst er påkrevd og må være under 50 tegn'),

  // Image validation
  imageAlt: (Rule: any) =>
    Rule.min(1).max(125).warning('Alt-tekst anbefales for tilgjengelighet (1-125 tegn)'),

  // Video validation
  videoTitle: (Rule: any) => Rule.max(100).warning('Videotittel bør være under 100 tegn'),

  // Quote validation
  quoteText: (Rule: any) =>
    Rule.required().min(1).max(500).error('Sitat er påkrevd og må være under 500 tegn'),

  // Heading validation
  headingText: (Rule: any) =>
    Rule.required().min(1).max(200).error('Overskriftstekst er påkrevd og må være under 200 tegn'),
};

/**
 * Cross-field validation helpers
 */
export const crossFieldValidation = {
  // Ensure start date is before end date
  dateRange: (startField: string, endField: string) => (Rule: any) =>
    Rule.custom((value: string, context: any) => {
      const startDate = context.document?.[startField];
      const endDate = value;

      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        return 'Sluttdato må være etter startdato';
      }
      return true;
    }),

  // Ensure required field when another field has specific value
  requiredWhen: (dependentField: string, dependentValue: any) => (Rule: any) =>
    Rule.custom((value: any, context: any) => {
      const dependentFieldValue = context.document?.[dependentField];

      if (dependentFieldValue === dependentValue && !value) {
        return `Dette feltet er påkrevd når ${dependentField} er ${dependentValue}`;
      }
      return true;
    }),
};
