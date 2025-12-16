import { defineType, defineArrayMember } from 'sanity';
import { DocumentTextIcon } from '@sanity/icons';
import { componentValidation, componentSpecificValidation } from '../../shared/validation';
import type {
  PortableTextData,
  PortableTextBlock,
  PortableTextSpan,
  PortableTextMarkDefinition,
  ComponentHTMLGenerator,
  ValidationRule,
} from '../../shared/types';

export const portableText = defineType({
  name: 'portableText',
  title: 'Portable Text',
  type: 'array',
  icon: DocumentTextIcon,

  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'H5', value: 'h5' },
        { title: 'H6', value: 'h6' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
          { title: 'Underline', value: 'underline' },
          { title: 'Strike', value: 'strike-through' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (Rule) =>
                  Rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel'],
                  })
                    .required()
                    .error('Må være en gyldig URL'),
              },
              {
                name: 'openInNewTab',
                type: 'boolean',
                title: 'Open in new tab',
                initialValue: false,
              },
            ],
          },
        ],
      },
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
    }),
    defineArrayMember({
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Important for SEO and accessibility.',
          validation: componentSpecificValidation.imageAlt,
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          description: 'Optional caption to display below the image.',
        },
      ],
    }),
  ],
});

// Main HTML generation function
export const generatePortableTextHtml: ComponentHTMLGenerator<PortableTextData> = (
  data: PortableTextData
): string => {
  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    return '';
  }

  return renderPortableText(data.content);
};

// Default components for rendering PortableText to HTML
export const defaultComponents = {
  block: {
    h2: (children: string) => `<h2>${children}</h2>`,
    h3: (children: string) => `<h3>${children}</h3>`,
    h4: (children: string) => `<h4>${children}</h4>`,
    h5: (children: string) => `<h5>${children}</h5>`,
    h6: (children: string) => `<h6>${children}</h6>`,
    blockquote: (children: string) => `<blockquote>${children}</blockquote>`,
    normal: (children: string) => `<p>${children}</p>`,
  },
  list: {
    bullet: (children: string) => `<ul>${children}</ul>`,
    number: (children: string) => `<ol>${children}</ol>`,
  },
  listItem: {
    bullet: (children: string) => `<li>${children}</li>`,
    number: (children: string) => `<li>${children}</li>`,
  },
  marks: {
    strong: (text: string) => `<strong>${text}</strong>`,
    em: (text: string) => `<em>${text}</em>`,
    code: (text: string) => `<code>${text}</code>`,
    underline: (text: string) => `<u>${text}</u>`,
    'strike-through': (text: string) => `<del>${text}</del>`,
  },
  hardBreak: () => '<br />',
};

// Main function to convert PortableText to HTML
export function renderPortableText(
  blocks: PortableTextBlock[],
  components: any = defaultComponents
): string {
  return blocks.map((block) => renderBlock(block, components)).join('');
}

// Render a single block
function renderBlock(block: PortableTextBlock, components: any): string {
  const { _type, _key, style = 'normal', children = [], listItem, level = 0 } = block;

  // Handle lists
  if (listItem) {
    const listType = listItem === 'bullet' ? 'bullet' : 'number';
    const listItemContent = children.map((child) => renderSpan(child, components)).join('');
    return components.listItem[listType](listItemContent);
  }

  // Handle headings and other blocks
  if (style && components.block[style]) {
    const content = children.map((child) => renderSpan(child, components)).join('');
    return components.block[style](content);
  }

  // Handle custom blocks
  if (_type !== 'block' && components.types && components.types[_type]) {
    return components.types[_type](block);
  }

  // Fallback to normal paragraph
  const content = children.map((child) => renderSpan(child, components)).join('');
  return components.block.normal(content);
}

// Render a span (inline text)
function renderSpan(span: PortableTextSpan, components: any): string {
  let text = span.text || '';
  const marks = span.marks || [];

  // Handle hard break
  if (text === '\n') {
    return components.hardBreak();
  }

  // Apply marks (formatting)
  marks.forEach((mark) => {
    if (components.marks[mark]) {
      text = components.marks[mark](text);
    }
  });

  return text;
}

// Utility function to convert to plain text
export function toPlainText(blocks: PortableTextBlock[]): string {
  return blocks
    .map((block) => {
      if (block.children) {
        return block.children.map((child) => child.text || '').join('');
      }
      return '';
    })
    .join('\n')
    .trim();
}

// Utility function to find headings in PortableText
export function findHeadings(blocks: PortableTextBlock[]): Array<{
  level: number;
  text: string;
  _key: string;
}> {
  const headings: Array<{ level: number; text: string; _key: string }> = [];

  blocks.forEach((block) => {
    if (block.style && /^h[1-6]$/.test(block.style)) {
      const level = parseInt(block.style.slice(1));
      const text = block.children?.map((child) => child.text || '').join('') || '';

      headings.push({
        level,
        text,
        _key: block._key,
      });
    }
  });

  return headings;
}

// Utility function to generate table of contents
export function generateTableOfContents(blocks: PortableTextBlock[]): string {
  const headings = findHeadings(blocks);

  if (headings.length === 0) {
    return '';
  }

  let toc = '<nav class="table-of-contents"><ol>';

  headings.forEach((heading) => {
    const indent = '  '.repeat(heading.level - 1);
    const id = heading._key;
    toc += `${indent}<li><a href="#${id}">${heading.text}</a></li>`;
  });

  toc += '</ol></nav>';
  return toc;
}

// Type-safe validation functions
export const portableTextValidationRules = {
  content: componentValidation.title as ValidationRule,
} as const;

// Utility function to validate PortableText has content
export function hasValidPortableTextContent(data: PortableTextData): boolean {
  return !!(data.content && Array.isArray(data.content) && data.content.length > 0);
}

// Utility function to get word count from PortableText
export function getPortableTextWordCount(data: PortableTextData): number {
  const plainText = toPlainText(data.content);
  return plainText.split(/\s+/).filter((word) => word.length > 0).length;
}

// Utility function to get reading time estimate
export function getPortableTextReadingTime(
  data: PortableTextData,
  wordsPerMinute: number = 200
): number {
  const wordCount = getPortableTextWordCount(data);
  return Math.ceil(wordCount / wordsPerMinute);
}

// Utility function to validate PortableText structure
export function validatePortableText(blocks: PortableTextBlock[]): boolean {
  if (!Array.isArray(blocks)) {
    return false;
  }

  return blocks.every((block) => {
    return (
      block &&
      typeof block === 'object' &&
      block._type &&
      block._key &&
      (block.children === undefined || Array.isArray(block.children))
    );
  });
}
