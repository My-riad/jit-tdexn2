import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { formatDistanceToNow } from 'date-fns'; // version ^2.29.3
import { Notifications, Settings, Delete, CheckCircle } from '@mui/icons-material'; // version ^5.11.0
import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import Container from '../../shared/components/layout/Container';
import Card from '../../shared/components/cards/Card';
import Tabs from '../../shared/components/navigation/Tabs';
import Button from '../../shared/components/buttons/Button';
import IconButton from '../../shared/components/buttons/IconButton';
import Dropdown from '../../shared/components/forms/Dropdown';
import Toggle from '../../shared/components/forms/Toggle';
import LoadingIndicator from '../../shared/components/feedback/LoadingIndicator';
import Pagination from '../../shared/components/navigation/Pagination';
import Text from '../../shared/components/typography/Text';
import { useNotificationContext } from '../../common/contexts/NotificationContext';
import { theme } from '../../shared/styles/theme';
import { Notification, NotificationPreference } from '../../common/interfaces/tracking.interface';

// LD1: Define styled components for layout and styling
const NotificationsContainer = styled(Container)`
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const TabsContainer = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

interface NotificationCardProps {
  isRead?: boolean;
  color?: string;
}

const NotificationCard = styled(Card)<NotificationCardProps>`
  padding: ${theme.spacing.md};
  border-left: 4px solid ${props => props.isRead ? theme.colors.border.light : props.color || theme.colors.primary.main};
  background-color: ${props => props.isRead ? 'transparent' : theme.colors.background.hover};
  transition: background-color 0.2s ease;
`;

const NotificationContent = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-start;
`;

const NotificationIcon = styled.div<{ color?: string }>`
  color: ${props => props.color || theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NotificationDetails = styled.div`
  flex: 1;
`;

interface NotificationMessageProps {
  isRead?: boolean;
}

const NotificationMessage = styled(Text)<NotificationMessageProps>`
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${props => props.isRead ? 'normal' : 'bold'};
`;

const NotificationTime = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${theme.colors.text.secondary};
`;

const PaginationContainer = styled.div`
  margin-top: ${theme.spacing.lg};
  display: flex;
  justify-content: center;
`;

const PreferenceSection = styled(Card)`
  margin-bottom: ${theme.spacing.lg};
  padding: ${theme.spacing.lg};
`;

const PreferenceSectionTitle = styled(Text)`
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

const PreferenceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} 0;
  border-bottom: 1px solid ${theme.colors.border.light};

  &:last-child {
    border-bottom: none;
  }
`;

const PreferenceInfo = styled.div`
  flex: 1;
  margin-right: ${theme.spacing.md};
`;

const PreferenceLabel = styled(Text)`
  font-weight: 500;
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.text.primary};
`;

