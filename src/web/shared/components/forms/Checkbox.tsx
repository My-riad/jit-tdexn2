import React, { InputHTMLAttributes, useContext, useId } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import { theme } from '../../styles/theme';
import FormError from './FormError';
import { FormContext, useFormContext } from './Form';

/**
 * @dev LD1: Extends native input attributes
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  id?: string;
  name: string;
  checked: boolean;
  label?: string | React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const CheckboxContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const HiddenCheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
`;

const StyledCheckbox = styled.div<{ checked: boolean; error?: boolean; disabled?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border-radius: ${theme.borders.radius.sm};
  border: ${props => props.error ? `${theme.borders.width.thin} solid ${theme.colors.semantic.error}` : `${theme.borders.width.thin} solid ${props.checked ? theme.colors.primary.blue : theme.colors.neutral.mediumGray}`};
  background: ${props => props.checked ? theme.colors.primary.blue : theme.colors.neutral.white};
  transition: all 0.2s ease;
`;

const CheckMark = styled.div<{ checked: boolean }>`
  width: 10px;
  height: 6px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: ${props => props.checked ? 'rotate(-45deg)' : 'rotate(-45deg) scale(0)'};
  opacity: ${props => props.checked ? 1 : 0};
  transition: all 0.2s ease;
  margin-bottom: 2px;
`;

const Label = styled.label<{ error?: boolean; required?: boolean }>`
  margin-left: ${theme.spacing.xs};
  font-size: ${theme.fonts.size.body};
  color: ${props => props.error ? theme.colors.semantic.error : theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${theme.colors.semantic.error};
    margin-left: ${theme.spacing.xxs};
  }
`;

/**
 * @dev A customizable checkbox component that supports different states and validation
 * @param {CheckboxProps} props - props
 * @returns {JSX.Element} Rendered checkbox component
 */
const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked,
  label,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  className,
  ...rest
}) => {
  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext() as FormContext;

  // LD1: Generate a unique ID for the input if not provided
  const generatedId = useId();
  const inputId = id || `checkbox-${generatedId}`;

  // LD1: Determine if the checkbox should show an error state
  const hasError = error !== undefined;

  // LD1: Handle change events and propagate to parent component or form context
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
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

  // LD1: Render the CheckboxContainer component with appropriate props
  return (
    <CheckboxContainer className={className} disabled={disabled}>
      {/* LD1: Render the hidden native checkbox input for accessibility */}
      <HiddenCheckboxInput
        type="checkbox"
        id={inputId}
        name={name}
        checked={checked}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        aria-invalid={hasError}
        {...rest}
      />
      {/* LD1: Render the StyledCheckbox component with visual styling */}
      <StyledCheckbox checked={checked} error={hasError} disabled={disabled}>
        {/* LD1: Render the CheckMark component that appears when checked */}
        <CheckMark checked={checked} />
      </StyledCheckbox>
      {/* LD1: Render label if provided */}
      {label && (
        <Label htmlFor={inputId} error={hasError} required={required}>
          {label}
        </Label>
      )}
      {/* LD1: Render FormError component if there's an error */}
      {hasError && <FormError error={error} />}
    </CheckboxContainer>
  );
};

// LD2: Export form context for use in custom form components
export default Checkbox;

// LD2: Export TypeScript interface for Form component props
export type { CheckboxProps };