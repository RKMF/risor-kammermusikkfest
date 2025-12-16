import { defineField, defineType } from 'sanity';
import { DocumentIcon, PlayIcon } from '@sanity/icons';
import { componentValidation } from '../../shared/validation';
import type { VideoData, ComponentHTMLGenerator, ValidationRule } from '../../shared/types';

export const videoComponent = defineType({
  name: 'videoComponent',
  title: 'Video',
  type: 'object',
  icon: DocumentIcon,
  description: 'Legg til video fra YouTube, Vimeo eller last opp egen fil',
  groups: [
    {
      name: 'content',
      title: 'Innhold',
      default: true,
    },
    {
      name: 'display',
      title: 'Visning & Avspilling',
    },
  ],
  fields: [
    defineField({
      name: 'videoType',
      title: 'Video-type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Last opp fil', value: 'sanity' },
          { title: 'YouTube', value: 'youtube' },
          { title: 'Vimeo', value: 'vimeo' },
          { title: 'Annen video-URL', value: 'external' },
        ],
      },
      initialValue: 'sanity',
      validation: componentValidation.title,
    }),
    defineField({
      name: 'video',
      title: 'Video-fil',
      type: 'file',
      group: 'content',
      description: 'Last opp en video-fil (MP4, WebM, etc.)',
      hidden: ({ parent }) => parent?.videoType !== 'sanity',
      options: {
        accept: 'video/*',
      },
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      group: 'content',
      description: 'Lim inn YouTube video URL (f.eks. https://www.youtube.com/watch?v=...)',
      hidden: ({ parent }) => parent?.videoType !== 'youtube',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }).custom((url) => {
          if (!url) return true;
          return url.includes('youtube.com') || url.includes('youtu.be')
            ? true
            : 'Må være en gyldig YouTube URL';
        }),
    }),
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      group: 'content',
      description: 'Lim inn Vimeo video URL (f.eks. https://vimeo.com/...)',
      hidden: ({ parent }) => parent?.videoType !== 'vimeo',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }).custom((url) => {
          if (!url) return true;
          return url.includes('vimeo.com') ? true : 'Må være en gyldig Vimeo URL';
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'Video-URL',
      type: 'url',
      group: 'content',
      description: 'Kun for direkte video-filer (.mp4, .webm osv.)',
      hidden: ({ parent }) => parent?.videoType !== 'external',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Videoformat',
      type: 'string',
      group: 'display',
      description: 'Velg format for videoen (bredde:høyde)',
      options: {
        list: [
          { title: 'Kvadrat (1:1)', value: '1:1' },
          { title: 'Portrett (4:5)', value: '4:5' },
          { title: 'Stående (9:16)', value: '9:16' },
          { title: 'Landskap (16:9)', value: '16:9' },
        ],
        layout: 'radio',
      },
      initialValue: '16:9',
    }),
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      group: 'content',
      description: 'Tittel for videoen (valgfritt)',
    }),
    defineField({
      name: 'description',
      title: 'Beskrivelse',
      type: 'text',
      group: 'content',
      description: 'Valgfri beskrivelse av videoen',
    }),
    defineField({
      name: 'autoplay',
      title: 'Autoplay',
      type: 'boolean',
      group: 'display',
      description: 'Start video automatisk når siden lastes',
      initialValue: false,
    }),
    defineField({
      name: 'muted',
      title: 'Dempet',
      type: 'boolean',
      group: 'display',
      description: 'Start video dempet (kreves for autoplay)',
      initialValue: true,
    }),
    defineField({
      name: 'controls',
      title: 'Kontroller',
      type: 'boolean',
      group: 'display',
      description: 'Vis video-kontroller',
      initialValue: true,
    }),
    defineField({
      name: 'loop',
      title: 'Loop',
      type: 'boolean',
      group: 'display',
      description: 'Spill video på nytt når den er ferdig',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      videoType: 'videoType',
      media: 'video',
      aspectRatio: 'aspectRatio',
      youtubeUrl: 'youtubeUrl',
      vimeoUrl: 'vimeoUrl',
      externalUrl: 'externalUrl',
    },
    prepare({ title, subtitle, videoType, media, aspectRatio, youtubeUrl, vimeoUrl, externalUrl }) {
      const formatText = aspectRatio ? ` • Format: ${aspectRatio}` : '';

      // Bestem hvilken video som skal vises i preview
      let previewVideo = null;
      if (videoType === 'sanity' && media) {
        previewVideo = media;
      } else if (videoType === 'youtube' && youtubeUrl) {
        previewVideo = { url: youtubeUrl, type: 'youtube' };
      } else if (videoType === 'vimeo' && vimeoUrl) {
        previewVideo = { url: vimeoUrl, type: 'vimeo' };
      } else if (videoType === 'external' && externalUrl) {
        previewVideo = { url: externalUrl, type: 'external' };
      }

      return {
        title: 'Video',
        subtitle: `${title || 'Uten tittel'} • ${subtitle ? `${subtitle} (${videoType})` : videoType || 'Ukjent type'}${formatText}`,
        media: media || PlayIcon,
      };
    },
  },
});

// Type-safe validation functions
export const videoValidationRules = {
  title: componentValidation.title as ValidationRule,
  videoType: componentValidation.title as ValidationRule,
} as const;

// Utility function to validate video data has required fields
export function hasValidVideoData(data: VideoData): boolean {
  switch (data.videoType) {
    case 'sanity':
      return !!data.video?.asset?.url;
    case 'youtube':
      return !!(data.youtubeUrl && extractYouTubeId(data.youtubeUrl));
    case 'vimeo':
      return !!(data.vimeoUrl && extractVimeoId(data.vimeoUrl));
    case 'external':
      return !!data.externalUrl;
    default:
      return false;
  }
}
