/// <reference types="astro/client" />

// Allow importing Astro components in TypeScript
declare module '*.astro' {
  const component: any;
  export default component;
}
