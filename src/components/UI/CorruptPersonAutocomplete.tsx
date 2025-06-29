import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Search, AlertTriangle, Users } from 'lucide-react';
import { DatabaseService } from '../../lib/database';

interface CorruptPersonAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  onPersonSelect?: (person: { name: string; designation: string; area: string; reportCount: number }) => void;
}

interface PersonSuggestion {
  name: string;
  designation: string;
  area: string;
  reportCount: number;
  categories: string[];
}

export default function CorruptPersonAutocomplete({
  value,
  onChange,
  placeholder = "Enter corrupt person's full name...",
  error,
  label,
  required = false,
  onPersonSelect
}: CorruptPersonAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get all defaulters (people with multiple reports)
        const { data: defaulters, error } = await DatabaseService.getDefaulters(1); // Get all reports, including single ones
        
        if (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          return;
        }

        if (defaulters) {
          // Filter suggestions based on input
          const filtered = defaulters
            .filter(person => 
              person.corrupt_person_name.toLowerCase().includes(value.toLowerCase())
            )
            .map(person => ({
              name: person.corrupt_person_name,
              designation: person.designation,
              area: person.area_region,
              reportCount: person.report_count,
              categories: person.categories
            }))
            .slice(0, 8); // Limit to 8 suggestions

          setSuggestions(filtered);
        }
      } catch (error) {
        console.error('Error fetching person suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay closing to allow for click events
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  const handleSuggestionClick = (suggestion: PersonSuggestion) => {
    onChange(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    
    // Notify parent component about the selection
    if (onPersonSelect) {
      onPersonSelect({
        name: suggestion.name,
        designation: suggestion.designation,
        area: suggestion.area,
        reportCount: suggestion.reportCount
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getReportCountColor = (count: number) => {
    if (count >= 10) return 'bg-red-100 text-red-800 border-red-200';
    if (count >= 5) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (count >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, '-') || 'corrupt-person-input';

  return (
    <div className="relative">
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-sm font-medium transition-colors duration-200 mb-2 ${
            error ? 'text-red-600' : 'text-gray-700'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200">
          <User className="h-5 w-5" />
        </div>
        
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-10 py-3 rounded-xl border-2 bg-white/50 backdrop-blur-sm 
            transition-all duration-300 ease-out placeholder-gray-400 focus:outline-none focus:ring-0
            transform hover:scale-[1.02] focus:scale-[1.02]
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:bg-red-50/50' 
              : 'border-gray-200 focus:border-red-500 focus:bg-white hover:border-gray-300'
            }
          `}
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
          ) : (
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
        
        {/* Focus ring */}
        <div className={`
          absolute inset-0 rounded-xl pointer-events-none transition-all duration-300
          ${isFocused ? 'ring-4 ring-red-500/20' : ''}
        `} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Search className="h-4 w-4 text-red-500" />
              <span className="font-medium">
                {value ? `Suggestions for "${value}"` : 'Previously Reported Individuals'}
              </span>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-red-500 rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Searching database...</p>
            </div>
          )}
          
          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.name}-${suggestion.designation}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    w-full px-4 py-4 text-left hover:bg-red-50 transition-colors duration-150
                    flex items-start space-x-3 group border-l-4 border-transparent
                    ${index === highlightedIndex ? 'bg-red-50 border-red-500' : 'hover:border-red-200'}
                  `}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md transition-all duration-150 ${
                    index === highlightedIndex ? 'bg-red-600 scale-110' : 'bg-red-500'
                  }`}>
                    {suggestion.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  
                  {/* Person Details */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold transition-colors duration-150 truncate ${
                      index === highlightedIndex ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {suggestion.name}
                    </div>
                    <div className="text-sm text-gray-600 truncate mt-1">
                      {suggestion.designation}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {suggestion.area}
                    </div>
                    
                    {/* Categories */}
                    {suggestion.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestion.categories.slice(0, 2).map((category) => (
                          <span key={category} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                            {category.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {suggestion.categories.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">
                            +{suggestion.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Report Count Badge */}
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getReportCountColor(suggestion.reportCount)}`}>
                      {suggestion.reportCount} Report{suggestion.reportCount !== 1 ? 's' : ''}
                    </span>
                    
                    {suggestion.reportCount > 1 && (
                      <div className="flex items-center text-xs text-orange-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span className="font-medium">Repeat Offender</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No Results */}
          {!isLoading && suggestions.length === 0 && value.length >= 2 && (
            <div className="p-6 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">No Previous Reports Found</h3>
              <p className="text-xs text-gray-500">
                This person hasn't been reported before. You'll be the first to report them.
              </p>
            </div>
          )}
          
          {/* Help Text */}
          {!isLoading && value.length < 2 && (
            <div className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-700 mb-1">Start Typing to Search</h3>
              <p className="text-xs text-gray-500">
                Type at least 2 characters to see suggestions from previous reports
              </p>
            </div>
          )}
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Use arrow keys to navigate</span>
              <span className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 text-orange-500" />
                Data from live database
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 mt-2 animate-fade-in">{error}</p>
      )}
      
      {/* Helper text */}
      {!error && (
        <p className="text-sm text-gray-500 mt-2">
          Start typing to see suggestions from previously reported individuals
        </p>
      )}
    </div>
  );
}