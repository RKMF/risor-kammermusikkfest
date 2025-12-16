/**
 * Universal reference filter utilities for Sanity schemas
 *
 * These utilities prevent duplicate selections in reference array fields
 * by hiding items that are already selected in the current array.
 */

/**
 * Excludes already-selected items from a reference picker
 *
 * When manually adding references in the UI, this filter hides items that are
 * already in the current array, preventing duplicate selections. Items reappear
 * in the picker when removed from the array.
 *
 * Usage in schema:
 * ```typescript
 * import {excludeAlreadySelected} from '../shared/referenceFilters'
 *
 * defineField({
 *   name: 'items',
 *   type: 'array',
 *   of: [{type: 'reference', to: [{type: 'event'}]}],
 *   options: {
 *     filter: excludeAlreadySelected()
 *   }
 * })
 * ```
 *
 * @returns A Sanity filter function that excludes selected references
 */
export function excludeAlreadySelected() {
  return ({ document, parent }: { document: any; parent: any }) => {
    // parent is the array field itself
    // Extract all _ref values from already-selected references
    const selected =
      parent
        ?.filter((item: any) => item && item._ref) // Filter out null/undefined
        ?.map((item: any) => item._ref) // Extract _ref IDs
        .filter(Boolean) || []; // Remove any falsy values

    // If nothing is selected yet, show all items (except current document)
    if (selected.length === 0) {
      return {
        filter: '_id != $documentId',
        params: { documentId: document._id || '' },
      };
    }

    // Exclude already-selected items AND the current document (prevents self-reference)
    return {
      filter: '!(_id in $selected) && _id != $documentId',
      params: {
        selected,
        documentId: document._id || '',
      },
    };
  };
}

/**
 * Excludes already-selected items with custom additional filtering
 *
 * Useful when you need to filter by additional criteria (e.g., only show published items)
 *
 * Usage in schema:
 * ```typescript
 * import {excludeAlreadySelectedWithCustomFilter} from '../shared/referenceFilters'
 *
 * defineField({
 *   name: 'items',
 *   type: 'array',
 *   of: [{type: 'reference', to: [{type: 'event'}]}],
 *   options: {
 *     filter: excludeAlreadySelectedWithCustomFilter('publishingStatus == "published"')
 *   }
 * })
 * ```
 *
 * @param customFilter - Additional GROQ filter string to apply
 * @returns A Sanity filter function with custom filtering
 */
export function excludeAlreadySelectedWithCustomFilter(customFilter: string) {
  return ({ document, parent }: { document: any; parent: any }) => {
    const selected =
      parent
        ?.filter((item: any) => item && item._ref)
        ?.map((item: any) => item._ref)
        .filter(Boolean) || [];

    if (selected.length === 0) {
      return {
        filter: `_id != $documentId && ${customFilter}`,
        params: { documentId: document._id || '' },
      };
    }

    return {
      filter: `!(_id in $selected) && _id != $documentId && ${customFilter}`,
      params: {
        selected,
        documentId: document._id || '',
      },
    };
  };
}

/**
 * Helper to create consistent reference array field options
 *
 * Provides a convenient way to configure reference arrays with filtering
 *
 * Usage:
 * ```typescript
 * import {createReferenceArrayOptions} from '../shared/referenceFilters'
 *
 * defineField({
 *   name: 'items',
 *   type: 'array',
 *   of: [{type: 'reference', to: [{type: 'event'}]}],
 *   options: createReferenceArrayOptions({
 *     excludeSelected: true
 *   })
 * })
 * ```
 *
 * @param config - Configuration options
 * @param config.excludeSelected - Whether to hide already-selected items
 * @param config.customFilter - Optional additional GROQ filter string
 * @returns Options object for use in defineField
 */
export function createReferenceArrayOptions(config: {
  excludeSelected?: boolean;
  customFilter?: string;
}) {
  const options: any = {};

  if (config.excludeSelected) {
    if (config.customFilter) {
      options.filter = excludeAlreadySelectedWithCustomFilter(config.customFilter);
    } else {
      options.filter = excludeAlreadySelected();
    }
  }

  return options;
}
