import React, { useEffect, useRef, useState } from 'react'; // version ^18.2.0
import ReactDOM from 'react-dom'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { Close } from '@mui/icons-material'; // version ^5.11.0
import FocusTrap from 'focus-trap-react'; // version ^10.0.0

import { theme } from '../../styles/theme';
import Button from '../buttons/Button';
import Container from '../layout/Container';
import { useThemeContext } from '../../../common/contexts/ThemeContext';

// Define available modal sizes
const MODAL_SIZES = {
  small: '400px',
  medium: '600px',
  large: '800px',
  full: '90%',
};

// Props interface for the modal component
interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Function called when the modal is closed */
  onClose: () => void;
  /** Title displayed in the modal header */
  title?: string;
  /** Content to display in the modal body */
  children: React.ReactNode;
  /** Content to display in the modal footer */
  footer?: React.ReactNode;
  /** Size of the modal */
  size?: keyof typeof MODAL_SIZES;
  /** Whether clicking the overlay closes the modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEsc?: boolean;
  /** Additional CSS class for the modal */
  className?: string;
}

// Props for the modal container styled component
interface ModalContainerProps {
  size: keyof typeof MODAL_SIZES;
  isOpen: boolean;
  isMounted: boolean;
}

// Props for the modal overlay styled component
interface ModalOverlayProps {
  isOpen: boolean;
  isMounted: boolean;
}

// Styled component for the modal backdrop overlay
const ModalOverlay = styled.div<ModalOverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${({ theme }) => theme.zIndex.modal};
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${({ isOpen, isMounted }) => isOpen && isMounted && `
    opacity: 1;
  `}
`;

// Styled component for the modal container
const ModalContainer = styled.div<ModalContainerProps>`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: ${({ theme }) => theme.elevation.high};
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: ${({ size }) => MODAL_SIZES[size]};
  max-width: 95vw;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  
  ${({ isOpen, isMounted }) => isOpen && isMounted && `
    transform: translateY(0);
    opacity: 1;
  `}
  
  overflow: hidden;
  position: relative;
`;

// Styled component for the modal header
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

// Styled component for the modal title
const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fonts.size.lg};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

// Styled component for the close button
const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.button.primary.border};
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

// Styled component for the modal content area
const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
`;

// Styled component for the modal footer
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  gap: ${({ theme }) => theme.spacing.sm};
`;

/**
 * A reusable modal component that displays content in an overlay dialog.
 * The modal provides a way to focus user attention on specific content or actions
 * while temporarily blocking interaction with the main application.
 * It supports customizable headers, footers, sizes, and can be dismissed by
 * clicking outside or pressing the escape key.
 */
const Modal: React.FC<ModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    closeOnOverlayClick = true,
    closeOnEsc = true,
    className,
    ...rest
  } = props;

  // Track if the modal is fully mounted in the DOM for animations
  const [isMounted, setIsMounted] = useState(false);
  
  // Reference to the modal content for focus management
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Access theme context
  const { theme } = useThemeContext();

  // Handle mounting/unmounting for animations and body scroll locking
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal opens
      document.body.style.overflow = 'hidden';
      
      // Set mounted state after a small delay to trigger animations
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, 10);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // Delay unmounting to allow for exit animations
      const timer = setTimeout(() => {
        setIsMounted(false);
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // If modal is not open and not mounted, don't render anything
  if (!isOpen && !isMounted) {
    return null;
  }

  // Create a portal to render the modal outside the normal component hierarchy
  return ReactDOM.createPortal(
    <FocusTrap
      active={isOpen && isMounted}
      focusTrapOptions={{
        initialFocus: false,
        escapeDeactivates: closeOnEsc,
        allowOutsideClick: true,
        returnFocusOnDeactivate: true,
      }}
    >
      <ModalOverlay
        isOpen={isOpen}
        isMounted={isMounted}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        {...rest}
      >
        <ModalContainer
          size={size}
          isOpen={isOpen}
          isMounted={isMounted}
          className={className}
          ref={contentRef}
          role="document"
        >
          {title && (
            <ModalHeader>
              <ModalTitle id="modal-title">{title}</ModalTitle>
              <CloseButton
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <Close />
              </CloseButton>
            </ModalHeader>
          )}
          
          <ModalContent>
            {children}
          </ModalContent>
          
          {footer && (
            <ModalFooter>
              {footer}
            </ModalFooter>
          )}
        </ModalContainer>
      </ModalOverlay>
    </FocusTrap>,
    document.body
  );
};

export { ModalProps };
export default Modal;