import React, { useState, useEffect, useRef } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import ReactTimePicker from 'react-time-picker'; // react-time-picker ^5.2.0

import { theme } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';
import { formatTime, parseDateTime, TIME_FORMATS } from '../../../common/utils/dateTimeUtils';

const DEFAULT_PLACEHOLDER = 'Select time...';
const DEFAULT_FORMAT = 'h:mm a';

/**
 * TypeScript interface for TimePicker component props
 */
export interface TimePickerProps {
  name: string;
  label?: string;
  value?: string | null;
  onChange: (time: string | null) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  minTime?: string;
  maxTime?: string;
  placeholderText?: string;
  className?: string;
  format?: string;
  is24Hour?: boolean;
  // LD1: Extends native react-time-picker props
  [key: string]: any;
}

/**
 * Styled container for the time picker field and its label
 */
const TimePickerContainer = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.md};
  width: 100%;
`;

/**
 * Styled label for the time picker field
 */
const TimePickerLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.fonts.size.sm};
  font-weight: ${theme.fonts.weight.medium};
  color: ${theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => (props.required ? '"*"' : 'none')};
    color: ${theme.colors.semantic.error};
    margin-left: ${theme.spacing.xxs};
  }
`;

/**
 * Styled time picker component
 */
const StyledTimePicker = styled(ReactTimePicker)<{ hasError?: boolean; disabled?: boolean }>`
  width: 100%;
  height: 40px;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.fonts.size.md};
  color: ${theme.colors.text.primary};
  background-color: ${props =>
    props.disabled ? theme.colors.input.disabledBackground : theme.colors.input.background};
  border: 1px solid
    ${props => (props.hasError ? theme.colors.input.errorBorder : theme.colors.input.border)};
  border-radius: ${theme.borders.radius.md};
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${props =>
      props.hasError ? theme.colors.input.errorBorder : theme.colors.input.focusBorder};
  }

  &:focus {
    outline: none;
    border-color: ${props =>
      props.hasError ? theme.colors.input.errorBorder : theme.colors.input.focusBorder};
    box-shadow: 0 0 0 2px ${theme.colors.primary.main}10;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  &::placeholder {
    color: ${theme.colors.input.placeholder};
    opacity: 0.7;
  }
`;

/**
 * Custom container for the time dropdown
 */
const TimePickerDropdown = styled.div`
  border: 1px solid ${theme.colors.border.medium};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.elevation.medium};
  background-color: ${theme.colors.background.primary};
  z-index: ${theme.zIndex.dropdown};
`;

/**
 * A customizable time picker component that supports different states and validation
 */
const TimePicker: React.FC<TimePickerProps> = (props: TimePickerProps) => {
  // LD1: Destructure props including name, label, value, onChange, onBlur, error, disabled, required, placeholderText, and other props
  const {
    name,
    label,
    value,
    onChange,
    onBlur,
    error,
    disabled,
    required,
    minTime,
    maxTime,
    placeholderText = DEFAULT_PLACEHOLDER,
    className,
    format = DEFAULT_FORMAT,
    is24Hour,
    ...rest
  } = props;

  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();

  // LD1: Set up state for selected time using useState
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  // LD1: Set up ref for the time picker input element
  const timePickerRef = useRef<ReactTimePicker>(null);

  // LD1: Determine if the input should show an error state
  const hasError = !!error;

  // LD1: Generate a unique ID for the input if not provided
  const inputId = `time-picker-${name}`;

  // LD1: Handle time change events and propagate to parent component or form context
  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    const formattedTime = time ? formatTime(time, format) : null;
    onChange(formattedTime);
    if (formContext) {
      formContext.setFieldValue(name, formattedTime);
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

  // LD1: Format the time value for display
  const formattedValue = value ? formatTime(value, format) : null;

  // LD1: Apply appropriate ARIA attributes for accessibility
  return (
    <TimePickerContainer className={className}>
      {label && (
        <TimePickerLabel htmlFor={inputId} required={required}>
          {label}
        </TimePickerLabel>
      )}
      <StyledTimePicker
        ref={timePickerRef}
        id={inputId}
        name={name}
        value={selectedTime || formattedValue || null}
        onChange={handleTimeChange}
        onBlur={handleBlurEvent}
        disabled={disabled}
        clearIcon={null}
        clockIcon={null}
        placeholder={placeholderText}
        format={format}
        className="time-picker"
        hasError={hasError}
        {...rest}
      />
      {hasError && <FormError error={error} />}
    </TimePickerContainer>
  );
};

export default TimePicker;

// LD2: Export TypeScript interface for TimePicker component props
export type { TimePickerProps };