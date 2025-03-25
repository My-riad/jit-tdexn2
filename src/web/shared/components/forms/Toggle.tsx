import React, { useState, useCallback } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components v5.3.6

import { ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';

/**
 * Props for the Toggle component
 */
interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  name: string;
  checked?: boolean;
  label?: string | React.ReactNode;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Container for the toggle switch and its label
 */
const ToggleContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
  width: 100%;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

/**
 * Wrapper for the toggle switch elements
 */
const ToggleWrapper = styled.div<{ disabled?: boolean }>`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
`;

/**
 * Hidden native checkbox input for accessibility
 */
const HiddenInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

/**
 * Background track for the toggle switch
 */
const ToggleTrack = styled.div<{ checked?: boolean; hasError?: boolean; disabled?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props =>
    props.checked
      ? ({ theme }: { theme: ThemeType }) => theme.colors.semantic.success
      : ({ theme }: { theme: ThemeType }) => theme.colors.border.light};
  border: 1px solid ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.semantic.error : 'transparent'};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borders.radius.round};
  transition: background-color 0.2s ease;
`;

/**
 * Sliding knob for the toggle switch
 */
const ToggleThumb = styled.div<{ checked?: boolean }>`
  position: absolute;
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: ${({ theme }: { theme: ThemeType }) => theme.colors.background.primary};
  border-radius: 50%;
  transition: transform 0.2s ease;
  transform: ${props => props.checked ? 'translateX(20px)' : 'translateX(0)'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

/**
 * Label for the toggle switch
 */
const ToggleLabel = styled.label<{ hasError?: boolean; required?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }: { theme: ThemeType }) => theme.spacing.xs};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.fonts.size.sm};
  font-weight: ${({ theme }: { theme: ThemeType }) => theme.fonts.weight.medium};
  color: ${props => props.hasError ? ({ theme }: { theme: ThemeType }) => theme.colors.text.error : ({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  position: relative;

  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.error};
    margin-left: ${({ theme }: { theme: ThemeType }) => theme.spacing.xxs};
  }
`;

/**
 * Container for the toggle switch and optional label
 */
const ToggleContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }: { theme: ThemeType }) => theme.spacing.md};
`;

/**
 * A customizable toggle switch component that supports different states and validation
 */
const Toggle: React.FC<ToggleProps> = (props) => {
  // LD1: Destructure props including id, name, checked, label, onChange, onBlur, error, disabled, required, and other HTML input attributes
  const {
    id: propsId,
    name,
    checked: propsChecked,
    label,
    onChange,
    onBlur,
    error: propsError,
    disabled,
    required,
    className,
    ...rest
  } = props;

  // LD1: Get form context if component is used within a Form component
  const formContext = useFormContext();
  const isInForm = !!formContext;

  // LD1: Generate a unique ID for the input if not provided
  const [generatedId] = useState(() => `toggle-${Math.random().toString(36).substring(2, 15)}`);
  const id = propsId || generatedId;

  // LD1: Determine if the toggle should show an error state
  const hasError = !!(propsError || (isInForm && formContext.touched[name] && formContext.errors[name]));
  const error = propsError || (isInForm ? formContext.errors[name] : undefined);

  // LD1: Handle change events and propagate to parent component or form context
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked;
      onChange?.(isChecked, event);
      if (isInForm) {
        formContext.handleChange(event);
        formContext.validateField(name);
      }
    },
    [onChange, isInForm, formContext, name]
  );

  // LD1: Handle blur events and propagate to parent component or form context
  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
      if (isInForm) {
        formContext.handleBlur(event);
      }
    },
    [onBlur, isInForm, formContext]
  );

  // LD1: Render the ToggleContainer component with appropriate props
  return (
    <ToggleContainer className={className} disabled={disabled}>
      {/* LD1: Render label if provided */}
      {label && (
        <ToggleLabel htmlFor={id} hasError={hasError} required={required}>
          {label}
        </ToggleLabel>
      )}

      <ToggleContent>
        {/* LD1: Render the ToggleWrapper component that contains the toggle switch */}
        <ToggleWrapper disabled={disabled}>
          {/* LD1: Render the hidden native checkbox input for accessibility */}
          <HiddenInput
            type="checkbox"
            id={id}
            name={name}
            checked={isInForm ? formContext.values[name] : propsChecked}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            {...rest}
          />

          {/* LD1: Render the ToggleTrack component (background track) */}
          <ToggleTrack checked={isInForm ? formContext.values[name] : propsChecked} hasError={hasError} disabled={disabled} />

          {/* LD1: Render the ToggleThumb component (sliding knob) */}
          <ToggleThumb checked={isInForm ? formContext.values[name] : propsChecked} />
        </ToggleWrapper>

      </ToggleContent>

      {/* LD1: Render FormError component if there's an error */}
      {hasError && <FormError error={error} />}
    </ToggleContainer>
  );
};

// LD2: Export form context for use in custom form components
export default Toggle;

// LD2: Export TypeScript interface for Form component props
export type { ToggleProps };