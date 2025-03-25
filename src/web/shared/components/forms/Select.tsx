import React, { forwardRef } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components v5.3.6

import { ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';

const DEFAULT_PLACEHOLDER_TEXT = 'Select an option';

/**
 * TypeScript interface for select options
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * TypeScript interface for Select component props
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label?: string;
  options: Array<SelectOption>;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Container for the select field and its label
 */
const SelectContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  width: 100%;
`;

/**
 * Label for the select field
 */
const SelectLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.sm};
  font-weight: ${({ theme }: { theme: ThemeType }) => theme.fonts.weight.medium};
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.error};
    margin-left: ${({ theme }: { theme: ThemeType }) => theme.spacing.xxs};
  }
`;

/**
 * Styled select element
 */
const StyledSelect = styled.select<{ hasError?: boolean; disabled?: boolean }>`
  width: 100%;
  height: ${({ theme }: { theme: ThemeType }) => theme.sizes.inputHeight};
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs} ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.md};
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  background-color: ${props => props.disabled ? ({ theme }: { theme: ThemeType }) => theme.colors.input.disabledBackground : ({ theme }: { theme: ThemeType }) => theme.colors.input.background};
  border: 1px solid ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.input.errorBorder : ({ theme }: { theme: ThemeType }) => theme.colors.input.border};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.md};
  transition: all 0.2s ease-in-out;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }: { theme: ThemeType }) => theme.spacing.sm} center;
  background-size: 16px;

  &:hover {
    border-color: ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.input.errorBorder : ({ theme }: { theme: ThemeType }) => theme.colors.input.focusBorder};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.input.errorBorder : ({ theme }: { theme: ThemeType }) => theme.colors.input.focusBorder};
    box-shadow: 0 0 0 2px ${({ theme }: { theme: ThemeType }) => theme.colors.primary.main}10;
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.input.disabledText};
  }
`;

/**
 * A customizable select component that supports different states and validation
 */
const Select: React.FC<SelectProps> = forwardRef<HTMLSelectElement, SelectProps>(({
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  placeholder,
  className,
  ...rest
}, ref) => {
  // Get form context if component is used within a Form component
  const formContext = useFormContext();

  // Determine if the select should show an error state
  const hasError = !!error;

  // Generate a unique ID for the select if not provided
  const selectId = `select-${name}`;

  // Handle change events and propagate to parent component or form context
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(event);
    }
    if (formContext) {
      formContext.handleChange(event);
    }
  };

  // Handle blur events and propagate to parent component or form context
  const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    if (onBlur) {
      onBlur(event);
    }
    if (formContext) {
      formContext.handleBlur(event);
    }
  };

  return (
    <SelectContainer className={className}>
      {label && (
        <SelectLabel htmlFor={selectId} required={required}>
          {label}
        </SelectLabel>
      )}
      <StyledSelect
        id={selectId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        hasError={hasError}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={hasError}
        ref={ref}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      {hasError && <FormError error={error} />}
    </SelectContainer>
  );
});

export default Select;
export type { SelectProps };
export type { SelectOption };