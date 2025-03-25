import React, { useState, useRef, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useClickOutside } from 'react-use'; // react-use ^17.4.0
import { v4 as uuidv4 } from 'uuid'; // uuid v9.0.1

import { theme, ThemeType } from '../../styles/theme';
import FormError from './FormError';
import { useFormContext } from './Form';

// Define the DropdownOption interface
export interface DropdownOption {
  value: string;
  label: string;
}

// Define the DropdownProps interface
export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  label?: string;
  options: Array<DropdownOption>;
  value?: string | string[];
  onChange?: (value: string | string[], name?: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  className?: string;
}

const DEFAULT_PLACEHOLDER_TEXT = 'Select an option';

// Styled Components for the Dropdown
const DropdownContainer = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.md};
  width: 100%;
`;

interface DropdownLabelProps {
  required?: boolean;
}

const DropdownLabel = styled.label<DropdownLabelProps>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => props.required ? '"*"' : 'none'};
    color: ${theme.colors.semantic.error};
    margin-left: ${theme.spacing.xxs};
  }
`;

interface DropdownTriggerProps {
  hasError?: boolean;
  disabled?: boolean;
  isOpen?: boolean;
}

const DropdownTrigger = styled.div<DropdownTriggerProps>`
  width: 100%;
  height: 40px;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSize.md};
  color: ${props => props.disabled ? theme.colors.text.tertiary : theme.colors.text.primary};
  background-color: ${props => props.disabled ? theme.colors.background.secondary : theme.colors.background.primary};
  border: 1px solid ${props => props.hasError ? theme.colors.semantic.error : props.isOpen ? theme.colors.primary.main : theme.colors.border.medium};
  border-radius: ${props => props.isOpen ? `${theme.borders.radius.md} ${theme.borders.radius.md} 0 0` : theme.borders.radius.md};
  transition: all 0.2s ease-in-out;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    border-color: ${props => props.hasError ? theme.colors.semantic.error : props.disabled ? theme.colors.border.medium : theme.colors.primary.main};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? theme.colors.semantic.error : theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${theme.colors.primary.light};
  }
`;

interface DropdownMenuProps {
  isOpen?: boolean;
}

const DropdownMenu = styled.div<DropdownMenuProps>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.primary.main};
  border-top: none;
  border-radius: 0 0 ${theme.borders.radius.md} ${theme.borders.radius.md};
  z-index: ${theme.zIndex.dropdown};
  display: ${props => props.isOpen ? 'block' : 'none'};
  box-shadow: ${theme.elevation.medium};
`;

interface DropdownOptionProps {
  isSelected?: boolean;
  disabled?: boolean;
}

const DropdownOptionStyled = styled.div<DropdownOptionProps>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSize.md};
  color: ${props => props.disabled ? theme.colors.text.tertiary : theme.colors.text.primary};
  background-color: ${props => props.isSelected ? theme.colors.primary.light : theme.colors.background.primary};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${props => props.disabled ? 'transparent' : props.isSelected ? theme.colors.primary.light : theme.colors.background.secondary};
  }
`;

const DropdownSearchInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSize.md};
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.background.secondary};
  border: none;
  border-bottom: 1px solid ${theme.colors.border.light};

  &:focus {
    outline: none;
  }
`;

interface SelectedValueProps {
  isPlaceholder?: boolean;
}

const SelectedValue = styled.div<SelectedValueProps>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${props => props.isPlaceholder ? theme.colors.text.tertiary : theme.colors.text.primary};
`;

interface DropdownIconProps {
  isOpen?: boolean;
}

const DropdownIcon = styled.div<DropdownIconProps>`
  width: 16px;
  height: 16px;
  margin-left: ${theme.spacing.xs};
  transition: transform 0.2s ease-in-out;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`;

const MultipleSelectionChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.xxs};
`;

const SelectionChip = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${theme.colors.primary.light};
  color: ${theme.colors.primary.dark};
  font-size: ${theme.typography.fontSize.sm};
  padding: ${theme.spacing.xxs} ${theme.spacing.xs};
  border-radius: ${theme.borders.radius.sm};
  margin-right: ${theme.spacing.xxs};
  margin-bottom: ${theme.spacing.xxs};
`;

const ChipRemoveButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary.dark};
  margin-left: ${theme.spacing.xxs};
  padding: 0;
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  line-height: 1;

  &:hover {
    color: ${theme.colors.semantic.error};
  }
`;

const NoOptionsMessage = styled.div`
  padding: ${theme.spacing.sm};
  text-align: center;
  color: ${theme.colors.text.tertiary};
  font-style: italic;
`;

const Dropdown: React.FC<DropdownProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  placeholder = DEFAULT_PLACEHOLDER_TEXT,
  multiple = false,
  searchable = false,
  className,
  ...rest
}) => {
  const form = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(multiple && value ? (Array.isArray(value) ? value : [value]) : []);
  const dropdownRef = useRef(null);
  const hasError = error !== undefined;
  const dropdownId = useRef(name || uuidv4()).current;

  useClickOutside(dropdownRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  const handleOptionSelect = useCallback((optionValue: string) => {
    if (multiple) {
      const isSelected = selectedOptions.includes(optionValue);
      let newSelectedOptions: string[];

      if (isSelected) {
        newSelectedOptions = selectedOptions.filter(val => val !== optionValue);
      } else {
        newSelectedOptions = [...selectedOptions, optionValue];
      }

      setSelectedOptions(newSelectedOptions);
      onChange?.(newSelectedOptions, name);
      form?.setFieldValue(name, newSelectedOptions);
    } else {
      onChange?.(optionValue, name);
      form?.setFieldValue(name, optionValue);
      setIsOpen(false);
    }
  }, [multiple, selectedOptions, onChange, name, form]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      )
    : options;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (form) {
      form.handleChange(e);
    }
    onChange?.(e.target.value, name);
  }, [form, onChange, name]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (form) {
      form.handleBlur(e);
    }
    onBlur?.(e);
  }, [form, onBlur]);

  return (
    <DropdownContainer className={className} ref={dropdownRef} {...rest}>
      {label && <DropdownLabel htmlFor={dropdownId} required={required}>{label}</DropdownLabel>}
      <DropdownTrigger
        onClick={toggleDropdown}
        hasError={hasError}
        disabled={disabled}
        isOpen={isOpen}
      >
        <SelectedValue isPlaceholder={multiple ? selectedOptions.length === 0 : !value}>
          {multiple
            ? selectedOptions.length > 0
              ? <MultipleSelectionChips>
                  {selectedOptions.map(optionValue => {
                    const option = options.find(o => o.value === optionValue);
                    return (
                      <SelectionChip key={optionValue}>
                        {option?.label || optionValue}
                        <ChipRemoveButton type="button" onClick={(e) => {
                          e.stopPropagation();
                          handleOptionSelect(optionValue);
                        }}>
                          x
                        </ChipRemoveButton>
                      </SelectionChip>
                    );
                  })}
                </MultipleSelectionChips>
              : placeholder
            : options.find(option => option.value === value)?.label || placeholder}
        </SelectedValue>
        <DropdownIcon isOpen={isOpen} />
      </DropdownTrigger>
      <DropdownMenu isOpen={isOpen}>
        {searchable && (
          <DropdownSearchInput
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
          />
        )}
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => (
            <DropdownOptionStyled
              key={option.value}
              isSelected={multiple ? selectedOptions.includes(option.value) : option.value === value}
              onClick={() => handleOptionSelect(option.value)}
              disabled={disabled}
            >
              {option.label}
            </DropdownOptionStyled>
          ))
        ) : (
          <NoOptionsMessage>No options found</NoOptionsMessage>
        )}
      </DropdownMenu>
      {hasError && <FormError error={error} />}
    </DropdownContainer>
  );
};

export default Dropdown;