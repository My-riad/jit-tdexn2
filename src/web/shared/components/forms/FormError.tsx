import React from 'react';
import styled from 'styled-components';
import { ThemeType } from '../../styles/theme';
import Text from '../typography/Text';

/**
 * Props for the FormError component
 */
export interface FormErrorProps {
  error?: string;
  className?: string;
}

/**
 * Styled container for error messages
 */
const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 4px;
  padding: 4px 0;
  color: ${({ theme }) => theme.colors.text.error};
  font-size: ${({ theme }) => theme.fonts.size.xs};
  line-height: 1.2;
  animation: fadeIn 0.2s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

/**
 * A component that displays form validation error messages
 * with consistent styling based on the design system.
 * Used within form elements to show field-specific or form-level error messages.
 */
const FormError: React.FC<FormErrorProps> = ({ error, className }) => {
  // Return null if no error message is provided
  if (!error) return null;
  
  return (
    <ErrorContainer className={className}>
      <Text 
        variant="caption" 
        color="error" 
        noMargin 
      >
        {error}
      </Text>
    </ErrorContainer>
  );
};

export default FormError;