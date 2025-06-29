import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Search } from 'lucide-react';
import { filterLocations } from '../../lib/indianLocations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Enter city or state name...",
  error,
  label,
  required = false
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = filterLocations(value, 8);
    setSuggestions(filtered);
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
    if (suggestions.length === 0) {
      setSuggestions(filterLocations('', 8));
    }
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

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
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

  const inputId = label?.toLowerCase().replace(/\s+/g, '-') || 'location-input';

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
          <MapPin className="h-5 w-5" />
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
          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {/* Focus ring */}
        <div className={`
          absolute inset-0 rounded-xl pointer-events-none transition-all duration-300
          ${isFocused ? 'ring-4 ring-red-500/20' : ''}
        `} />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-fade-in"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Search className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                {value ? `Suggestions for "${value}"` : 'Popular Indian Cities & States'}
              </span>
            </div>
          </div>
          
          {/* Suggestions */}
          <div className="py-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150
                  flex items-center space-x-3 group
                  ${index === highlightedIndex ? 'bg-blue-50 border-r-4 border-blue-500' : ''}
                `}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <MapPin className={`h-4 w-4 transition-colors duration-150 ${
                  index === highlightedIndex ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className={`font-medium transition-colors duration-150 ${
                    index === highlightedIndex ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {suggestion}
                  </div>
                  {/* Highlight matching text */}
                  {value && suggestion.toLowerCase().includes(value.toLowerCase()) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.toLowerCase().startsWith(value.toLowerCase()) ? 'Starts with' : 'Contains'} "{value}"
                    </div>
                  )}
                </div>
                {index === highlightedIndex && (
                  <ChevronDown className="h-4 w-4 text-blue-500 rotate-[-90deg]" />
                )}
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Type to search or use arrow keys to navigate
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
          Select from Indian cities and states or type your own location
        </p>
      )}
    </div>
  );
}