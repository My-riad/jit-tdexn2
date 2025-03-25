import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'; // ^0.71.8
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.1.6
import { Ionicons } from '@expo/vector-icons'; // @expo/vector-icons ^13.0.0
import { useSelector, useDispatch } from 'react-redux'; // react-redux ^8.0.5
import styled from 'styled-components/native';
import { colors } from '../styles/colors';
import NotificationItem from '../components/NotificationItem';
import useNotifications from '../hooks/useNotifications';
import { ProfileNavigationProp } from '../navigation/types';
import { DriverNotificationType } from '../services/notificationService';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';

// Define the type for the navigation prop
interface NotificationsScreenProps {
  navigation: ProfileNavigationProp;
}

// Define the filter options
const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: DriverNotificationType.LOAD_OPPORTUNITY, label: 'Loads' },
  { id: DriverNotificationType.LOAD_STATUS, label: 'Status' },
  { id: DriverNotificationType.ACHIEVEMENT, label: 'Achievements' },
  { id: DriverNotificationType.BONUS_ZONE, label: 'Bonus Zones' },
  { id: DriverNotificationType.SMART_HUB, label: 'Smart Hubs' },
  { id: DriverNotificationType.SYSTEM, label: 'System' },
];

// Styled components for UI elements
const Container = styled.View`
  flex: 1;
  backgroundColor: ${colors.ui.background};
`;

const Header = styled.View`
  flexDirection: row;
  justifyContent: space-between;
  alignItems: center;
  padding: 16px;
  borderBottomWidth: 1px;
  borderBottomColor: ${colors.ui.border};
`;

const Title = styled.Text`
  fontSize: 20px;
  fontWeight: bold;
  color: ${colors.text.primary};
`;

const ActionButton = styled.TouchableOpacity`
  padding: 8px;
`;

const FilterContainer = styled.View`
  flexDirection: row;
  padding: 8px;
  borderBottomWidth: 1px;
  borderBottomColor: ${colors.ui.border};
`;

interface FilterTabProps {
  isActive: boolean;
}

const FilterTab = styled.TouchableOpacity<FilterTabProps>`
  paddingVertical: 8px;
  paddingHorizontal: 12px;
  marginRight: 8px;
  borderRadius: 16px;
  backgroundColor: ${props => (props.isActive ? colors.primary.blue : colors.ui.background)};
`;

interface FilterTabTextProps {
  isActive: boolean;
}

const FilterTabText = styled.Text<FilterTabTextProps>`
  color: ${props => (props.isActive ? colors.text.inverse : colors.text.secondary)};
  fontSize: 14px;
`;

const EmptyContainer = styled.View`
  flex: 1;
  justifyContent: center;
  alignItems: center;
  padding: 24px;
`;

const EmptyText = styled.Text`
  fontSize: 16px;
  color: ${colors.text.secondary};
  textAlign: center;
  marginTop: 16px;
`;

/**
 * Screen component that displays a list of notifications for the driver
 */
const NotificationsScreen: React.FC<NotificationsScreenProps> = () => {
  // LD1: Get the navigation object using useNavigation hook
  const navigation = useNavigation<ProfileNavigationProp>();

  // LD2: Get the current user/driver ID from Redux state
  const driverId = useSelector((state: any) => state.auth.user?.driverId);

  // LD3: Initialize the useNotifications hook with the driver ID
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(driverId, {
    enableLocationBasedNotifications: false,
    locationNotificationRadius: 50,
    locationUpdateInterval: 60000,
    enableRealTimeUpdates: true,
    autoSyncOfflineNotifications: true,
  });

  // LD4: Set up state for filter options and selected filter
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // LD5: Create a function to handle notification press that navigates to the appropriate screen based on notification type
  const handleNotificationPress = useCallback((notification: any) => {
    // TODO: Implement navigation logic based on notification type
    console.log('Notification pressed:', notification);
  }, []);

  // LD6: Create a function to handle marking a notification as read
  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsRead(notificationId);
    },
    [markAsRead]
  );

  // LD7: Create a function to handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // LD8: Create a function to handle deleting a notification
  const handleDeleteNotification = useCallback(
    (notificationId: string) => {
      deleteNotification(notificationId);
    },
    [deleteNotification]
  );

  // LD9: Create a function to handle refreshing the notifications list
  const handleRefresh = useCallback(() => {
    fetchNotifications({ type: selectedFilter === 'all' ? undefined : selectedFilter });
  }, [fetchNotifications, selectedFilter]);

  // LD10: Create a function to filter notifications by type
  const handleFilterSelect = useCallback((filterId: string) => {
    setSelectedFilter(filterId);
    fetchNotifications({ type: filterId === 'all' ? undefined : filterId });
  }, [fetchNotifications]);

  // LD11: Set up useEffect to fetch notifications when the screen mounts
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // LD12: Render the screen header with title and action buttons
  return (
    <Container>
      <Header>
        <Title>Notifications</Title>
        <ActionButton onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.primary.blue} />
        </ActionButton>
      </Header>

      {/* LD13: Render filter tabs for different notification types */}
      <FilterContainer>
        {FILTER_OPTIONS.map((filter) => (
          <FilterTab
            key={filter.id}
            onPress={() => handleFilterSelect(filter.id)}
            isActive={selectedFilter === filter.id}
          >
            <FilterTabText isActive={selectedFilter === filter.id}>{filter.label}</FilterTabText>
          </FilterTab>
        ))}
      </FilterContainer>

      {/* LD14: Render the FlatList of notifications with the NotificationItem component */}
      {loading ? (
        <LoadingIndicator />
      ) : error ? (
        <Alert severity="error" message={error} />
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
        />
      ) : (
        // LD15: Render empty state when no notifications are available
        <EmptyContainer>
          <Ionicons name="notifications-off-outline" size={64} color={colors.text.secondary} />
          <EmptyText>No notifications yet</EmptyText>
        </EmptyContainer>
      )}
    </Container>
  );
};

// LD16: Export the NotificationsScreen component as the default export
export default NotificationsScreen;