import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import { Delete, CheckCircle, Settings, Refresh, FilterList } from '@mui/icons-material'; // version ^5.11.0

import { MainLayout } from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import {
  getNotificationsRequest,
  markAsReadRequest,
  markAllAsReadRequest,
  deleteNotificationRequest,
  getPreferencesRequest,
  updatePreferencesRequest,
} from '../store/actions/notificationActions';
import Button from '../../../shared/components/buttons/Button';
import IconButton from '../../../shared/components/buttons/IconButton';
import Card from '../../../shared/components/cards/Card';
import Tabs from '../../../shared/components/navigation/Tabs';
import Pagination from '../../../shared/components/navigation/Pagination';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import Badge from '../../../shared/components/feedback/Badge';
import Modal from '../../../shared/components/feedback/Modal';
import Checkbox from '../../../shared/components/forms/Checkbox';
import Select from '../../../shared/components/forms/Select';
import Text from '../../../shared/components/typography/Text';
import Heading from '../../../shared/components/typography/Heading';
import { theme } from '../../../shared/styles/theme';
import { formatDate, formatTime } from '../../../common/utils/dateTimeUtils';
import { Notification, NotificationPreference } from '../../../common/interfaces/tracking.interface';

// Constants
const ITEMS_PER_PAGE = 10;
const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'system', label: 'System' },
  { value: 'load', label: 'Load' },
  { value: 'driver', label: 'Driver' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'payment', label: 'Payment' },
];
const TABS = [
  { id: 'all', label: 'All Notifications' },
  { id: 'unread', label: 'Unread' },
];

// Interfaces
interface NotificationFilter {
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  read: boolean | null;
}

interface ConfirmationModalState {
  open: boolean;
  notificationId: string | null;
  title: string;
  message: string;
}

// Styled Components
const PageContainer = styled.div`
  Padding: ${theme.spacing.lg};
  Display: flex;
  Flex-direction: column;
  Gap: ${theme.spacing.md};
`;

const FilterContainer = styled.div`
  Display: flex;
  Justify-content: space-between;
  Align-items: center;
  Margin-bottom: ${theme.spacing.md};
  Flex-wrap: wrap;
  Gap: ${theme.spacing.sm};
`;

const FilterControls = styled.div`
  Display: flex;
  Align-items: center;
  Gap: ${theme.spacing.sm};
`;

const ActionButtons = styled.div`
  Display: flex;
  Gap: ${theme.spacing.sm};
`;

const NotificationList = styled.div`
  Display: flex;
  Flex-direction: column;
  Gap: ${theme.spacing.md};
`;

const NotificationItem = styled(Card)<{ isRead: boolean }>`
  Padding: ${theme.spacing.md};
  Border-left: 4px solid;
  Border-left-color: ${props => props.isRead ? theme.colors.gray[300] : theme.colors.primary.main};
  Background-color: ${props => props.isRead ? theme.colors.background.paper : theme.colors.background.hover};
  Transition: all 0.2s ease-in-out;
`;

const NotificationHeader = styled.div`
  Display: flex;
  Justify-content: space-between;
  Align-items: flex-start;
  Margin-bottom: ${theme.spacing.sm};
`;

const NotificationTitle = styled.div`
  Font-weight: bold;
  Margin-bottom: ${theme.spacing.xs};
`;

const NotificationMeta = styled.div`
  Display: flex;
  Align-items: center;
  Gap: ${theme.spacing.sm};
  Color: ${theme.colors.text.secondary};
  Font-size: 0.875rem;
`;

const NotificationActions = styled.div`
  Display: flex;
  Gap: ${theme.spacing.xs};
`;

const NotificationContent = styled.div`
  Margin-bottom: ${theme.spacing.sm};
`;

const EmptyState = styled.div`
  Display: flex;
  Flex-direction: column;
  Align-items: center;
  Justify-content: center;
  Padding: ${theme.spacing.xl};
  Text-align: center;
  Color: ${theme.colors.text.secondary};
`;

