import { defineField, defineType } from 'sanity';
import {
  DocumentIcon,
  ImageIcon,
  PlayIcon,
  LinkIcon,
  TiersIcon,
  DocumentTextIcon,
  TextIcon,
  EllipsisHorizontalIcon,
  AddCommentIcon,
  BlockContentIcon,
  BoltIcon,
  CalendarIcon,
  ExpandIcon,
  ClockIcon,
  MenuIcon,
  ComposeIcon,
} from '@sanity/icons';

export const pageBuilder = defineType({
  name: 'pageBuilder',
  title: 'Sideinnhold',
  type: 'array',
  icon: DocumentIcon,
  description: 'Bygg innholdet med komponenter',
  options: {
    insertMenu: {
      filter: true,
      groups: [
        {
          name: 'content',
          title: 'Innhold',
          of: ['headingComponent', 'portableTextBlock', 'quoteComponent', 'marqueeComponent'],
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
            'artistScrollContainer',
            'eventScrollContainer',
            'contentScrollContainer',
            'composerScrollContainer',
          ],
        },
      ],
      views: [
        {
          name: 'grid',
        },
        {
          name: 'list',
        },
      ],
    },
  },
  of: [
    // === CONTENT COMPONENTS ===
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
            subtitle: text
              ? text.length > 40
                ? `${text.substring(0, 40)}...`
                : text
              : 'Ingen tekst',
            media: MenuIcon,
          };
        },
      },
    },

    // === MEDIA COMPONENTS ===
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

    // === LAYOUT COMPONENTS ===
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

    // === INTERACTIVE COMPONENTS ===
    {
      type: 'buttonComponent',
      title: 'Knapp',
      icon: BoltIcon,
      preview: {
        select: {
          title: 'text',
          style: 'style',
          fullWidth: 'fullWidth',
        },
        prepare({ title, style, fullWidth }) {
          const widthText = fullWidth ? ' • Full bredde' : '';
          return {
            title: title || 'Knapp uten tekst',
            subtitle: `${style || 'primary'}${widthText}`,
            media: BoltIcon,
          };
        },
      },
    },
    {
      type: 'linkComponent',
      title: 'Lenker',
      icon: LinkIcon,
      preview: {
        select: {
          links: 'links',
          description: 'description',
          layout: 'layout',
        },
        prepare({ links, description, layout }: { links?: unknown[]; description?: string; layout?: string }) {
          const linkCount = links?.length || 0;
          const layoutMap: Record<string, string> = {
            vertical: 'Vertikal',
            horizontal: 'Horisontal',
            grid: 'Rutenett',
          };
          const layoutText = layoutMap[layout || 'vertical'] || 'Vertikal';
          const descText = description ? ' • Med beskrivelse' : '';
          return {
            title: `Lenker (${linkCount})`,
            subtitle: `${layoutText}${descText}`,
            media: LinkIcon,
          };
        },
      },
    },
    {
      type: 'accordionComponent',
      title: 'Sammenleggbar seksjon',
      icon: TiersIcon,
      preview: {
        select: {
          title: 'title',
          subtitle: 'content',
        },
        prepare({ title, subtitle }) {
          return {
            title: title || 'Accordion uten tittel',
            subtitle: subtitle ? `${subtitle.substring(0, 50)}...` : 'Ingen innhold',
            media: TiersIcon,
          };
        },
      },
    },
    {
      type: 'countdownComponent',
      title: 'Nedtelling',
      icon: ClockIcon,
      preview: {
        select: {
          title: 'title',
          eventTitle: 'targetEvent.title',
          style: 'style',
        },
        prepare({ title, eventTitle, style }) {
          return {
            title: title || 'Nedtelling',
            subtitle: `til ${eventTitle || 'arrangement'} • ${style || 'compact'}`,
            media: ClockIcon,
          };
        },
      },
    },

    // === SECTION COMPONENTS ===
    {
      type: 'contentScrollContainer',
      title: 'Content Scroll Container',
      icon: EllipsisHorizontalIcon,
      preview: {
        select: {
          title: 'title',
          items: 'items',
          spacing: 'spacing',
        },
        prepare({ title, items, spacing }) {
          const itemCount = items?.length || 0;
          return {
            title: title || 'Content Scroll Container',
            subtitle: `${itemCount} elementer • ${spacing || 'medium'} avstand`,
            media: EllipsisHorizontalIcon,
          };
        },
      },
    },
    {
      type: 'artistScrollContainer',
      title: 'Artist Scroll Container',
      icon: DocumentIcon,
      preview: {
        select: {
          title: 'title',
          items: 'items',
        },
        prepare({ title, items }) {
          const itemCount = items?.length || 0;
          return {
            title: title || 'Artist Scroll Container',
            subtitle: `${itemCount} artister (4:5 kort)`,
            media: DocumentIcon,
          };
        },
      },
    },
    {
      type: 'eventScrollContainer',
      title: 'Event Scroll Container',
      icon: CalendarIcon,
      preview: {
        select: {
          title: 'title',
          items: 'items',
        },
        prepare({ title, items }) {
          const eventCount = items?.length || 0;
          return {
            title: title || 'Event Scroll Container',
            subtitle: `${eventCount} arrangementer (4:5 kort)`,
            media: CalendarIcon,
          };
        },
      },
    },
    {
      type: 'composerScrollContainer',
      title: 'Composer Scroll Container',
      icon: ComposeIcon,
      preview: {
        select: {
          title: 'title',
          items: 'items',
        },
        prepare({ title, items }) {
          const composerCount = items?.length || 0;
          return {
            title: title || 'Composer Scroll Container',
            subtitle: `${composerCount} komponister`,
            media: ComposeIcon,
          };
        },
      },
    },
  ],
});
