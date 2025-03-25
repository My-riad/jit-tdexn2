import React, { useState, useEffect, useRef } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import ReactDatePicker from 'react-datepicker'; // react-datepicker ^4.8.0

import 'react-datepicker/dist/react-datepicker.css';
import { theme } from '../../styles/theme'; // Import theme variables for consistent styling
import { FormError } from './FormError'; // Import error display component for form validation errors
import { useFormContext } from './Form'; // Import hook to access form context for integration with Form component
import { formatDate, parseDate, DATE_FORMATS } from '../../../common/utils/dateTimeUtils'; // Import date formatting and parsing utilities

/**
 * Props for the DatePicker component
 */
export interface DatePickerProps {
  name: string;
  label?: string;
  value: Date | string | null;
  onChange: (date: Date | null) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholderText?: string;
  className?: string;
  [key: string]: any;
}

const DEFAULT_PLACEHOLDER = 'Select date...';

/**
 * Container for the date picker field and its label
 */
const DatePickerContainer = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.md};
  width: 100%;
`;

/**
 * Label for the date picker field
 */
const DatePickerLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${theme.colors.semantic.error};
    margin-left: ${theme.spacing.xxs};
  }
`;

/**
 * Styled date picker component
 */
const StyledDatePicker = styled(ReactDatePicker)<{ hasError?: boolean; disabled?: boolean }>`
  width: 100%;
  height: 40px;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSize.md};
  color: ${theme.colors.text.primary};
  background-color: ${props => props.disabled ? theme.colors.background.secondary : theme.colors.background.primary};
  border: 1px solid ${props => props.hasError ? theme.colors.semantic.error : theme.colors.border.medium};
  border-radius: ${theme.borders.radius.md};
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${props => props.hasError ? theme.colors.semantic.error : theme.colors.primary.main};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? theme.colors.semantic.error : theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${theme.colors.primary.light};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: ${theme.colors.text.secondary};
    opacity: 0.7;
  }
`;

/**
 * Custom container for the calendar dropdown
 */
const CalendarContainer = styled.div`
  border: 1px solid ${theme.colors.border.medium};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.elevation.medium};
  background-color: ${theme.colors.background.primary};
  z-index: ${theme.zIndex.dropdown};
`;

/**
 * A customizable date picker component that supports different states and validation
 */
const DatePicker: React.FC<DatePickerProps> = (props) => {
  // LD1: Destructure props including name, label, value, onChange, onBlur, error, disabled, required, minDate, maxDate, placeholderText, and other props
  const {
    name,
    label,
    value,
    onChange,
    onBlur,
    error,
    disabled,
    required,
    minDate,
    maxDate,
    placeholderText = DEFAULT_PLACEHOLDER,
    className,
    ...rest
  } = props;

  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();

  // LD1: Set up state for selected date using useState
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // LD1: Set up ref for the date picker input element
  const datePickerRef = useRef<ReactDatePicker>(null);

  // LD1: Determine if the input should show an error state
  const hasError = !!error;

  // LD1: Generate a unique ID for the input if not provided
  const inputId = `date-picker-${name}`;

  // LD1: Handle date change events and propagate to parent component or form context
  const handleChange = (date: Date | null) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
    if (formContext) {
      formContext.setFieldValue(name, date);
    }
  };

  // LD1: Handle blur events and propagate to parent component or form context
  const handleBlurEvent = () => {
    if (onBlur) {
      onBlur();
    }
    if (formContext) {
      formContext.handleBlur({ target: { name } } as any);
    }
  };

  // LD1: Format the date value for display
  const formattedValue = value ? formatDate(value, DATE_FORMATS.SHORT) : '';

  useEffect(() => {
    if (value) {
      const parsedDate = parseDate(value, DATE_FORMATS.SHORT);
      setSelectedDate(parsedDate);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // LD1: Render the DatePickerContainer component with appropriate props
  return (
    <DatePickerContainer className={className}>
      {/* LD1: Render label if provided */}
      {label && (
        <DatePickerLabel htmlFor={inputId} required={required}>
          {label}
        </DatePickerLabel>
      )}

      {/* LD1: Render the StyledDatePicker component with appropriate props and event handlers */}
      <StyledDatePicker
        id={inputId}
        name={name}
        selected={selectedDate}
        onChange={handleChange}
        onBlur={handleBlurEvent}
        dateFormat={DATE_FORMATS.SHORT}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        disabled={disabled}
        required={required}
        isClearable
        showYearDropdown
        scrollableYearDropdown
        hasError={hasError}
        autoComplete="off"
        ref={datePickerRef}
        {...rest}
        calendarContainer={CalendarContainer}
      />

      {/* LD1: Render FormError component if there's an error */}
      {error && <FormError error={error} />}
    </DatePickerContainer>
  );
};

export default DatePicker;

export type { DatePickerProps };