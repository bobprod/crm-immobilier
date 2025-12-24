import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { smartFormsApi, FormSuggestion } from '@/shared/utils/quick-wins-api';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: string;
  formType?: 'prospect' | 'property' | 'appointment';
  onSuggestionSelect?: (suggestion: FormSuggestion) => void;
  debounceMs?: number;
}

export function SmartInput({
  fieldName,
  formType = 'prospect',
  onSuggestionSelect,
  debounceMs = 300,
  value,
  onChange,
  ...props
}: SmartInputProps) {
  const [suggestions, setSuggestions] = useState<FormSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await smartFormsApi.getFieldSuggestions({
        fieldName,
        partialValue: inputValue,
        formType,
      });
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange?.(e);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, debounceMs);
  };

  const handleSuggestionSelect = (suggestion: FormSuggestion) => {
    // Create a synthetic event
    const syntheticEvent = {
      target: { value: suggestion.value },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange?.(syntheticEvent);
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            {...props}
            value={value}
            onChange={handleInputChange}
            autoComplete="off"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Aucune suggestion</CommandEmpty>
            <CommandGroup>
              {suggestions.map((suggestion, index) => (
                <CommandItem
                  key={index}
                  value={suggestion.value}
                  onSelect={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{suggestion.label}</span>
                  {suggestion.frequency && (
                    <span className="text-xs text-gray-500 ml-2">
                      {suggestion.frequency}x
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
