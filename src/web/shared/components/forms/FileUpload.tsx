import React, { useState, useRef, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { theme, lightTheme } from '../../styles/theme';
import FormError from './FormError';
import Button from '../buttons/Button';
import { useFormContext } from './Form';

// Define default values for max size and max files
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_FILES = 5;

// Utility function to format file sizes (e.g., 5.2 MB)
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// TypeScript interface for FileUpload component props
export interface FileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  value?: File | File[];
  onChange?: (files: File[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// TypeScript interface for FileUpload component state
interface FileUploadState {
  isDragOver: boolean;
  files: File[];
  internalError?: string;
}

// Styled Components for the FileUpload component
const FileUploadContainer = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.md};
  width: 100%;
`;

const FileUploadLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  position: relative;
  &::after {
    content: ${props => (props.required ? '"*"' : 'none')};
    color: ${theme.colors.semantic.error};
    margin-left: ${theme.spacing.xxs};
  }
`;

const DropZone = styled.div<{ isDragOver?: boolean; hasError?: boolean; disabled?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
  border: 2px dashed ${props =>
    props.hasError
      ? theme.colors.semantic.error
      : props.isDragOver
      ? theme.colors.primary.main
      : theme.colors.border.medium};
  border-radius: ${theme.borders.radius.md};
  background-color: ${props =>
    props.isDragOver
      ? theme.colors.background.accent
      : props.disabled
      ? theme.colors.background.secondary
      : theme.colors.background.primary};
  transition: all 0.2s ease-in-out;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? theme.opacity.disabled : 1)};
  margin-bottom: ${theme.spacing.sm};
`;

const DropZoneText = styled.p`
  margin: ${theme.spacing.sm} 0;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  text-align: center;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${theme.spacing.sm} 0;
  width: 100%;
`;

const FileItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.xs};
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borders.radius.sm};
  font-size: ${theme.typography.fontSize.sm};
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const FileName = styled.span`
  font-weight: ${theme.typography.fontWeight.medium};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.span`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.secondary};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.semantic.error};
  cursor: pointer;
  padding: ${theme.spacing.xxs};
  margin-left: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    opacity: 0.8;
  }
  &:focus {
    outline: none;
  }
`;

/**
 * A customizable file upload component that supports drag-and-drop and multiple file selection
 */
const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  accept,
  multiple = false,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className,
  ...rest
}) => {
  // Get form context if component is used within a Form component
  const formContext = useFormContext ? useFormContext() : null;

  // Initialize state for drag-over status, selected files, and internal errors
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isDragOver: false,
    files: [],
    internalError: undefined,
  });

  // Create a reference to the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Implement handleFileChange function to process selected files
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      validateFiles(files);
    },
    [maxSize, maxFiles, accept]
  );

  // Implement validateFiles function to check file types, sizes, and count
  const validateFiles = (files: File[]) => {
    let internalError: string | undefined = undefined;

    if (files.length > maxFiles) {
      internalError = `You can only upload a maximum of ${maxFiles} files`;
    } else {
      for (const file of files) {
        if (accept && !accept.split(',').map(item => item.trim()).includes(file.type)) {
          internalError = `File type not supported: ${file.name}`;
          break;
        }
        if (file.size > maxSize) {
          internalError = `File is too large: ${file.name} (max size: ${formatFileSize(maxSize)})`;
          break;
        }
      }
    }

    if (internalError) {
      setFileUploadState(prevState => ({ ...prevState, internalError, isDragOver: false }));
    } else {
      setFileUploadState(prevState => ({ ...prevState, internalError: undefined, isDragOver: false }));
      onChange?.(files);
      formContext?.setFieldValue(name, files);
    }
  };

  // Implement handleDragOver, handleDragEnter, handleDragLeave, and handleDrop functions for drag-and-drop functionality
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    setFileUploadState(prevState => ({ ...prevState, isDragOver: true }));
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setFileUploadState(prevState => ({ ...prevState, isDragOver: false }));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    validateFiles(files);
  };

  // Implement handleButtonClick function to trigger the hidden file input
  const handleButtonClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Implement handleRemoveFile function to remove a file from the selection
  const handleRemoveFile = (fileToRemove: File) => {
    const updatedFiles = fileUploadState.files.filter(file => file !== fileToRemove);
    setFileUploadState(prevState => ({ ...prevState, files: updatedFiles }));
    onChange?.(updatedFiles);
    formContext?.setFieldValue(name, updatedFiles);
  };

  // Render the FileUploadContainer component with appropriate props and event handlers
  return (
    <FileUploadContainer className={className}>
      {/* Render label if provided */}
      {label && <FileUploadLabel required={required}>{label}</FileUploadLabel>}

      {/* Render the DropZone component with drag-and-drop event handlers */}
      <DropZone
        isDragOver={fileUploadState.isDragOver}
        hasError={!!error || !!fileUploadState.internalError}
        disabled={disabled}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        aria-disabled={disabled}
      >
        <DropZoneText>
          {fileUploadState.internalError
            ? fileUploadState.internalError
            : disabled
            ? 'File Upload Disabled'
            : 'Drag and drop files here or click to select'}
        </DropZoneText>

        {/* Render the hidden file input element */}
        <HiddenInput
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          onBlur={onBlur}
          disabled={disabled}
          ref={fileInputRef}
          aria-required={required}
          aria-invalid={!!error || !!fileUploadState.internalError}
        />

        {/* Render the file selection button */}
        <Button variant="secondary" disabled={disabled}>
          Select Files
        </Button>
      </DropZone>

      {/* Render the file list if files are selected */}
      {fileUploadState.files.length > 0 && (
        <FileList>
          {fileUploadState.files.map((file, index) => (
            <FileItem key={index}>
              <FileInfo>
                <FileName>{file.name}</FileName>
                <FileSize>{formatFileSize(file.size)}</FileSize>
              </FileInfo>
              <RemoveButton type="button" onClick={() => handleRemoveFile(file)} aria-label={`Remove ${file.name}`}>
                X
              </RemoveButton>
            </FileItem>
          ))}
        </FileList>
      )}

      {/* Render FormError component if there's an error */}
      {(error || fileUploadState.internalError) && (
        <FormError error={error || fileUploadState.internalError} />
      )}
    </FileUploadContainer>
  );
};

export { FileUploadProps };
export default FileUpload;