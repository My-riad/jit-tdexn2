import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components
import Section from '../../../shared/components/layout/Section';
import Heading from '../../../shared/components/typography/Heading';
import Toggle from '../../../shared/components/forms/Toggle';
import Checkbox from '../../../shared/components/forms/Checkbox';
import Button from '../../../shared/components/buttons/Button';
import useForm from '../../../common/hooks/useForm';
import settingsService from '../../services/settingsService';
import notificationService from '../../../common/services/notificationService';
import { NotificationPreference } from '../../../common/interfaces/tracking.interface';
import { useAuth } from '../../../common/hooks/useAuth';

// Define the props for the NotificationSettings component
interface NotificationSettingsProps {
  // No props are currently defined, but this interface can be extended in the future
}

// Define the structure for grouped notification preferences by category
interface NotificationCategory {
  categoryName: string;
  categoryDescription: string;
  preferences: NotificationPreference[];
}

// Define styled components for consistent styling
const NotificationSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CategorySection = styled.div`
  margin-bottom: 2rem;
`;

const NotificationTypeRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
`;

const NotificationTypeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const NotificationTypeInfo = styled.div`
  flex: 1;
`;

const NotificationTypeName = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
`;

const NotificationTypeDescription = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #666;
`;

const ChannelsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-left: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const SuccessMessage = styled.div`
  color: #34A853;
  margin-right: 1rem;
  align-self: center;
`;

// Define constants for notification categories and channels
const NOTIFICATION_CATEGORIES = [
  { id: 'load', name: 'Load Notifications', description: 'Notifications related to loads and shipments' },
  { id: 'system', name: 'System Notifications', description: 'Important system alerts and updates' },
  { id: 'carrier', name: 'Carrier Notifications', description: 'Updates about carriers and their performance' },
  { id: 'market', name: 'Market Intelligence', description: 'Market insights, rate changes, and forecasts' },
  { id: 'account', name: 'Account Notifications', description: 'Account-related alerts and security updates' },
];

const NOTIFICATION_CHANNELS = [
  { id: 'email', name: 'Email', icon: 'email' },
  { id: 'sms', name: 'SMS', icon: 'sms' },
  { id: 'push', name: 'Push Notifications', icon: 'push' },
  { id: 'in_app', name: 'In-App', icon: 'app' },
];

/**
 * Component for managing notification preferences
 * @returns Rendered notification settings component
 */
const NotificationSettings: React.FC<NotificationSettingsProps> = () => {
  // LD1: Get current user information using useAuth hook
  const { authState } = useAuth();
  const userId = authState.user?.id;

  // LD1: Initialize state for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);

  // LD1: Initialize state for loading status
  const [loading, setLoading] = useState(false);

  // LD1: Initialize state for save success message
  const [saveSuccess, setSaveSuccess] = useState(false);

  // LD1: Initialize form state using useForm hook
  const { values, handleChange, handleSubmit, isSubmitting } = useForm({
    initialValues: {},
    onSubmit: async () => {
      if (!userId) return;
      setLoading(true);
      setSaveSuccess(false);
      try {
        // LD1: Call the notificationService to update user preferences
        await settingsService.updateNotificationPreferences(userId, notificationPreferences);
        setSaveSuccess(true);
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  // LD1: Fetch notification preferences when component mounts
  useEffect(() => {
    if (!userId) return;

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        // LD1: Call the notificationService to get user preferences
        const preferences = await settingsService.getNotificationPreferences(userId);
        setNotificationPreferences(preferences);

        // LD1: Initialize form values based on fetched preferences
        const initialValues: { [key: string]: any } = {};
        preferences.forEach(pref => {
          initialValues[pref.type] = pref.enabled;
          NOTIFICATION_CHANNELS.forEach(channel => {
            initialValues[`${pref.type}_${channel.id}`] = pref.channels.includes(channel.id);
          });
        });
        // LD1: Set the initial values for the form
        handleChange({
          target: {
            name: 'initialValues',
            value: initialValues,
          },
        } as any);
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId, handleChange]);

  // LD1: Group notification preferences by category
  const groupedPreferences: NotificationCategory[] = NOTIFICATION_CATEGORIES.map(category => ({
    categoryName: category.name,
    categoryDescription: category.description,
    preferences: notificationPreferences.filter(pref => pref.type.startsWith(category.id)),
  }));

  // LD1: Handle toggle changes for notification types
  const handleToggleChange = (type: string, enabled: boolean) => {
    setNotificationPreferences(prevPreferences => {
      return prevPreferences.map(pref => {
        if (pref.type === type) {
          return { ...pref, enabled: enabled };
        }
        return pref;
      });
    });
  };

  // LD1: Handle checkbox changes for notification channels
  const handleCheckboxChange = (type: string, channel: string, checked: boolean) => {
    setNotificationPreferences(prevPreferences => {
      return prevPreferences.map(pref => {
        if (pref.type === type) {
          let newChannels = [...pref.channels];
          if (checked) {
            if (!newChannels.includes(channel)) {
              newChannels.push(channel);
            }
          } else {
            newChannels = newChannels.filter(c => c !== channel);
          }
          return { ...pref, channels: newChannels };
        }
        return pref;
      });
    });
  };

  // LD1: Render notification settings form with sections for each category
  return (
    <NotificationSettingsContainer>
      {groupedPreferences.map(category => (
        <CategorySection key={category.categoryName}>
          <Heading level={3}>{category.categoryName}</Heading>
          <p>{category.categoryDescription}</p>
          {category.preferences.map(pref => (
            <NotificationTypeRow key={pref.type}>
              <NotificationTypeHeader>
                <NotificationTypeInfo>
                  <NotificationTypeName>{pref.name}</NotificationTypeName>
                  <NotificationTypeDescription>{pref.description}</NotificationTypeDescription>
                </NotificationTypeInfo>
                <Toggle
                  name={pref.type}
                  checked={pref.enabled}
                  onChange={(enabled) => handleToggleChange(pref.type, enabled)}
                />
              </NotificationTypeHeader>
              <ChannelsContainer>
                {NOTIFICATION_CHANNELS.map(channel => (
                  <Checkbox
                    key={channel.id}
                    name={`${pref.type}_${channel.id}`}
                    label={channel.name}
                    checked={pref.channels.includes(channel.id)}
                    onChange={(e) => handleCheckboxChange(pref.type, channel.id, e.target.checked)}
                    disabled={!pref.enabled}
                  />
                ))}
              </ChannelsContainer>
            </NotificationTypeRow>
          ))}
        </CategorySection>
      ))}
      <ButtonContainer>
        {saveSuccess && <SuccessMessage>Preferences saved!</SuccessMessage>}
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || loading}>
          {isSubmitting || loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </ButtonContainer>
    </NotificationSettingsContainer>
  );
};

// LD2: Export the NotificationSettings component as the default export
export default NotificationSettings;

// LD2: Export the NotificationSettingsProps interface
export type { NotificationSettingsProps };