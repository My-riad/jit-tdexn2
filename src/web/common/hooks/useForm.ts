import { useState, useEffect, useCallback } from 'react'; // react ^18.0.0
import { validateForm } from '../utils/validators';
/**
 * Interface representing the current state of a form
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Interface representing the handlers for form operations
 */
export interface FormHandlers {
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: (field: string, value: any) => void;
  resetForm: () => void;
  validateField: (field: string) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}

/**
 * Interface for options passed to the useForm hook
 */
export interface UseFormOptions {
  initialValues: Record<string, any>;
  validationSchema?: Record<string, (value: any) => boolean | string>;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  validateOnChange?: boolean;
}

/**
 * Interface representing a validation schema for form fields
 */
export interface ValidationSchema {
  [field: string]: (value: any) => boolean | string;
}

/**
 * A custom hook for managing form state, validation, and submission
 * @param options Options for configuring the form behavior
 * @returns An object containing form state and handlers
 */
const useForm = (options: UseFormOptions): FormState & FormHandlers => {
  // LD1: Destructure initialValues, validationSchema, onSubmit, and validateOnChange from options
  const { initialValues, validationSchema = {}, onSubmit, validateOnChange = false } = options;

  // LD1: Initialize form state with useState hooks for values, errors, touched, isSubmitting, and isValid
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // LD1: Create handleChange function to update form values and optionally validate on change
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setValues(prevValues => ({ ...prevValues, [name]: value }));
      if (validateOnChange) {
        validateField(name);
      }
    },
    [validateOnChange, validateField]
  );

  // LD1: Create handleBlur function to mark fields as touched and validate
  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = event.target;
      setTouched(prevTouched => ({ ...prevTouched, [name]: true }));
      validateField(name);
    },
    [validateField]
  );

  // LD1: Create setFieldValue function to programmatically set field values
  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setValues(prevValues => ({ ...prevValues, [field]: value }));
    },
    []
  );

  // LD1: Create resetForm function to reset the form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues || {});
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
  }, [initialValues]);

  // LD1: Create validateField function to validate a single field
  const validateField = useCallback(
    (field: string) => {
      if (validationSchema[field]) {
        const validationResult = validationSchema[field](values[field]);
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: validationResult === true ? '' : validationResult as string,
        }));
      }
    },
    [validationSchema, values]
  );

  // LD1: Create validateAllFields function to validate all form fields
  const validateAllFields = useCallback(() => {
    const newErrors = validateForm(values, validationSchema);
    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return newErrors;
  }, [validationSchema, values]);

  // LD1: Create handleSubmit function to validate and submit the form
  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsSubmitting(true);
      const newErrors = validateAllFields();
      setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      const isValidForm = Object.keys(newErrors).length === 0;
      setIsValid(isValidForm);
      if (isValidForm) {
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsSubmitting(false);
      }
    },
    [onSubmit, validateAllFields, values]
  );

  // LD1: Use useEffect to validate the form when validationSchema changes
  useEffect(() => {
    const newErrors = validateForm(values, validationSchema);
    setErrors(newErrors);
    const isValidForm = Object.keys(newErrors).length === 0;
    setIsValid(isValidForm);
  }, [validationSchema, values]);

  // LD1: Return an object containing form state and handlers
  return {
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
};

export default useForm;