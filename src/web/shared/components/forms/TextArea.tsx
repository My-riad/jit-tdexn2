import React, { useState, useCallback } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components v5.3.6

import { ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { FormContextType, useFormContext } from './Form';

/**
 * Props for the TextArea component
 */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * Default number of rows if not specified
 */
const DEFAULT_ROWS = 4;

/**
 * Container for the textarea field and its label
 */
const TextAreaContainer = styled.div`
  position: relative;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  width: 100%;
`;

/**
 * Label for the textarea field
 */
interface TextAreaLabelProps {
  required?: boolean;
}

const TextAreaLabel = styled.label<TextAreaLabelProps>`
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
 * Styled textarea element
 */
interface StyledTextAreaProps {
  hasError?: boolean;
  disabled?: boolean;
}

const StyledTextArea = styled.textarea<StyledTextAreaProps>`
  width: 100%;
  min-height: 100px;
  padding: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs} ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.md};
  font-family: ${({ theme }: { theme: ThemeType }) => theme.fonts.family.primary};
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  background-color: ${props => props.disabled ? ({ theme }: { theme: ThemeType }) => theme.colors.input.disabledBackground : ({ theme }: { theme: ThemeType }) => theme.colors.input.background};
  border: 1px solid ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.input.errorBorder : ({ theme }: { theme: ThemeType }) => theme.colors.input.border};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.md};
  resize: vertical;
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
 * A customizable textarea component that supports different states and validation
 */
const TextArea: React.FC<TextAreaProps> = (props) => {
  // LD1: Destructure props including name, label, value, onChange, onBlur, error, disabled, required, placeholder, rows, and other HTML textarea attributes
  const {
    name,
    label,
    value,
    onChange,
    onBlur,
    error: propError,
    disabled,
    required,
    placeholder,
    rows = DEFAULT_ROWS,
    className,
    ...rest
  } = props;

  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();

  // LD1: Determine if the textarea should show an error state
  const hasError = !!(propError || (formContext && formContext.errors[name] && formContext.touched[name]));

  // LD1: Generate a unique ID for the textarea if not provided
  const [textAreaId] = useState(() => `textarea-${Math.random().toString(36).substring(2)}`);

  // LD1: Handle change events and propagate to parent component or form context
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (formContext) {
        formContext.handleChange(event);
      }
      onChange(event);
    },
    [onChange, formContext]
  );

  // LD1: Handle blur events and propagate to parent component or form context
  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      if (formContext && onBlur) {
        formContext.handleBlur(event);
      }
      onBlur?.(event);
    },
    [onBlur, formContext]
  );

  // LD1: Render the TextAreaContainer component with appropriate props
  return (
    <TextAreaContainer className={className}>
      {/* LD1: Render label if provided */}
      {label && (
        <TextAreaLabel htmlFor={textAreaId} required={required}>
          {label}
        </TextAreaLabel>
      )}
      {/* LD1: Render the StyledTextArea component with appropriate props and event handlers */}
      <StyledTextArea
        id={textAreaId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={rows}
        hasError={hasError}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={hasError}
        {...rest}
      />
      {/* LD1: Render FormError component if there's an error */}
      {hasError && (
        <FormError error={propError || (formContext?.errors[name] as string)} />
      )}
    </TextAreaContainer>
  );
};

// LD2: Export default of the TextArea component
export default TextArea;

// LD2: Export TypeScript interface for TextArea component props
export type { TextAreaProps };