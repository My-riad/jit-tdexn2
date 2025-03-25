import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import styled from 'styled-components';
import { CheckCircle, Warning, Error, Info, Close } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import Text from '../typography/Text';
import IconButton from '../buttons/IconButton';

// Constants
const DEFAULT_DURATION = 5000; // 5 seconds
const DEFAULT_POSITION = 'top-right';
const ANIMATION_DURATION = 300; // 0.3 seconds

// Types and Interfaces
interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string | React.ReactNode;
  title?: string;
  duration?: number;
  onClose?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

interface NotificationContextType {
  showNotification: (notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }) => string;
  dismissNotification: (id: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string | React.ReactNode;
  title?: string;
  duration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// Create context for notification system
const NotificationContext = createContext<NotificationContextType | null>(null);

// Helper function to get appropriate icon based on notification type
const getIconByType = (type: string): React.ReactNode => {
  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'warning':
      return <Warning />;
    case 'error':
      return <Error />;
    case 'info':
    default:
      return <Info />;
  }
};

// Helper function to get appropriate styles based on notification type
const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'success':
      return {
        background: `${theme.colors.semantic.success}15`,
        borderColor: theme.colors.semantic.success,
      };
    case 'warning':
      return {
        background: `${theme.colors.semantic.warning}15`,
        borderColor: theme.colors.semantic.warning,
      };
    case 'error':
      return {
        background: `${theme.colors.semantic.error}15`,
        borderColor: theme.colors.semantic.error,
      };
    case 'info':
    default:
      return {
        background: `${theme.colors.semantic.info}15`,
        borderColor: theme.colors.semantic.info,
      };
  }
};

// Styled Components
const NotificationWrapper = styled(motion.div)<{ type: string }>`
  display: flex;
  align-items: flex-start;
  border-radius: ${theme.borders.radius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  background-color: ${({ type }) => getNotificationStyles(type).background};
  border-left: 4px solid ${({ type }) => getNotificationStyles(type).borderColor};
  box-shadow: ${theme.elevation.low};
  position: relative;
  width: 100%;
  max-width: 400px;
  pointer-events: auto;
`;

const NotificationIcon = styled.div<{ type: string }>`
  margin-right: ${theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ type }) => getNotificationStyles(type).borderColor};
`;

const NotificationContent = styled.div`
  flex: 1;
  padding-right: ${theme.spacing.md};
`;

const NotificationTitle = styled.div`
  font-weight: ${theme.fonts.weight.bold};
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.text.primary};
`;

const NotificationMessage = styled.div`
  color: ${theme.colors.text.primary};
`;

const CloseButton = styled.div`
  position: absolute;
  top: ${theme.spacing.xs};
  right: ${theme.spacing.xs};
`;

const NotificationsContainer = styled.div`
  position: fixed;
  z-index: ${theme.zIndex.toast};
  width: 100%;
  pointer-events: none;
`;

const NotificationStack = styled.div<{ position: string }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  max-width: 400px;
  width: 100%;
  padding: ${theme.spacing.md};
  pointer-events: none;
  
  ${({ position }) => {
    switch (position) {
      case 'top-right':
        return `
          top: 0;
          right: 0;
        `;
      case 'top-left':
        return `
          top: 0;
          left: 0;
        `;
      case 'bottom-right':
        return `
          bottom: 0;
          right: 0;
        `;
      case 'bottom-left':
        return `
          bottom: 0;
          left: 0;
        `;
      default:
        return `
          top: 0;
          right: 0;
        `;
    }
  }}
`;

/**
 * NotificationToast Component
 * Displays a temporary notification with different severity levels
 */
const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type = 'info',
  message,
  title,
  duration = DEFAULT_DURATION,
  onClose,
  position = DEFAULT_POSITION,
  className,
  ...props
}) => {
  // Set up timer to automatically close notification
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Get the appropriate icon based on notification type
  const icon = getIconByType(type);

  return (
    <NotificationWrapper
      type={type}
      className={className}
      initial={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      transition={{ duration: ANIMATION_DURATION / 1000 }}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      {...props}
    >
      <NotificationIcon type={type}>
        {icon}
      </NotificationIcon>
      
      <NotificationContent>
        {title && (
          <NotificationTitle>
            <Text variant="bodyRegular" noMargin>{title}</Text>
          </NotificationTitle>
        )}
        <NotificationMessage>
          <Text variant="bodySmall" noMargin>{message}</Text>
        </NotificationMessage>
      </NotificationContent>
      
      <CloseButton>
        <IconButton 
          variant="ghost" 
          size="small" 
          onClick={onClose}
          ariaLabel="Close notification"
        >
          <Close fontSize="small" />
        </IconButton>
      </CloseButton>
    </NotificationWrapper>
  );
};

/**
 * NotificationContainer Component
 * Manages multiple notifications and provides context for the notification system
 */
const NotificationContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Function to add a new notification
  const showNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    title?: string;
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }) => {
    const id = uuidv4();
    
    const newNotification: NotificationItem = {
      id,
      type: notification.type,
      message: notification.message,
      title: notification.title,
      duration: notification.duration || DEFAULT_DURATION,
      position: notification.position || DEFAULT_POSITION,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, []);
  
  // Function to remove a notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Context value
  const contextValue = {
    showNotification,
    dismissNotification,
  };

  // Group notifications by position
  const notificationsByPosition = notifications.reduce<Record<string, NotificationItem[]>>(
    (acc, notification) => {
      const { position } = notification;
      if (!acc[position]) {
        acc[position] = [];
      }
      acc[position].push(notification);
      return acc;
    },
    {}
  );

  // Render the container with stacks for each position
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationsContainer>
        {Object.entries(notificationsByPosition).map(([position, notificationsForPosition]) => (
          <NotificationStack key={position} position={position}>
            <AnimatePresence>
              {notificationsForPosition.map((notification) => (
                <NotificationToast
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  message={notification.message}
                  title={notification.title}
                  duration={notification.duration}
                  position={notification.position}
                  onClose={() => dismissNotification(notification.id)}
                />
              ))}
            </AnimatePresence>
          </NotificationStack>
        ))}
      </NotificationsContainer>
    </NotificationContext.Provider>
  );
};

/**
 * Hook to access notification functionality from any component
 * Must be used within a NotificationContainer
 */
const useNotificationContainer = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContainer must be used within a NotificationContainer');
  }
  
  return context;
};

// Export components and types
export { NotificationToast, NotificationContainer, useNotificationContainer };
export type { NotificationToastProps, NotificationContextType };