import React, { useMemo, ReactNode } from 'react';
import { smartSearchWithProbabilities } from '../../../../utils/SoftMax';

interface SearchControllerProps<T> {
  items: T[];
  searchKeys: (keyof T)[];
  threshold?: number;
  searchQuery: string;
  children: (props: {
    filteredItems: T[];
    searchQuery: string;
    isSearching: boolean;
    probabilities?: Array<{ item: T; probability: number }>;
  }) => ReactNode;
}

const SearchController = <T,>({
  items,
  searchKeys,
  threshold = 0.05,
  searchQuery,
  children
}: SearchControllerProps<T>): JSX.Element => {
  const isSearching = !!searchQuery.trim();

  // MEMO: Prepare search strings from items with validation
  const searchStrings = useMemo(() => {
    return items.map(item => {
      const values = searchKeys.map(key => {
        const value = item[key];
        // Validate and convert to string safely
        return value != null ? String(value) : '';
      });
      return values.filter(Boolean).join(' '); // Remove empty values
    });
  }, [items, searchKeys]);

  // MEMO: Filter items based on search with softmax probabilities
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !isSearching) {
      return {
        filteredItems: items,
        probabilities: undefined
      };
    }

    try {
      // Validate search strings before passing to fuzzy search
      const validSearchStrings = searchStrings.filter(str => str && str.length > 0);
      
      if (validSearchStrings.length === 0) {
        return {
          filteredItems: items,
          probabilities: undefined
        };
      }

      const probabilityResults = smartSearchWithProbabilities(searchQuery, validSearchStrings);
      
      const itemsWithProbabilities = probabilityResults
        .map((result, index) => ({
          item: items[index],
          probability: result.probability
        }))
        .filter(result => result.probability >= threshold && result.item != null)
        .sort((a, b) => b.probability - a.probability);

      return {
        filteredItems: itemsWithProbabilities.map(result => result.item),
        probabilities: itemsWithProbabilities
      };
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple string filter on error
      const queryLower = searchQuery.toLowerCase();
      const fallbackFiltered = items.filter(item => 
        searchKeys.some(key => {
          const value = item[key];
          return value != null && String(value).toLowerCase().includes(queryLower);
        })
      );
      
      return {
        filteredItems: fallbackFiltered,
        probabilities: undefined
      };
    }
  }, [searchQuery, items, searchStrings, searchKeys, isSearching, threshold]);

  return (
    <>
      {children({
        filteredItems: searchResults.filteredItems,
        searchQuery,
        isSearching,
        probabilities: searchResults.probabilities
      })}
    </>
  );
};

export default SearchController;