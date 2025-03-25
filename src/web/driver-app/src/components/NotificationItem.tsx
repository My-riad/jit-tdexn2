import React from 'react'; // ^18.2.0
import styled from 'styled-components/native'; // ^5.3.10
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'; // ^0.71.8
import { format, formatDistanceToNow } from 'date-fns'; // ^2.30.0
import { colors } from '../styles/colors';
import { DriverNotificationType } from '../services/notificationService';

/**
 * TypeScript interface for NotificationItem component props
 */
interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
}

/**
 * Interface representing a notification object
 */
interface Notification {
  id: string;
  recipientId: string;
  recipientType: string;
  notificationType: string;
  title: string;
  message: string;
  data: object;
  priority: string;
  isRead: boolean;
  readAt: string;
  createdAt: string;
  expiresAt: string;
  actionUrl: string;
}

/**
 * Helper function to determine the appropriate icon for each notification type
 */
const getNotificationIcon = (notificationType: string): string => {
  switch (notificationType) {
    case DriverNotificationType.LOAD_OPPORTUNITY:
      return 'truck';
    case DriverNotificationType.LOAD_STATUS:
      return 'information-circle';
    case DriverNotificationType.ACHIEVEMENT:
      return 'trophy';
    case DriverNotificationType.BONUS_ZONE:
      return 'cash';
    case DriverNotificationType.SMART_HUB:
      return 'locate';
    case DriverNotificationType.SYSTEM:
      return 'warning';
    default:
      return 'notifications';
  }
};

/**
 * Helper function to determine the appropriate color for each notification type
 */
const getNotificationColor = (notificationType: string): string => {
  switch (notificationType) {
    case DriverNotificationType.LOAD_OPPORTUNITY:
      return colors.primary.green;
    case DriverNotificationType.LOAD_STATUS:
      return colors.primary.blue;
    case DriverNotificationType.ACHIEVEMENT:
      return colors.primary.orange;
    case DriverNotificationType.BONUS_ZONE:
      return colors.primary.red;
    case DriverNotificationType.SMART_HUB:
      return colors.primary.blueLight;
    case DriverNotificationType.SYSTEM:
      return colors.semantic.warning;
    default:
      return colors.primary.blue;
  }
};

/**
 * Styled component for the notification item container
 */
const Container = styled.TouchableOpacity`
  flex-direction: row;
  padding: 16px;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-bottom-color: ${colors.ui.border};
  background-color: ${colors.ui.background};
`;

/**
 * Styled component for the notification icon container
 */
const IconContainer = styled.View<{ notificationType: string }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  background-color: ${props => getNotificationColor(props.notificationType)};
`;

/**
 * Styled component for the notification content container
 */
const ContentContainer = styled.View`
  flex: 1;
`;

/**
 * Styled component for the notification title
 */
const Title = styled.Text<{ isRead: boolean }>`
  font-size: 16px;
  font-weight: ${props => (props.isRead ? 'normal' : 'bold')};
  color: ${colors.text.primary};
  margin-bottom: 4px;
`;

/**
 * Styled component for the notification message
 */
const Message = styled.Text`
  font-size: 14px;
  color: ${colors.text.secondary};
  margin-bottom: 8px;
  /* Limiting the message to two lines */
  numberOfLines: 2;
`;

/**
 * Styled component for the notification timestamp
 */
const Timestamp = styled.Text`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

/**
 * Styled component for the unread indicator
 */
const UnreadIndicator = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${colors.primary.blue};
  position: absolute;
  top: 16px;
  right: 16px;
`;

/**
 * Component that renders an individual notification item
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onMarkAsRead }) => {
  // Destructure props to get notification, onPress, and onMarkAsRead
  const { id, notificationType, title, message, createdAt, isRead } = notification;

  // Determine icon and color based on notification type
  const iconName = getNotificationIcon(notificationType);
  const iconColor = getNotificationColor(notificationType);

  // Format the notification timestamp using date-fns
  const formattedTimestamp = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
  });

  // Render a TouchableOpacity container for the entire notification
  return (
    <Container
      onPress={() => {
        // Handle onPress event to navigate to relevant screen
        onPress(notification);

        // Handle onMarkAsRead event when notification is read
        if (!isRead) {
          onMarkAsRead(id);
        }
      }}
      activeOpacity={0.7}
    >
      {/* Render notification icon based on type */}
      <IconContainer notificationType={notificationType}>
        <Text style={{ color: colors.text.inverse, fontSize: 20 }}>{iconName}</Text>
      </IconContainer>

      {/* Render notification content */}
      <ContentContainer>
        {/* Render notification title with appropriate styling */}
        <Title isRead={isRead}>{title}</Title>

        {/* Render notification message with truncation if needed */}
        <Message>{message}</Message>

        {/* Render notification timestamp */}
        <Timestamp>{formattedTimestamp}</Timestamp>
      </ContentContainer>

      {/* Render unread indicator if notification is not read */}
      {!isRead && <UnreadIndicator />}
    </Container>
  );
};

// Export the NotificationItem component for use in the NotificationsScreen
export default NotificationItem;