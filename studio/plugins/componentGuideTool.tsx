import { definePlugin } from 'sanity';
import { BookIcon } from '@sanity/icons';
import ComponentGuide from '../components/ComponentGuide';

export const componentGuideTool = definePlugin({
  name: 'component-guide',
  tools: [
    {
      name: 'component-guide',
      title: 'Komponentveiledning',
      icon: BookIcon,
      component: ComponentGuide,
    },
  ],
});
