import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface DateInputProps {
  value: string; // Expected format: YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Helper function to format date from YYYY-MM-DD to DD/MM/YYYY for display
const formatToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

// Helper function to parse DD/MM/YYYY to YYYY-MM-DD for internal value
const parseFromDisplay = (displayString: string): string => {
  if (!displayString) return '';
  const parts = displayString.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Validate if a string is a valid date in DD/MM/YYYY format
const isValidDisplayDate = (displayString: string): boolean => {
  if (!displayString) return false;
  const parts = displayString.split('/');
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return false;
  // Additional validation for actual date
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'DD/MM/YYYY',
  className = '',
  title,
  disabled = false,
  showIcon = true,
  size = 'md',
}) => {
  const { t } = useLanguage();
  const [displayValue, setDisplayValue] = useState(formatToDisplay(value));
  const [isEditing, setIsEditing] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Sync display value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(formatToDisplay(value));
    }
  }, [value, isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Allow only numbers and slashes
    input = input.replace(/[^\d/]/g, '');
    
    // Auto-insert slashes
    if (input.length === 2 && !input.includes('/')) {
      input = input + '/';
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = input + '/';
    }
    
    // Limit length
    if (input.length > 10) {
      input = input.slice(0, 10);
    }
    
    setDisplayValue(input);
    
    // If valid date, update the actual value
    if (input.length === 10 && isValidDisplayDate(input)) {
      const isoDate = parseFromDisplay(input);
      onChange(isoDate);
    }
  };

  const handleTextBlur = () => {
    setIsEditing(false);
    // Reset to last valid value if current input is invalid
    if (displayValue && !isValidDisplayDate(displayValue)) {
      setDisplayValue(formatToDisplay(value));
    }
  };

  const handleCalendarClick = () => {
    if (!disabled && hiddenInputRef.current) {
      hiddenInputRef.current.showPicker();
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setDisplayValue(formatToDisplay(newValue));
  };

  const sizeClasses = {
    sm: 'text-[11px] py-0.5 px-1',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-4',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 18,
  };

  return (
    <div className="relative">
      {/* Hidden native date picker for calendar popup */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleDatePickerChange}
        min={min}
        max={max}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
      
      {/* Visible text input with DD/MM/YYYY format */}
      <div className="relative flex items-center">
        {showIcon && (
          <button
            type="button"
            onClick={handleCalendarClick}
            disabled={disabled}
            className="absolute left-3 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer z-10"
            title={t('dateInput.openCalendar')}
          >
            <Calendar size={iconSizes[size]} />
          </button>
        )}
        <input
          ref={textInputRef}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onFocus={() => setIsEditing(true)}
          onBlur={handleTextBlur}
          placeholder={placeholder}
          title={title}
          disabled={disabled}
          className={`
            w-full
            ${showIcon ? 'pl-10' : 'pl-3'}
            pr-3
            ${sizeClasses[size]}
            bg-white border border-stone-200 rounded-lg
            focus:ring-2 focus:ring-teal-500 focus:border-transparent
            outline-none transition-all duration-200
            disabled:bg-stone-100 disabled:cursor-not-allowed
            ${className}
          `}
        />
        {/* Calendar button on right side for additional access */}
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute right-2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          title={t('dateInput.openCalendar')}
        >
          <Calendar size={iconSizes[size]} />
        </button>
      </div>
    </div>
  );
};

// Simple inline version for filter inputs (smaller)
export const DateInputSmall: React.FC<Omit<DateInputProps, 'size' | 'showIcon'>> = (props) => {
  const { t } = useLanguage();
  const [displayValue, setDisplayValue] = useState(formatToDisplay(props.value));
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(formatToDisplay(props.value));
  }, [props.value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/[^\d/]/g, '');
    
    if (input.length === 2 && !input.includes('/')) {
      input = input + '/';
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = input + '/';
    }
    
    if (input.length > 10) {
      input = input.slice(0, 10);
    }
    
    setDisplayValue(input);
    
    if (input.length === 10 && isValidDisplayDate(input)) {
      props.onChange(parseFromDisplay(input));
    } else if (input === '') {
      props.onChange('');
    }
  };

  const handleCalendarClick = () => {
    if (!props.disabled && hiddenInputRef.current) {
      hiddenInputRef.current.showPicker();
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={hiddenInputRef}
        type="date"
        value={props.value}
        onChange={(e) => {
          props.onChange(e.target.value);
          setDisplayValue(formatToDisplay(e.target.value));
        }}
        min={props.min}
        max={props.max}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
        title={t('dateInput.datePicker')}
      />
      <input
        type="text"
        value={displayValue}
        onChange={handleTextChange}
        onBlur={() => {
          if (displayValue && !isValidDisplayDate(displayValue)) {
            setDisplayValue(formatToDisplay(props.value));
          }
        }}
        placeholder="DD/MM/YYYY"
        title={props.title}
        disabled={props.disabled}
        className={`px-1 py-0.5 rounded border border-stone-200 bg-white focus:outline-none text-[11px] w-[72px] ${props.className || ''}`}
      />
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={props.disabled}
        className="ml-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
        title={t('dateInput.openCalendar')}
      >
        <Calendar size={10} />
      </button>
    </div>
  );
};

export default DateInput;