const PaginationContainer = styled.div`
  Display: flex;
  Justify-content: center;
  Margin-top: ${theme.spacing.lg};
`;

const PreferencesContainer = styled.div`
  Display: flex;
  Flex-direction: column;
  Gap: ${theme.spacing.md};
`;

const PreferenceGroup = styled.div`
  Margin-bottom: ${theme.spacing.md};
`;

const PreferenceItem = styled.div`
  Display: flex;
  Align-items: center;
  Gap: ${theme.spacing.md};
  Margin-bottom: ${theme.spacing.sm};
`;

/**
 * Main component for the notifications page that displays and manages user notifications
 */
const NotificationsPage: React.FC = () => {
  // Initialize state for active tab, page number, filter options, and confirmation modals
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: null,
    startDate: null,
    endDate: null,
    read: null,
  });
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    open: false,
    notificationId: null,
    title: '',
    message: '',
  });
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  // Get notification state from Redux store using useSelector
  const notificationsData = useSelector((state: any) => state.notification);

  // Get dispatch function using useDispatch
  const dispatch = useDispatch();

  // Create fetchNotifications function to load notifications with filters and pagination
  const fetchNotifications = useCallback(() => {
    dispatch(
      getNotificationsRequest({
        page,
        limit: ITEMS_PER_PAGE,
        type: filter.type,
        startDate: filter.startDate,
        endDate: filter.endDate,
        read: activeTab === 'unread' ? false : filter.read,
      })
    );
  }, [activeTab, dispatch, filter, page]);

  // Create handleTabChange function to switch between all/unread notifications
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage(1); // Reset page to 1 when tab changes
  };

  // Create handlePageChange function for pagination navigation
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Create handleMarkAsRead function to mark a notification as read
  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markAsReadRequest(notificationId));
  };

  // Create handleMarkAllAsRead function to mark all notifications as read
  const handleMarkAllAsRead = () => {
    setConfirmationModal({
      open: true,
      notificationId: null,
      title: 'Mark All as Read?',
      message: 'Are you sure you want to mark all notifications as read?',
    });
  };

  // Create handleDeleteNotification function to delete a notification
  const handleDeleteNotification = (notificationId: string) => {
    setConfirmationModal({
      open: true,
      notificationId,
      title: 'Delete Notification?',
      message: 'Are you sure you want to delete this notification?',
    });
  };

  // Create handleFilterChange function to update filter options
  const handleFilterChange = (newFilter: NotificationFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset page to 1 when filters change
  };

  // Create handleOpenPreferences function to open preferences modal
  const handleOpenPreferences = () => {
    dispatch(getPreferencesRequest());
    setPreferencesModalOpen(true);
  };

  // Create handleUpdatePreferences function to save notification preferences
  const handleUpdatePreferences = (updatedPreferences: NotificationPreference[]) => {
    dispatch(updatePreferencesRequest(updatedPreferences));
    setPreferencesModalOpen(false);
  };

  // Implement useEffect to fetch notifications on component mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Implement useEffect to fetch notification preferences on component mount
  useEffect(() => {
    dispatch(getPreferencesRequest());
  }, [dispatch]);

  // Render MainLayout as the page container
  return (
    <MainLayout>
      {/* Render PageHeader with title and action buttons */}
      <PageHeader
        title="Notifications"
        actions={[
          <Button key="markAllRead" variant="secondary" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>,
          <IconButton key="settings" ariaLabel="Notification Settings" onClick={handleOpenPreferences}>
            <Settings />
          </IconButton>,
          <IconButton key="refresh" ariaLabel="Refresh Notifications" onClick={fetchNotifications}>
            <Refresh />
          </IconButton>,
        ]}
      >
        {/* Render filter controls (tabs, dropdown filters) */}
        <FilterContainer>
          <Tabs tabs={TABS} activeTabId={activeTab} onChange={handleTabChange} />
          <FilterControls>
            <Select
              options={NOTIFICATION_TYPES}
              value={filter.type || ''}
              onChange={(e) => handleFilterChange({ ...filter, type: e.target.value })}
            />
            <IconButton ariaLabel="Filter Notifications">
              <FilterList />
            </IconButton>
          </FilterControls>
        </FilterContainer>
      </PageHeader>

      {/* Render notification list with pagination */}
      {notificationsData.loading ? (
        <LoadingIndicator />
      ) : notificationsData.error ? (
        <Alert severity="error" message={notificationsData.error} />
      ) : notificationsData.notifications.length > 0 ? (
        <NotificationList>
          {notificationsData.notifications.map((notification) => (
            <NotificationItem key={notification.id} isRead={notification.read}>
              <NotificationHeader>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationMeta>
                  <Badge variant={notification.type === 'success' ? 'success' : notification.type === 'error' ? 'error' : 'info'}>
                    {notification.type}
                  </Badge>
                  <Text variant="caption">{formatDate(notification.createdAt)}</Text>
                  <Text variant="caption">{formatTime(notification.createdAt)}</Text>
                </NotificationMeta>
              </NotificationHeader>
              <NotificationContent>{notification.message}</NotificationContent>
              <NotificationActions>
                {!notification.read && (
                  <IconButton ariaLabel="Mark as Read" onClick={() => handleMarkAsRead(notification.id)}>
                    <CheckCircle />
                  </IconButton>
                )}
                <IconButton ariaLabel="Delete Notification" onClick={() => handleDeleteNotification(notification.id)}>
                  <Delete />
                </IconButton>
              </NotificationActions>
            </NotificationItem>
          ))}
        </NotificationList>
      ) : (
        <EmptyState>
          <Heading level={3}>No notifications found</Heading>
          <Text>You have no new notifications.</Text>
        </EmptyState>
      )}

      {/* Render pagination component */}
      <PaginationContainer>
        <Pagination
          currentPage={page}
          totalPages={notificationsData.totalPages}
          onPageChange={handlePageChange}
        />
      </PaginationContainer>

      {/* Render confirmation modals for mark all as read and delete actions */}
      <Modal
        isOpen={confirmationModal.open}
        onClose={() => setConfirmationModal({ ...confirmationModal, open: false, notificationId: null })}
        title={confirmationModal.title}
      >
        <Text>{confirmationModal.message}</Text>
        <Button onClick={() => setConfirmationModal({ ...confirmationModal, open: false, notificationId: null })}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (confirmationModal.notificationId) {
              dispatch(deleteNotificationRequest(confirmationModal.notificationId));
            } else {
              dispatch(markAllAsReadRequest());
            }
            setConfirmationModal({ ...confirmationModal, open: false, notificationId: null });
          }}
        >
          Confirm
        </Button>
      </Modal>

      {/* Render preferences modal for managing notification settings */}
      <Modal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        title="Notification Preferences"
      >
        <PreferencesContainer>
          {notificationsData.preferences.map((pref) => (
            <PreferenceGroup key={pref.id}>
              <Heading level={4}>{pref.type}</Heading>
              {pref.channels.map((channel) => (
                <PreferenceItem key={channel.id}>
                  <Checkbox
                    name={channel.id}
                    checked={channel.enabled}
                    label={channel.name}
                    onChange={(e) => {
                      const updatedPrefs = notificationsData.preferences.map((p) =>
                        p.id === pref.id
                          ? {
                              ...p,
                              channels: p.channels.map((c) =>
                                c.id === channel.id ? { ...c, enabled: e.target.checked } : c
                              ),
                            }
                          : p
                      );
                      handleUpdatePreferences(updatedPrefs);
                    }}
                  />
                </PreferenceItem>
              ))}
            </PreferenceGroup>
          ))}
        </PreferencesContainer>
        <Button onClick={() => setPreferencesModalOpen(false)}>Cancel</Button>
        <Button variant="primary" onClick={() => setPreferencesModalOpen(false)}>
          Save
        </Button>
      </Modal>
    </MainLayout>
  );
};

export default NotificationsPage;