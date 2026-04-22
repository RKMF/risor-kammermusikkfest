import { defineType } from 'sanity';
import {
  DocumentIcon,
  ImageIcon,
  PlayIcon,
  LinkIcon,
  TiersIcon,
  TextIcon,
  AddCommentIcon,
  BlockContentIcon,
  MenuIcon,
  CalendarIcon,
  ExpandIcon,
  ClockIcon,
  ComposeIcon,
} from '@sanity/icons';

type HomepageBuilderItem = {
  _type?: string;
};

export const homepagePageBuilder = defineType({
  name: 'homepagePageBuilder',
  title: 'Forsideinnhold',
  type: 'array',
  icon: DocumentIcon,
  description: 'Bygg forsiden med komponenter. Forside-tittel (H1) må ligge først hvis den brukes.',
  validation: (Rule) =>
    Rule.custom((items: HomepageBuilderItem[] | undefined) => {
      if (!items || items.length === 0) {
        return true;
      }

      const h1Blocks = items.filter((item) => item?._type === 'homepageH1Component');
      if (h1Blocks.length > 1) {
        return 'Du kan bare ha én Forside-tittel (H1) per forside.';
      }

      const heroBlocks = items.filter((item) => item?._type === 'homepageHeroComponent');
      if (heroBlocks.length > 1) {
        return 'Du kan bare ha én Forside-hero per forside.';
      }

      const firstH1Index = items.findIndex((item) => item?._type === 'homepageH1Component');
      if (firstH1Index > 0) {
        return 'Forside-tittel (H1) må være første blokk i forsideinnholdet.';
      }

      return true;
    }),
  options: {
    insertMenu: {
      filter: true,
      groups: [
        {
          name: 'content',
          title: 'Innhold',
          of: [
            'homepageH1Component',
            'homepageHeroComponent',
            'headingComponent',
            'portableTextBlock',
            'quoteComponent',
            'marqueeComponent',
          ],
        },
        {
          name: 'media',
          title: 'Media',
          of: ['imageComponent', 'videoComponent', 'spotifyComponent'],
        },
        {
          name: 'interactive',
          title: 'Interaktiv',
          of: ['buttonComponent', 'linkComponent', 'accordionComponent', 'countdownComponent'],
        },
        {
          name: 'layout',
          title: 'Layout',
          of: ['twoColumnLayout', 'threeColumnLayout', 'gridComponent'],
        },
        {
          name: 'sections',
          title: 'Seksjoner',
          of: [
            'homepageEventCardsComponent',
            'artistScrollContainer',
            'eventScrollContainer',
            'contentScrollContainer',
            'composerScrollContainer',
            'articleScrollContainer',
          ],
        },
      ],
      views: [{ name: 'grid' }, { name: 'list' }],
    },
  },
  of: [
    {
      type: 'homepageH1Component',
      title: 'Forside-tittel (H1)',
      icon: BlockContentIcon,
      preview: {
        select: {
          text: 'text',
          id: 'id',
        },
        prepare({ text, id }) {
          const displayText = text || 'Ingen titteltekst';
          const displayId = id?.current ? `#${id.current}` : '';

          return {
            title: `H1: ${displayText}`,
            subtitle: displayId,
            media: BlockContentIcon,
          };
        },
      },
    },
    {
      type: 'homepageHeroComponent',
      title: 'Forside-hero',
      icon: ImageIcon,
      preview: {
        select: {
          links: 'links',
        },
        prepare({ links }) {
          const linkCount = links?.length || 0;
          return {
            title: 'Forside-hero',
            subtitle: linkCount > 0 ? `${linkCount} CTA-lenker` : 'Kun logo',
            media: ImageIcon,
          };
        },
      },
    },
    {
      type: 'homepageEventCardsComponent',
      title: 'Forside-arrangementer',
      icon: CalendarIcon,
      preview: {
        select: {
          title: 'title',
          items: 'items',
        },
        prepare({ title, items }) {
          const eventCount = items?.length || 0;
          return {
            title: title || 'Forside-arrangementer',
            subtitle: `${eventCount} arrangementer`,
            media: CalendarIcon,
          };
        },
      },
    },
    {
      type: 'headingComponent',
      title: 'Overskrift (H2-H6)',
      icon: BlockContentIcon,
      preview: {
        select: {
          level: 'level',
          text: 'text',
          id: 'id',
        },
        prepare({ level, text, id }) {
          const displayLevel = level ? level.toUpperCase() : 'H?';
          const displayText = text || 'Ingen overskriftstekst';
          const displayId = id?.current ? `#${id.current}` : '';

          return {
            title: `${displayLevel}: ${displayText}`,
            subtitle: displayId,
            media: BlockContentIcon,
          };
        },
      },
    },
    {
      type: 'portableTextBlock',
      title: 'Tekst',
      icon: TextIcon,
      preview: {
        select: {
          title: 'title',
          content: 'content',
        },
        prepare({ title, content }) {
          const firstText = content?.[0]?.children?.[0]?.text || '';
          const displayTitle = title || 'Tekst';
          const displaySubtitle = firstText ? `${firstText.substring(0, 50)}...` : 'Ingen innhold';

          return {
            title: displayTitle,
            subtitle: displaySubtitle,
            media: TextIcon,
          };
        },
      },
    },
    {
      type: 'quoteComponent',
      title: 'Sitat',
      icon: AddCommentIcon,
      preview: {
        select: {
          quote: 'quote',
          author: 'author',
        },
        prepare({ quote, author }) {
          return {
            title: quote || 'Sitat',
            subtitle: author ? `– ${author}` : '',
            media: AddCommentIcon,
          };
        },
      },
    },
    {
      type: 'marqueeComponent',
      title: 'Rullende tekst',
      icon: MenuIcon,
      preview: {
        select: {
          text: 'text',
        },
        prepare({ text }) {
          return {
            title: 'Rullende tekst',
            subtitle: text ? (text.length > 40 ? `${text.substring(0, 40)}...` : text) : 'Ingen tekst',
            media: MenuIcon,
          };
        },
      },
    },
    {
      type: 'imageComponent',
      title: 'Bilde',
      icon: ImageIcon,
      preview: {
        select: {
          title: 'alt',
          subtitle: 'caption',
          media: 'image',
        },
        prepare({ title, subtitle, media }) {
          return {
            title: title || 'Bilde uten alt-tekst',
            subtitle: subtitle || 'Ingen bildetekst',
            media: media || ImageIcon,
          };
        },
      },
    },
    {
      type: 'videoComponent',
      title: 'Video',
      icon: PlayIcon,
      preview: {
        select: {
          title: 'title',
          subtitle: 'url',
          media: 'thumbnail',
        },
        prepare({ title, subtitle, media }) {
          return {
            title: title || 'Video uten tittel',
            subtitle: subtitle || 'Ingen URL',
            media: media || PlayIcon,
          };
        },
      },
    },
    {
      type: 'spotifyComponent',
      title: 'Spotify',
      icon: PlayIcon,
    },
    {
      type: 'gridComponent',
      title: 'Rutenett',
      icon: TiersIcon,
    },
    {
      type: 'twoColumnLayout',
      title: 'To kolonner',
      icon: TiersIcon,
    },
    {
      type: 'threeColumnLayout',
      title: 'Tre kolonner',
      icon: TiersIcon,
    },
    {
      type: 'buttonComponent',
      title: 'Knapp',
      icon: LinkIcon,
    },
    {
      type: 'linkComponent',
      title: 'Lenke',
      icon: LinkIcon,
    },
    {
      type: 'accordionComponent',
      title: 'Trekkspillmeny',
      icon: ExpandIcon,
    },
    {
      type: 'countdownComponent',
      title: 'Nedtelling',
      icon: ClockIcon,
    },
    {
      type: 'contentScrollContainer',
      title: 'Innholdskarusell',
      icon: DocumentIcon,
    },
    {
      type: 'artistScrollContainer',
      title: 'Artistkarusell',
      icon: ComposeIcon,
    },
    {
      type: 'eventScrollContainer',
      title: 'Arrangementskarusell',
      icon: CalendarIcon,
    },
    {
      type: 'composerScrollContainer',
      title: 'Komponistkarusell',
      icon: ComposeIcon,
    },
    {
      type: 'articleScrollContainer',
      title: 'Artikkelkarusell',
      icon: DocumentIcon,
    },
  ],
});
