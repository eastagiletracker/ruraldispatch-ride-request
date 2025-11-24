import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchableElement } from '@/types';

interface SearchProps<T extends SearchableElement> {
  searchElementName: string;
  fetchMatchesFn: (searchTerm: string) => Promise<T[]>;
  placeHolderText: string;
  renderElementFn: (element: T, handleElementSelect: (element: T) => void) => React.JSX.Element;
}

export default function Search<T extends SearchableElement>({
  searchElementName,
  fetchMatchesFn,
  placeHolderText,
  renderElementFn,
}: SearchProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredElements, setFilteredElements] = useState<T[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track the latest request to avoid race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(
    async (searchTerm: string): Promise<void> => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Empty search term - clear results immediately
      if (searchTerm.trim() === '') {
        setFilteredElements([]);
        setIsDropdownOpen(false);
        setError('');
        setIsLoading(false);
        return;
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError('');
      try {
        const filtered = await fetchMatchesFn(searchTerm);

        // Only update state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setFilteredElements(filtered);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        // Only handle errors if this request wasn't cancelled
        if (!controller.signal.aborted) {
          console.error('Search error:', err);
          setError(`Failed to search for ${searchElementName}s`);
          setFilteredElements([]);
        }
      } finally {
        // Only update loading state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [fetchMatchesFn, searchElementName]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleElementSelect = (element: T): void => {
    const displayName =
      'fullName' in element
        ? element.fullName
        : 'displayName' in element
          ? element.displayName
          : '';
    setSearchTerm(displayName);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = (): void => {
    if (filteredElements.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  // Trigger search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor="search-input" className="mb-2 block text-sm font-medium text-gray-700">
        Search for existing {searchElementName}
      </label>
      <div className="relative">
        <input
          id="search-input"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeHolderText}
          className="focus:ring-primary-500 focus:border-primary-500 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
            <div className="border-primary-600 h-4 w-4 animate-spin rounded-full border-b-2"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {error ? (
            <div className="border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-600">
              {error}
            </div>
          ) : filteredElements.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No {searchElementName}s found</div>
          ) : (
            filteredElements.map((element) => renderElementFn(element, handleElementSelect))
          )}
        </div>
      )}
    </div>
  );
}