const PreferenceDescription = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 0.9rem;
`;

// LD1: Define interfaces for component props
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

interface NotificationsTabProps {
  notifications: Notification[];
  loading: boolean;
  filters: { type: string; readStatus: string };
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onFilterChange: (filterType: string, value: string) => void;
  onPageChange: (page: number) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

interface PreferencesTabProps {
  preferences: NotificationPreference[];
  loading: boolean;
  onPreferenceChange: (preferenceId: string, enabled: boolean) => void;
}

// LD1: Helper function to get the appropriate icon based on notification type
const getNotificationIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'warning':
      return <Notifications />;
    case 'error':
      return <Delete />;
    default:
      return <Notifications />;
  }
};

// LD1: Helper function to get the appropriate color based on notification type
const getNotificationColor = (type: string): string => {
  switch (type) {
    case 'success':
      return theme.colors.semantic.success;
    case 'warning':
      return theme.colors.semantic.warning;
    case 'error':
      return theme.colors.semantic.error;
    default:
      return theme.colors.primary.main;
  }
};

// LD1: Component that renders a single notification item
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onDelete }) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  return (
    <NotificationCard isRead={notification.read} color={color}>
      <NotificationContent>
        <NotificationIcon color={color}>{icon}</NotificationIcon>
        <NotificationDetails>
          <NotificationMessage isRead={notification.read}>{notification.message}</NotificationMessage>
          <NotificationTime>{timeAgo}</NotificationTime>
        </NotificationDetails>
      </NotificationContent>
      <NotificationActions>
        <IconButton variant="ghost" size="small" onClick={() => onMarkAsRead(notification.id)} ariaLabel="Mark as read">
          <CheckCircle fontSize="small" />
        </IconButton>
        <IconButton variant="ghost" size="small" onClick={() => onDelete(notification.id)} ariaLabel="Delete notification">
          <Delete fontSize="small" />
        </IconButton>
      </NotificationActions>
    </NotificationCard>
  );
};

// LD1: Component that renders the notifications tab content
const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  loading,
  filters,
  pagination,
  onFilterChange,
  onPageChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}) => {
  return (
    <div>
      <FiltersContainer>
        <FilterGroup>
          <Text variant="label">Type:</Text>
          <Dropdown
            name="type"
            options={[
              { value: '', label: 'All' },
              { value: 'success', label: 'Success' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ]}
            value={filters.type}
            onChange={(value) => onFilterChange('type', value)}
          />
        </FilterGroup>
        <FilterGroup>
          <Text variant="label">Status:</Text>
          <Dropdown
            name="readStatus"
            options={[
              { value: '', label: 'All' },
              { value: 'unread', label: 'Unread' },
              { value: 'read', label: 'Read' },
            ]}
            value={filters.readStatus}
            onChange={(value) => onFilterChange('readStatus', value)}
          />
        </FilterGroup>
        {notifications.some(notification => !notification.read) && (
          <Button variant="secondary" onClick={onMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </FiltersContainer>
      {loading ? (
        <LoadingIndicator />
      ) : notifications.length === 0 ? (
        <EmptyState>
          <Text>No notifications to display.</Text>
        </EmptyState>
      ) : (
        <>
          <NotificationsList>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </NotificationsList>
          <PaginationContainer>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </PaginationContainer>
        </>
      )}
    </div>
  );
};

// LD1: Component that renders the notification preferences tab content
const PreferencesTab: React.FC<PreferencesTabProps> = ({ preferences, loading, onPreferenceChange }) => {
  const groupedPreferences = preferences.reduce((acc: any, preference) => {
    const category = preference.category || 'System';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(preference);
    return acc;
  }, {});

  return (
    <div>
      {loading ? (
        <LoadingIndicator />
      ) : (
        Object.entries(groupedPreferences).map(([category, prefs]) => (
          <PreferenceSection key={category}>
            <PreferenceSectionTitle>{category}</PreferenceSectionTitle>
            {prefs.map((preference: NotificationPreference) => (
              <PreferenceItem key={preference.id}>
                <PreferenceInfo>
                  <PreferenceLabel>{preference.label}</PreferenceLabel>
                  <PreferenceDescription>{preference.description}</PreferenceDescription>
                </PreferenceInfo>
                <Toggle
                  name={preference.id}
                  checked={preference.enabled}
                  onChange={(enabled) => onPreferenceChange(preference.id, enabled)}
                />
              </PreferenceItem>
            ))}
          </PreferenceSection>
        ))
      )}
    </div>
  );
};

// LD1: Main component for the notifications page that displays and manages user notifications
const NotificationsPage: React.FC = () => {
  // LD1: Get notification state and functions from useNotificationContext hook
  const { notifications, loading, error, preferences, pagination, fetchNotifications, fetchPreferences, markAsRead, markAllAsRead, deleteNotification, updatePreferences } = useNotificationContext();

  // LD1: Initialize state for active tab (notifications or preferences)
  const [activeTab, setActiveTab] = useState('notifications');

  // LD1: Initialize state for filter options (all, unread, type)
  const [filters, setFilters] = useState({ type: '', readStatus: '' });

  // LD1: Initialize state for current page in pagination
  const [currentPage, setCurrentPage] = useState(1);

  // LD1: Create fetchFilteredNotifications function to load notifications with current filters
  const fetchFilteredNotifications = useCallback(() => {
    fetchNotifications({ page: currentPage, type: filters.type, read: filters.readStatus === 'unread' ? false : filters.readStatus === 'read' ? true : undefined });
  }, [currentPage, filters.type, filters.readStatus, fetchNotifications]);

  // LD1: Use useEffect to fetch notifications on component mount and when filters change
  useEffect(() => {
    fetchFilteredNotifications();
  }, [fetchFilteredNotifications]);

  // LD1: Use useEffect to fetch notification preferences on component mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // LD1: Create handleTabChange function to switch between notifications and preferences tabs
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // LD1: Create handleFilterChange function to update filters and refetch notifications
  const handleFilterChange = useCallback((filterType: string, value: string) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterType]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // LD1: Create handlePageChange function to update current page and refetch notifications
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // LD1: Create handleMarkAsRead function to mark a notification as read
  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  // LD1: Create handleMarkAllAsRead function to mark all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // LD1: Create handleDeleteNotification function to delete a notification
  const handleDeleteNotification = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  // LD1: Create handlePreferenceChange function to update notification preferences
  const handlePreferenceChange = useCallback((preferenceId: string, enabled: boolean) => {
    updatePreferences({ [preferenceId]: enabled });
  }, [updatePreferences]);

  // LD1: Render the page with MainLayout component
  return (
    <MainLayout>
      {/* LD1: Render PageHeader with title and actions */}
      <PageHeader title="Notifications" />

      {/* LD1: Render Tabs component for switching between notifications and preferences */}
      <TabsContainer>
        <Tabs
          tabs={[
            { id: 'notifications', label: 'Notifications', content: null },
            { id: 'preferences', label: 'Preferences', content: null },
          ]}
          activeTabId={activeTab}
          onChange={handleTabChange}
        />
      </TabsContainer>

      {/* LD1: Render NotificationsTab or PreferencesTab based on active tab */}
      {activeTab === 'notifications' ? (
        <NotificationsTab
          notifications={notifications}
          loading={loading}
          filters={filters}
          pagination={pagination}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDeleteNotification}
        />
      ) : (
        <PreferencesTab
          preferences={preferences}
          loading={loading}
          onPreferenceChange={handlePreferenceChange}
        />
      )}
    </MainLayout>
  );
};

// IE3: Export the NotificationsPage component as the default export
export default NotificationsPage;