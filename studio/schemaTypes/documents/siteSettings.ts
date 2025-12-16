import { defineField, defineType } from 'sanity';
import { CogIcon, ComposeIcon, ImageIcon, UsersIcon, HeartIcon, MenuIcon } from '@sanity/icons';
import { multilingualImageFields, imageFieldsets } from '../shared/imageFields';
import { seoGroup } from '../objects/seoFields';
import { componentValidation, crossFieldValidation } from '../shared/validation';
import { excludeAlreadySelected } from '../shared/referenceFilters';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Nettsideinnstillinger',
  type: 'document',
  icon: CogIcon,
  groups: [
    {
      name: 'no',
      title: 'Norsk (NO)',
      icon: ComposeIcon,
      default: true,
    },
    {
      name: 'en',
      title: 'English (EN)',
      icon: ComposeIcon,
    },
    {
      name: 'general',
      title: 'Felles innhold',
      icon: CogIcon,
    },
    {
      name: 'navigation',
      title: 'Navigasjon',
      icon: MenuIcon,
    },
    {
      name: 'identity',
      title: 'Logoer & Identitet',
      icon: HeartIcon,
    },
    {
      name: 'image',
      title: 'Årets festivalbilde',
      icon: ImageIcon,
    },
    seoGroup,
    {
      name: 'sponsors',
      title: 'Sponsorer',
      icon: UsersIcon,
    },
  ],
  fieldsets: [
    {
      name: 'festivalDates',
      title: 'Festivaldatoer',
      options: { columns: 2 },
    },
    {
      name: 'addressInfo',
      title: 'Adresse',
      description: 'Lenke til Google Maps eller annen lokasjon',
    },
    ...imageFieldsets,
  ],
  fields: [
    // NORSK INNHOLD
    defineField({
      name: 'organizationName_no',
      title: 'Festivalens navn (norsk)',
      type: 'string',
      group: 'no',
      description: 'Navnet på organisasjonen/festivalen på norsk',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'description_no',
      title: 'Festivalbeskrivelse (norsk)',
      type: 'text',
      rows: 2,
      description: 'Kort beskrivelse av festivalen og årets tema på norsk',
      group: 'no',
    }),
    defineField({
      name: 'newsletterTitle_no',
      title: 'Tittel for nyhetsbrev (norsk)',
      type: 'string',
      description: 'Tittel som vises på nyhetsbrev-signup skjema på norsk',
      group: 'no',
      initialValue: 'Meld deg på nyhetsbrev',
    }),

    // ENGELSK INNHOLD
    defineField({
      name: 'organizationName_en',
      title: 'Festival name (English)',
      type: 'string',
      group: 'en',
      description: 'Name of the organization/festival in English',
    }),
    defineField({
      name: 'description_en',
      title: 'Festival description (English)',
      type: 'text',
      rows: 2,
      description: "Short description of the festival and this year's theme in English",
      group: 'en',
    }),
    defineField({
      name: 'newsletterTitle_en',
      title: 'Newsletter title (English)',
      type: 'string',
      description: 'Title shown on newsletter signup form in English',
      group: 'en',
    }),

    // FELLES INNHOLD
    defineField({
      name: 'startDate',
      title: 'Startdato',
      type: 'reference',
      to: [{ type: 'eventDate' }],
      description: 'Velg første dag av festivalen',
      group: 'general',
      fieldset: 'festivalDates',
      validation: (Rule) => Rule.required().error('Startdato er påkrevd'),
    }),
    defineField({
      name: 'endDate',
      title: 'Sluttdato',
      type: 'reference',
      to: [{ type: 'eventDate' }],
      description: 'Velg siste dag av festivalen',
      group: 'general',
      fieldset: 'festivalDates',
      validation: (Rule) => Rule.required().error('Sluttdato er påkrevd'),
    }),

    // NAVIGASJON
    defineField({
      name: 'menuItems',
      title: 'Menyelementer',
      type: 'array',
      group: 'navigation',
      description: 'Velg sider som skal vises i menyen. Dra for å endre rekkefølge.',
      of: [
        {
          type: 'reference',
          to: [
            { type: 'homepage' },
            { type: 'programPage' },
            { type: 'artistPage' },
            { type: 'articlePage' },
            { type: 'page' },
          ],
        },
      ],
      options: {
        filter: excludeAlreadySelected(),
      },
    }),

    defineField({
      name: 'logos',
      title: 'Logoer',
      type: 'array',
      group: 'identity',
      description: 'Logoer for organisasjonen (hovedlogo, sekundær logo, etc.)',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Logonavn',
              type: 'string',
              description: 'F.eks. "Hovedlogo", "Sekundær logo", "Hvit logo"',
              validation: componentValidation.title,
            }),
            defineField({
              name: 'image',
              title: 'Logo',
              type: 'image',
              options: { hotspot: true },
              validation: componentValidation.image,
            }),
            defineField({
              name: 'description',
              title: 'Beskrivelse',
              type: 'text',
              rows: 2,
              description: 'Hvor og hvordan denne logoen skal brukes',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              media: 'image',
              description: 'description',
            },
            prepare({ title, media, description }) {
              return {
                title: title || 'Uten navn',
                subtitle: description || 'Ingen beskrivelse',
                media,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'identity',
      description: 'Liten ikon som vises i nettleserens faneblad',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'email',
      title: 'E-post',
      type: 'email',
      description: 'Hoved e-postadresse for kontakt',
      group: 'general',
    }),
    defineField({
      name: 'phone',
      title: 'Telefon',
      type: 'string',
      description: 'Telefonnummer for kontakt',
      group: 'general',
    }),
    defineField({
      name: 'address',
      title: 'Postadresse',
      type: 'string',
      description: 'F.eks. Storgata 3, 0150 Byen',
      group: 'general',
      fieldset: 'addressInfo',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Lenke-URL',
      type: 'url',
      description: 'Lenke til kart eller nettside (f.eks. Google Maps)',
      group: 'general',
      fieldset: 'addressInfo',
      validation: crossFieldValidation.requiredWhen('address', true),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Åpne i ny fane',
      type: 'boolean',
      description: 'Åpner lenken i en ny fane (anbefalt for eksterne lenker)',
      group: 'general',
      fieldset: 'addressInfo',
      initialValue: true,
    }),
    defineField({
      name: 'socialMedia',
      title: 'Sosiale medier',
      type: 'array',
      group: 'general',
      description: 'Legg til de sosiale mediene du ønsker å vise',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Navn',
              type: 'string',
              description: 'F.eks. "Instagram", "Facebook", "LinkedIn"',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Lenke til profilen din',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              url: 'url',
            },
            prepare({ title, url }) {
              return {
                title: title || 'Uten navn',
                subtitle: url || 'Ingen URL',
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'sponsors',
      title: 'Sponsorer',
      type: 'array',
      group: 'sponsors',
      description: 'Liste over sponsorer med logo og lenke',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Sponsornavn',
              type: 'string',
            }),
            defineField({
              name: 'logo',
              title: 'Sponsorlogo',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'url',
              title: 'Lenke til sponsor',
              type: 'url',
              description: 'URL til sponsor nettside',
            }),
          ],
          preview: {
            select: {
              title: 'name',
              media: 'logo',
              url: 'url',
            },
            prepare({ title, media, url }) {
              return {
                title: title || 'Uten navn',
                subtitle: url ? 'Har lenke' : 'Ingen lenke',
                media,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'newsletterUrl',
      title: 'Nyhetsbrev påmeldingslenke',
      type: 'url',
      description:
        'Lenke til nyhetsbrev påmeldingsskjema hos din leverandør (f.eks. Make, Mailchimp)',
      group: 'general',
    }),
    ...multilingualImageFields('featuredImage'),
    defineField({
      name: 'defaultSeo',
      title: 'Standard SEO (fallback)',
      type: 'seo',
      description: 'Brukes som fallback når sider ikke har egne SEO-felt utfylt',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      media: 'logo',
      year: 'festivalSettings.year',
      startDate: 'festivalSettings.startDate.date',
    },
    prepare({ media, year, startDate }) {
      const formatDate = (date: string) => {
        return date ? new Date(date).toLocaleDateString('nb-NO') : 'Ikke satt';
      };
      return {
        title: 'Nettsideinnstillinger',
        subtitle: `Festival ${year || new Date().getFullYear()} (${formatDate(startDate)})`,
        media,
      };
    },
  },
});
