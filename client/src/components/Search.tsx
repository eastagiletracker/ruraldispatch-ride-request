import { useState, useEffect, useRef, MouseEvent } from 'react';
import type { SearchableElement } from '@/types';

interface SearchProps<T extends SearchableElement> {
    searchElementName: string;
    fetchMatchesFn: (searchTerm: string) => Promise<T[]>;
    placeHolderText: string;
    renderElementFn: (element: T, handleElementSelect: (element: T) => void) => JSX.Element;
}

export default function Search<T extends SearchableElement>({
    searchElementName,
    fetchMatchesFn,
    placeHolderText,
    renderElementFn
}: SearchProps<T>) {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredElements, setFilteredElements] = useState<T[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter elements based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredElements([]);
            setIsDropdownOpen(false);
        } else {
            setElementsToMatchesAsync(searchTerm);
        }
    }, [searchTerm]);

    // Possible race conditions if network lags?
    async function setElementsToMatchesAsync(searchTerm: string): Promise<void> {
        const filtered = await fetchMatchesFn(searchTerm);
        setFilteredElements(filtered);
        setIsDropdownOpen(filtered.length > 0);
    }

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
        const displayName = 'fullName' in element ? element.fullName :
                          'displayName' in element ? element.displayName : '';
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

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for existing {searchElementName}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeHolderText}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredElements.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                            No elements found
                        </div>
                    ) : (
                        filteredElements.map(element => renderElementFn(element, handleElementSelect))
                    )}
                </div>
            )}

        </div>
    );
} 