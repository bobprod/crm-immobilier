import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { semanticSearchApi, SemanticSearchResult } from '@/shared/utils/quick-wins-api';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { useRouter } from 'next/router';

interface SemanticSearchBarProps {
  placeholder?: string;
  onResultSelect?: (result: SemanticSearchResult) => void;
  searchType?: 'properties' | 'prospects' | 'appointments' | 'all';
}

export function SemanticSearchBar({
  placeholder = 'Rechercher... (ex: appartement vue mer La Marsa)',
  onResultSelect,
  searchType = 'all',
}: SemanticSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await semanticSearchApi.search({
        query: searchQuery,
        searchType,
        limit: 10,
      });
      setResults(searchResults);
      setIsOpen(true);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (partial: string) => {
    if (!partial || partial.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const sugs = await semanticSearchApi.getSuggestions(partial);
      setSuggestions(sugs);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous timers
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search
    debounceTimer.current = setTimeout(() => {
      performSearch(newQuery);
      fetchSuggestions(newQuery);
    }, 500);
  };

  const handleResultClick = (result: SemanticSearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default navigation behavior
      if (result.type === 'property') {
        router.push(`/properties/${result.id}`);
      } else if (result.type === 'prospect') {
        router.push(`/prospects/${result.id}`);
      } else if (result.type === 'appointment') {
        router.push(`/appointments/${result.id}`);
      }
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property':
        return '🏠';
      case 'prospect':
        return '👤';
      case 'appointment':
        return '📅';
      default:
        return '📄';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return 'Propriété';
      case 'prospect':
        return 'Prospect';
      case 'appointment':
        return 'Rendez-vous';
      default:
        return 'Autre';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
        )}
      </div>

      {isOpen && (suggestions.length > 0 || results.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-[500px] overflow-auto shadow-lg">
          <CardContent className="p-0">
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-b p-2">
                <div className="text-xs text-gray-500 px-2 py-1">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    <Search className="inline h-3 w-3 mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-gray-500 px-2 py-1">Résultats</div>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 hover:bg-gray-100 rounded mb-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getTypeIcon(result.type)}</span>
                          <span className="font-medium">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        {result.relevanceScore}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.length === 0 && suggestions.length === 0 && query.length >= 3 && !isLoading && (
              <div className="p-4 text-center text-gray-500">
                Aucun résultat trouvé
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
