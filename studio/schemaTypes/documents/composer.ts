import {defineField, defineType} from 'sanity'
import {ComposeIcon, ImageIcon} from '@sanity/icons'
import {componentValidation} from '../shared/validation'
import {multilingualImageFields, imageFieldsets, imageGroup} from '../shared/imageFields'

export const composer = defineType({
  name: 'composer',
  title: 'Komponister',
  type: 'document',
  icon: ComposeIcon,
  groups: [
    {
      name: 'basic',
      title: 'Grunnleggende',
      icon: ComposeIcon,
      default: true,
    },
    imageGroup,
  ],
  fieldsets: [
    ...imageFieldsets,
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Navn på komponist',
      type: 'string',
      validation: componentValidation.title,
      group: 'basic',
    }),
    ...multilingualImageFields('image'),
  ],
  preview: {
    select: {
      name: 'name',
      media: 'image',
    },
    prepare({name, media}) {
      return {
        title: name || 'Uten navn',
        media: media || ComposeIcon,
      };
    },
  },
})