import React, { ReactNode, createContext, useContext } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import { theme } from '../../styles/theme';
import FormError from './FormError';
import useForm from '../../../common/hooks/useForm';

/**
 * Props for the Form component
 */
export interface FormProps {
  initialValues: Record<string, any>;
  validationSchema?: Record<string, (value: any) => boolean | string>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  children: ReactNode;
  className?: string;
  id?: string;
  noValidate?: boolean;
  // LD1: Extends native form attributes
}

/**
 * Context type for form state and handlers
 */
export interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: (field: string, value: any) => void;
  resetForm: () => void;
  validateField: (field: string) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}

/**
 * React context for form state and handlers
 */
const FormContext = React.createContext<FormContextType>(null as any);

/**
 * Creates a React context for form state and handlers
 */
const createFormContext = () => {
  // LD1: Create a React context with default values for form state and handlers
  return FormContext;
};

/**
 * Custom hook to access the form context
 */
const useFormContext = () => {
  // LD1: Use React's useContext hook to access the form context
  const context = useContext(FormContext);

  // LD1: Throw an error if the hook is used outside of a Form component
  if (!context) {
    throw new Error('useFormContext must be used within a Form');
  }

  // LD1: Return the form context values and handlers
  return context;
};

/**
 * Styled form container component
 */
const FormContainer = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

/**
 * Container for form-level error messages
 */
const FormErrorContainer = styled.div`
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borders.radius.md};
  background-color: ${theme.colors.semantic.error}10;
  border: 1px solid ${theme.colors.semantic.error};
`;

/**
 * A form component that provides form state management through context
 */
const Form: React.FC<FormProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  className,
  id,
  noValidate,
  ...rest
}) => {
  // LD1: Use the useForm hook to create form state and handlers
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
    validateField,
    handleSubmit,
  } = useForm({
    initialValues,
    validationSchema,
    onSubmit,
  });

  // LD1: Create a form context value object with form state and handlers
  const formContextValue: FormContextType = {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
    validateField,
    handleSubmit,
  };

  // LD1: Render the FormContainer component with FormContext.Provider
  return (
    <FormContainer
      onSubmit={handleSubmit}
      className={className}
      id={id}
      noValidate={noValidate}
      {...rest}
      aria-invalid={!isValid}
    >
      <FormContext.Provider value={formContextValue}>
        {/* LD1: Render form-level error message if present */}
        {errors.form && (
          <FormErrorContainer>
            <FormError error={errors.form} />
          </FormErrorContainer>
        )}
        {/* LD1: Render children within the form context */}
        {children}
      </FormContext.Provider>
    </FormContainer>
  );
};

// LD2: Export form context for use in custom form components
export { Form, FormContext, useFormContext };

// LD2: Export TypeScript interface for Form component props
export type { FormProps, FormContextType };

export default Form;