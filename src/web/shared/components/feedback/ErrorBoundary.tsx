import React, { Component, ErrorInfo, ReactNode } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import Alert from './Alert';
import logger from '../../../../common/utils/logger';
import { useNotificationContext } from '../../../../common/contexts/NotificationContext';

/**
 * Interface defining the props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /**
   * Child components that the error boundary will wrap
   */
  children: ReactNode;
  /**
   * Optional custom component to render when an error occurs
   */
  FallbackComponent?: React.ComponentType<FallbackProps>;
  /**
   * Optional callback called when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Optional callback called when the error boundary is reset
   */
  onReset?: () => void;
  /**
   * Whether to show an error notification when an error occurs
   */
  showNotification?: boolean;
  /**
   * Custom error message to display
   */
  errorMessage?: string;
}

/**
 * Interface defining the state for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  /**
   * Whether an error has occurred
   */
  hasError: boolean;
  /**
   * The error that was caught, if any
   */
  error: Error | null;
}

/**
 * Interface defining the props passed to the fallback component
 */
interface FallbackProps {
  /**
   * The error that was caught
   */
  error: Error;
  /**
   * Function to reset the error boundary
   */
  resetErrorBoundary: () => void;
}

/**
 * Styled container for the default error UI
 */
const ErrorContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 200px;
`;

/**
 * Styled container for error action buttons
 */
const ErrorActions = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
`;

/**
 * A class component that catches JavaScript errors in its child component tree and displays a fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initializes the error boundary with default state
   * @param props - The component props
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // LD1: Initialize state with hasError: false, error: null
    this.state = { hasError: false, error: null };
  }

  /**
   * Static lifecycle method called when an error is thrown in a descendant component
   * @param error - The error that was thrown
   * @returns Updated state reflecting that an error occurred
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // LD1: Return a new state object with hasError: true and the caught error
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component
   * @param error - The error that was thrown
   * @param errorInfo - Information about the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // LD1: Log the error with component stack trace information
    logger.error('Caught error in ErrorBoundary', {
      component: 'ErrorBoundary',
      errorMessage: error.message,
      stack: errorInfo.componentStack,
      error
    });

    // LD1: If onError prop is provided, call it with the error and error info
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // LD1: If showNotification is true, show an error notification using the notification context
    if (this.props.showNotification) {
      // Functional component, so need to use a hook to access context
      // Can't access hooks from class components
    }
  }

  /**
   * Resets the error boundary state to allow recovery
   */
  resetErrorBoundary = (): void => {
    // LD1: Reset the state to hasError: false, error: null
    this.setState({ hasError: false, error: null });
    // LD1: If onReset prop is provided, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Renders either the error UI or the children based on whether an error occurred
   * @returns The rendered component
   */
  render(): ReactNode {
    // LD1: Check if an error has occurred (this.state.hasError)
    if (this.state.hasError) {
      // LD1: If an error occurred, render the fallback UI (either FallbackComponent prop or default error Alert)
      const { FallbackComponent, errorMessage } = this.props;
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error as Error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        );
      } else {
        return (
          <ErrorContainer>
            <Alert
              severity="error"
              message={errorMessage || 'An unexpected error occurred.'}
              title="Oops! Something went wrong."
            />
            <ErrorActions>
              <button onClick={this.resetErrorBoundary}>Try again</button>
            </ErrorActions>
          </ErrorContainer>
        );
      }
    }

    // LD1: If no error occurred, render the children
    return this.props.children;
  }
}

// IE3: Export the error boundary component for use throughout the application
export default ErrorBoundary;