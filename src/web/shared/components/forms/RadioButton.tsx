import React, { InputHTMLAttributes, useCallback, useId } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';

/**
 * Props for the RadioButton component
 */
export interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  label?: string | React.ReactNode;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Container for the radio button and its label
 */
const RadioButtonContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.sm};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

/**
 * Hidden native radio input for accessibility
 */
const HiddenRadioInput = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  height: 0;
  width: 0;
  pointer-events: none;
`;

/**
 * Styled visual representation of the radio button
 */
const StyledRadioButton = styled.div<{ checked?: boolean; error?: string; disabled?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.round};
  border: ${props => props.error
    ? `${({ theme }: { theme: ThemeType }) => theme.borders.width.thin} solid ${({ theme }: { theme: ThemeType }) => theme.colors.semantic.error}`
    : `${({ theme }: { theme: ThemeType }) => theme.borders.width.thin} solid ${props.checked ? ({ theme }: { theme: ThemeType }) => theme.colors.primary.blue : ({ theme }: { theme: ThemeType }) => theme.colors.neutral.mediumGray}`};
  background: ${({ theme }: { theme: ThemeType }) => theme.colors.neutral.white};
  transition: all 0.2s ease;
`;

/**
 * Inner dot that appears when radio button is checked
 */
const RadioDot = styled.div<{ checked?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.round};
  background: ${({ theme }: { theme: ThemeType }) => theme.colors.primary.blue};
  transform: ${props => props.checked ? 'scale(1)' : 'scale(0)'};
  opacity: ${props => props.checked ? 1 : 0};
  transition: all 0.2s ease;
`;

/**
 * Label for the radio button
 */
const Label = styled.label<{ error?: string; required?: boolean }>`
  margin-left: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.md};
  color: ${props => props.error ? ({ theme }: { theme: ThemeType }) => theme.colors.semantic.error : ({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  position: relative;

  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.semantic.error};
    margin-left: ${({ theme }: { theme: ThemeType }) => theme.spacing.xxs};
  }
`;

/**
 * A customizable radio button component that supports different states and validation
 */
const RadioButton: React.FC<RadioButtonProps> = (props) => {
  // LD1: Destructure props including id, name, value, checked, label, onChange, onBlur, error, disabled, required, and other HTML input attributes
  const {
    id,
    name,
    value,
    checked,
    label,
    onChange,
    onBlur,
    error,
    disabled,
    required,
    className,
    ...rest
  } = props;

  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();

  // LD1: Generate a unique ID for the input if not provided
  const generatedId = useId();
  const inputId = id || `radio-${generatedId}`;

  // LD1: Determine if the radio button should show an error state
  const hasError = !!error;

  // LD1: Handle change events and propagate to parent component or form context
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (formContext && formContext.handleChange) {
        formContext.handleChange(event);
      }
      onChange(event);
    },
    [formContext, onChange]
  );

  // LD1: Handle blur events and propagate to parent component or form context
  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (formContext && formContext.handleBlur) {
        formContext.handleBlur(event);
      }
      onBlur?.(event);
    },
    [formContext, onBlur]
  );

  // LD1: Render the RadioButtonContainer component with appropriate props
  return (
    <RadioButtonContainer className={className} disabled={disabled}>
      {/* LD1: Render the hidden native radio input for accessibility */}
      <HiddenRadioInput
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        aria-invalid={hasError}
        {...rest}
      />
      {/* LD1: Render the StyledRadioButton component with visual styling */}
      <StyledRadioButton checked={checked} error={error} disabled={disabled}>
        {/* LD1: Render the RadioDot component that appears when checked */}
        <RadioDot checked={checked} />
      </StyledRadioButton>
      {/* LD1: Render label if provided */}
      {label && (
        <Label htmlFor={inputId} error={error} required={required}>
          {label}
        </Label>
      )}
      {/* LD1: Render FormError component if there's an error */}
      {hasError && <FormError error={error} />}
    </RadioButtonContainer>
  );
};

export default RadioButton;
export type { RadioButtonProps };