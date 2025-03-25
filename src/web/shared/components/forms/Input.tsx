import React, { forwardRef } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components v5.3.6
import { ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';

/**
 * @dev DEFAULT_INPUT_TYPE - Default input type if not specified
 */
const DEFAULT_INPUT_TYPE = 'text';

/**
 * @dev InputProps - TypeScript interface for Input component props
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  type?: string;
  label?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * @dev InputContainer - Container for the input field and its label
 */
const InputContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  width: 100%;
`;

/**
 * @dev InputLabel - Label for the input field
 */
const InputLabel = styled.label<{ required?: boolean }>`
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
 * @dev StyledInput - Styled input element
 */
const StyledInput = styled.input<{ hasError?: boolean; disabled?: boolean }>`
  width: 100%;
  height: ${({ theme }: { theme: ThemeType }) => theme.sizes.inputHeight};
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs} ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.md};
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  background-color: ${props => props.disabled ? ({ theme }: { theme: ThemeType }) => theme.colors.input.disabledBackground : ({ theme }: { theme: ThemeType }) => theme.colors.input.background};
  border: 1px solid ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.input.errorBorder : ({ theme }: { theme: ThemeType }) => theme.colors.input.border};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.md};
  transition: all 0.2s ease-in-out;

  &::placeholder {
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.input.placeholder};
  }

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
 * @dev Input - A customizable input component that supports different states and validation
 * @param props - InputProps
 * @returns Rendered input component
 */
const Input: React.FC<InputProps> = forwardRef<HTMLInputElement, InputProps>(({
  name,
  type = DEFAULT_INPUT_TYPE,
  label,
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
  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();

  // LD1: Determine if the input should show an error state
  const hasError = !!error;

  // LD1: Generate a unique ID for the input if not provided
  const inputId = `input-${name}`;

  // LD1: Handle change events and propagate to parent component or form context
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
    if (formContext) {
      formContext.handleChange(event);
    }
  };

  // LD1: Handle blur events and propagate to parent component or form context
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(event);
    }
    if (formContext) {
      formContext.handleBlur(event);
    }
  };

  // LD1: Render the InputContainer component with appropriate props
  return (
    <InputContainer className={className}>
      {/* LD1: Render label if provided */}
      {label && (
        <InputLabel htmlFor={inputId} required={required}>
          {label}
        </InputLabel>
      )}
      {/* LD1: Render the StyledInput component with appropriate props and event handlers */}
      <StyledInput
        ref={ref}
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        hasError={hasError}
        aria-invalid={hasError}
        aria-required={required}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        {...rest}
      />
      {/* LD1: Render FormError component if there's an error */}
      {hasError && (
        <FormError error={error} id={`${inputId}-error`} />
      )}
    </InputContainer>
  );
});

export default Input;