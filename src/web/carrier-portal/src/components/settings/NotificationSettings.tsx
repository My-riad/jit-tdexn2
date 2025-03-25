// React v18.2.0
import React, { useState, useEffect, useCallback } from 'react';
// react-redux 8.1.1
import { useDispatch, useSelector } from 'react-redux';
// styled-components v5.3.6
import styled from 'styled-components';

import {
  NotificationPreference,
} from '../../../common/interfaces';
import {
  getPreferencesRequest,
  updatePreferencesRequest,
} from '../../store/actions/notificationActions';
import Form from '../../../shared/components/forms/Form';
import Toggle from '../../../shared/components/forms/Toggle';
import Checkbox from '../../../shared/components/forms/Checkbox';

/**
 * @dev LD1: Main container for the notification settings component
 */
const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

/**
 * @dev LD1: Title for each settings section
 */
const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

/**
 * @dev LD1: Container for a group of related settings
 */
const Section = styled.div`
  margin-bottom: 32px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.background.card};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

/**
 * @dev LD1: Row containing a single notification setting
 */
const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};

  &:last-child {
    border-bottom: none;
  }
`;

/**
 * @dev LD1: Label for a notification setting
 */
const SettingLabel = styled.div`
  flex: 1;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.primary};
`;

/**
 * @dev LD1: Description text for a notification setting
 */
const SettingDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 4px;
`;

/**
 * @dev LD1: Section for notification channel options
 */
const ChannelSection = styled.div`
  margin-top: 8px;
  padding-left: 16px;
`;

/**
 * @dev LD1: Container for form buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

/**
 * @dev LD1: Button to save notification preferences
 */
interface SaveButtonProps {
  disabled?: boolean;
}

const SaveButton = styled.button<SaveButtonProps>`
  padding: 10px 24px;
  background-color: ${({ theme, disabled }) =>
    disabled ? theme.colors.neutral.mediumGray : theme.colors.primary.blue};
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s ease;
`;

/**
 * @dev LD1: Interface for the form values in the notification settings form
 */
interface NotificationSettingsFormValues {
  notificationTypes: Record<string, boolean>;
  channels: Record<string, boolean>;
}

/**
 * @dev LD1: Component that renders the notification settings form with toggles for different notification types and channels
 */
const NotificationSettings: React.FC = () => {
  // LD1: Initialize Redux dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // LD1: Select notification preferences and loading state from Redux store using useSelector
  const notificationPreferences = useSelector<any, NotificationPreference[]>(
    (state) => state.notification.preferences
  );
  const loading = useSelector<any, boolean>((state) => state.notification.loading);

  // LD1: Create local state for form values using useState hook
  const [formValues, setFormValues] = useState<NotificationSettingsFormValues>({
    notificationTypes: {},
    channels: {},
  });

  // LD1: Fetch notification preferences when component mounts using useEffect
  useEffect(() => {
    dispatch(getPreferencesRequest());
  }, [dispatch]);

  // LD1: Transform notification preferences from API format to form values format when preferences change
  useEffect(() => {
    if (notificationPreferences && notificationPreferences.length > 0) {
      const initialFormValues: NotificationSettingsFormValues = {
        notificationTypes: {},
        channels: {},
      };

      notificationPreferences.forEach((pref) => {
        if (pref.type === 'notificationType') {
          initialFormValues.notificationTypes[pref.id] = pref.enabled;
        } else if (pref.type === 'channel') {
          initialFormValues.channels[pref.id] = pref.enabled;
        }
      });

      setFormValues(initialFormValues);
    }
  }, [notificationPreferences]);

  // LD1: Define form submission handler that dispatches updatePreferencesRequest action
  const handleSubmit = useCallback(
    async () => {
      const preferencesToUpdate: NotificationPreference[] = [];

      Object.keys(formValues.notificationTypes).forEach((id) => {
        preferencesToUpdate.push({
          id,
          enabled: formValues.notificationTypes[id],
          type: 'notificationType',
        });
      });

      Object.keys(formValues.channels).forEach((id) => {
        preferencesToUpdate.push({
          id,
          enabled: formValues.channels[id],
          type: 'channel',
        });
      });

      dispatch(updatePreferencesRequest(preferencesToUpdate));
    },
    [dispatch, formValues]
  );

  // LD1: Render the component with a Form wrapper
  return (
    <Container>
      <Form
        initialValues={formValues}
        onSubmit={handleSubmit}
      >
        {/* LD1: Render section for notification types (load updates, driver updates, system alerts, etc.) */}
        <Section>
          <SectionTitle>Notification Types</SectionTitle>
          <SettingRow>
            <SettingLabel>Load Updates</SettingLabel>
            <Toggle
              name="notificationTypes.loadUpdates"
              checked={formValues.notificationTypes.loadUpdates || false}
              onChange={(checked) =>
                setFormValues({
                  ...formValues,
                  notificationTypes: {
                    ...formValues.notificationTypes,
                    loadUpdates: checked,
                  },
                })
              }
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>Driver Updates</SettingLabel>
            <Toggle
              name="notificationTypes.driverUpdates"
              checked={formValues.notificationTypes.driverUpdates || false}
              onChange={(checked) =>
                setFormValues({
                  ...formValues,
                  notificationTypes: {
                    ...formValues.notificationTypes,
                    driverUpdates: checked,
                  },
                })
              }
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>System Alerts</SettingLabel>
            <Toggle
              name="notificationTypes.systemAlerts"
              checked={formValues.notificationTypes.systemAlerts || false}
              onChange={(checked) =>
                setFormValues({
                  ...formValues,
                  notificationTypes: {
                    ...formValues.notificationTypes,
                    systemAlerts: checked,
                  },
                })
              }
            />
          </SettingRow>
        </Section>

        {/* LD1: Render section for notification channels (in-app, email, SMS, etc.) */}
        <Section>
          <SectionTitle>Notification Channels</SectionTitle>
          <SettingRow>
            <SettingLabel>In-App</SettingLabel>
            <Checkbox
              name="channels.inApp"
              checked={formValues.channels.inApp || false}
              onChange={(event) =>
                setFormValues({
                  ...formValues,
                  channels: {
                    ...formValues.channels,
                    inApp: event.target.checked,
                  },
                })
              }
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>Email</SettingLabel>
            <Checkbox
              name="channels.email"
              checked={formValues.channels.email || false}
              onChange={(event) =>
                setFormValues({
                  ...formValues,
                  channels: {
                    ...formValues.channels,
                    email: event.target.checked,
                  },
                })
              }
            />
          </SettingRow>
          <SettingRow>
            <SettingLabel>SMS</SettingLabel>
            <Checkbox
              name="channels.sms"
              checked={formValues.channels.sms || false}
              onChange={(event) =>
                setFormValues({
                  ...formValues,
                  channels: {
                    ...formValues.channels,
                    sms: event.target.checked,
                  },
                })
              }
            />
          </SettingRow>
        </Section>

        {/* LD1: Render save button that submits the form */}
        <ButtonContainer>
          <SaveButton type="submit" disabled={loading}>
            Save
          </SaveButton>
        </ButtonContainer>

        {/* LD1: Show loading indicator when preferences are being updated */}
        {loading && <p>Updating preferences...</p>}
      </Form>
    </Container>
  );
};

// LD2: Export form context for use in custom form components
export default NotificationSettings;