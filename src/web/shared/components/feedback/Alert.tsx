import React from 'react';
import styled from 'styled-components';
import { CheckCircle, Warning, Error, Info, Close } from '@mui/icons-material';
import { colors, spacing, borders } from '../../styles/theme';
import Text from '../typography/Text';
import IconButton from '../buttons/IconButton';

/**
 * Interface for the Alert component props
 */
export interface AlertProps {
  /** Determines the visual style and icon of the alert */
  severity: 'success' | 'error' | 'warning' | 'info';
  /** Content to display in the alert */
  message: string | React.ReactNode;
  /** Optional title displayed above the message */
  title?: string;
  /** Optional callback function when the close button is clicked */
  onClose?: () => void;
  /** Additional CSS class for custom styling */
  className?: string;
}

/**
 * Interface for the styled alert container props
 */
interface AlertContainerProps {
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Generates the appropriate CSS for each alert severity type
 */
const getAlertStyles = ({ severity, theme }) => {
  switch (severity) {
    case 'success':
      return `
        background-color: ${colors.transparency.green10};
        border-left-color: ${colors.semantic.success};
      `;
    case 'error':
      return `
        background-color: ${colors.transparency.red10};
        border-left-color: ${colors.semantic.error};
      `;
    case 'warning':
      return `
        background-color: ${colors.transparency.orange10};
        border-left-color: ${colors.semantic.warning};
      `;
    case 'info':
    default:
      return `
        background-color: ${colors.transparency.blue10};
        border-left-color: ${colors.semantic.info};
      `;
  }
};

/**
 * Returns the appropriate icon component based on severity
 */
const getIconBySeverity = (severity: 'success' | 'error' | 'warning' | 'info') => {
  switch (severity) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <Error />;
    case 'warning':
      return <Warning />;
    case 'info':
    default:
      return <Info />;
  }
};

const AlertContainer = styled.div<AlertContainerProps>`
  display: flex;
  align-items: flex-start;
  border-radius: ${borders.radius.md};
  padding: ${spacing.md};
  margin-bottom: ${spacing.md};
  border-left: 4px solid;
  box-shadow: ${({ theme }) => theme.elevation.low};
  position: relative;
  width: 100%;
  ${getAlertStyles}
`;

const AlertIcon = styled.div`
  margin-right: ${spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ severity }) => {
    switch (severity) {
      case 'success':
        return colors.semantic.success;
      case 'error':
        return colors.semantic.error;
      case 'warning':
        return colors.semantic.warning;
      case 'info':
      default:
        return colors.semantic.info;
    }
  }};
`;

const AlertContent = styled.div`
  flex: 1;
  padding-right: ${spacing.md};
`;

const AlertTitle = styled.div`
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  margin-bottom: ${spacing.xs};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const AlertMessage = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CloseButton = styled.div`
  position: absolute;
  top: ${spacing.xs};
  right: ${spacing.xs};
`;

/**
 * A component that displays alert messages with different severity levels
 * Provides visual feedback through colors, icons, and styling to communicate
 * different types of messages to users.
 */
const Alert: React.FC<AlertProps> = ({
  severity,
  message,
  title,
  onClose,
  className,
}) => {
  const alertIcon = getIconBySeverity(severity);

  return (
    <AlertContainer 
      severity={severity} 
      className={className} 
      role="alert" 
      aria-live="polite"
    >
      <AlertIcon severity={severity}>{alertIcon}</AlertIcon>
      <AlertContent>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertMessage>
          {typeof message === 'string' ? (
            <Text variant="bodyRegular" noMargin>
              {message}
            </Text>
          ) : (
            message
          )}
        </AlertMessage>
      </AlertContent>
      {onClose && (
        <CloseButton>
          <IconButton
            variant="ghost"
            size="small"
            ariaLabel="Close alert"
            onClick={onClose}
          >
            <Close fontSize="small" />
          </IconButton>
        </CloseButton>
      )}
    </AlertContainer>
  );
};

export default Alert;