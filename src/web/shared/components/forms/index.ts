// A barrel file that exports all form components from the shared components library.
// This simplifies imports by allowing consumers to import multiple form components from a single path,
// promoting consistency and maintainability across the AI-driven Freight Optimization Platform.

import Checkbox, { CheckboxProps } from './Checkbox';
import DatePicker, { DatePickerProps } from './DatePicker';
import Dropdown, { DropdownOption, DropdownProps } from './Dropdown';
import FileUpload, { FileUploadProps } from './FileUpload';
import Form, { FormContext, FormContextType, FormProps, useFormContext } from './Form';
import FormError, { FormErrorProps } from './FormError';
import Input, { InputProps } from './Input';
import RadioButton, { RadioButtonProps } from './RadioButton';
import Select, { SelectOption, SelectProps } from './Select';
import TextArea, { TextAreaProps } from './TextArea';
import TimePicker, { TimePickerProps } from './TimePicker';
import Toggle, { ToggleProps } from './Toggle';

// Export Checkbox component for form boolean inputs
export { Checkbox };

// Export Checkbox props interface for type checking
export type { CheckboxProps };

// Export DatePicker component for date selection
export { DatePicker };

// Export DatePicker props interface for type checking
export type { DatePickerProps };

// Export Dropdown component for enhanced select functionality
export { Dropdown };

// Export Dropdown props interface for type checking
export type { DropdownProps };

// Export DropdownOption interface for dropdown options
export type { DropdownOption };

// Export FileUpload component for file selection and upload
export { FileUpload };

// Export FileUpload props interface for type checking
export type { FileUploadProps };

// Export Form component for form state management
export { Form };

// Export Form props interface for type checking
export type { FormProps };

// Export form context for use in custom form components
export { FormContext };

// Export form context type interface for type checking
export type { FormContextType };

// Export hook for accessing form context in child components
export { useFormContext };

// Export FormError component for displaying validation errors
export { FormError };

// Export FormError props interface for type checking
export type { FormErrorProps };

// Export Input component for text input fields
export { Input };

// Export Input props interface for type checking
export type { InputProps };

// Export RadioButton component for single-selection options
export { RadioButton };

// Export RadioButton props interface for type checking
export type { RadioButtonProps };

// Export Select component for dropdown selection
export { Select };

// Export Select props interface for type checking
export type { SelectProps };

// Export SelectOption interface for select options
export type { SelectOption };

// Export TextArea component for multi-line text input
export { TextArea };

// Export TextArea props interface for type checking
export type { TextAreaProps };

// Export TimePicker component for time selection
export { TimePicker };

// Export TimePicker props interface for type checking
export type { TimePickerProps };

// Export Toggle component for boolean toggle switches
export { Toggle };

// Export Toggle props interface for type checking
export type { ToggleProps };