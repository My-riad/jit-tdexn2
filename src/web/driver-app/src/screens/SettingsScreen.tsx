import React, { useState, useEffect, useCallback } from 'react'; // React v18.0.0
import { useNavigation } from '@react-navigation/native'; // version ^6.1.6
import Container from '../../../shared/components/layout/Container';
import Heading from '../../../shared/components/typography/Heading';
import Toggle from '../../../shared/components/forms/Toggle';
import Button from '../../../shared/components/buttons/Button';
import Alert from '../../../shared/components/feedback/Alert';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { useThemeContext } from '../../../common/contexts/ThemeContext';
import notificationService from '../../../common/services/notificationService';
import { StorageService, StorageType } from '../../../common/services/storageService';
import { ProfileNavigationProp } from '../navigation/types';
import { NotificationPreference } from '../../../common/interfaces/tracking.interface';

// LD1: Define the AppSettings interface
interface AppSettings {
  darkMode: boolean;
  locationTracking: boolean;
  dataSaving: boolean;
  autoCheckIn: boolean;
  eldIntegration: boolean;
}

// LD1: Define default values for app settings
const DEFAULT_APP_SETTINGS: AppSettings = {
  darkMode: false,
  locationTracking: true,
  dataSaving: false,
  autoCheckIn: true,
  eldIntegration: true,
};

// LD1: Define storage key for app settings in local storage
const SETTINGS_STORAGE_KEY = 'appSettings';

// LD1: Create a new StorageService instance for managing settings
const settingsStorage = new StorageService(StorageType.LOCAL, 'settings');

// LD1: Define the SettingsSection component
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

// LD1: Implement the SettingsSection component
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section>
    <Heading level={3}>{title}</Heading>
    {children}
  </section>
);

// LD1: Define the SettingItem component
interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

// LD1: Implement the SettingItem component
const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
  <div>
    <label>
      {label}
      {description && <p>{description}</p>}
    </label>
    {children}
  </div>
);

// LD1: Define the SettingsScreen component
interface SettingsScreenProps {
  navigation: ProfileNavigationProp;
}

/**
 * LD1: Main component for the settings screen
 * @returns Rendered settings screen component
 */
const SettingsScreen: React.FC = () => {
  // LD1: Initialize state for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);

  // LD1: Initialize state for app settings like dark mode, location tracking, etc.
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  // LD1: Initialize state for loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // LD1: Initialize state for error and success messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // LD1: Get authentication context using useAuthContext hook
  const { logout } = useAuthContext();

  // LD1: Get theme context using useThemeContext hook
  const { themeMode, toggleTheme } = useThemeContext();

  // LD1: Get navigation object using useNavigation hook
  const navigation = useNavigation<ProfileNavigationProp>();

  // LD1: Fetch notification preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const preferences = await notificationService.getUserPreferences();
        setNotificationPreferences(preferences);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // LD1: Load saved app settings from local storage on component mount
  useEffect(() => {
    try {
      const savedSettings = settingsStorage.getItem<AppSettings>(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setAppSettings(savedSettings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load app settings');
    }
  }, []);

  // LD1: Handle toggle changes for notification preferences
  const handleNotificationToggle = (preferenceId: string, checked: boolean) => {
    setNotificationPreferences(prevPreferences =>
      prevPreferences.map(pref =>
        pref.id === preferenceId ? { ...pref, enabled: checked } : pref
      )
    );
    setSuccessMessage(null);
  };

  // LD1: Handle toggle changes for app settings
  const handleSettingToggle = (setting: keyof AppSettings, checked: boolean) => {
    setAppSettings(prevSettings => ({
      ...prevSettings,
      [setting]: checked,
    }));

    if (setting === 'darkMode') {
      toggleTheme();
    }
    setSuccessMessage(null);
  };

  // LD1: Handle save settings action
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // LD1: Save app settings to local storage
      settingsStorage.setItem(SETTINGS_STORAGE_KEY, appSettings);

      // LD1: Call API to update notification preferences
      await notificationService.updateUserPreferences({
        preferences: notificationPreferences.map(pref => ({
          id: pref.id,
          enabled: pref.enabled,
        })),
      });

      // LD1: Handle successful update by showing success message
      setSuccessMessage('Settings saved successfully!');
    } catch (err: any) {
      // LD1: Handle errors by setting error message
      setError(err.message || 'Failed to save settings');
    } finally {
      // LD1: Set loading state to false
      setIsLoading(false);
    }
  };

  // LD1: Handle logout action
  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Auth');
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  // LD1: Render loading indicator while fetching data
  if (isLoading) {
    return (
      <Container>
        <LoadingIndicator label="Loading settings..." fullPage />
      </Container>
    );
  }

  // LD1: Render error alert if fetch or update fails
  if (error) {
    return (
      <Container>
        <Alert severity="error" message={error} onClose={() => setError(null)} />
      </Container>
    );
  }

  // LD1: Render success alert after successful update
  if (successMessage) {
    return (
      <Container>
        <Alert severity="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      </Container>
    );
  }

  // LD1: Render notification preference section with toggles
  // LD1: Render app settings section with toggles
  // LD1: Render account actions section with logout button
  return (
    <Container>
      <Heading level={2}>Settings</Heading>

      <SettingsSection title="Notifications">
        {notificationPreferences.map(preference => (
          <SettingItem key={preference.id} label={preference.type} description={`Enable/disable ${preference.type} notifications`}>
            <Toggle
              name={`notification-${preference.id}`}
              checked={preference.enabled}
              onChange={(checked) => handleNotificationToggle(preference.id, checked)}
            />
          </SettingItem>
        ))}
      </SettingsSection>

      <SettingsSection title="App Settings">
        <SettingItem label="Dark Mode" description="Enable dark mode for nighttime driving">
          <Toggle
            name="darkMode"
            checked={appSettings.darkMode}
            onChange={(checked) => handleSettingToggle('darkMode', checked)}
          />
        </SettingItem>
        <SettingItem label="Location Tracking" description="Allow app to track your location for load recommendations">
          <Toggle
            name="locationTracking"
            checked={appSettings.locationTracking}
            onChange={(checked) => handleSettingToggle('locationTracking', checked)}
          />
        </SettingItem>
        <SettingItem label="Data Saving Mode" description="Reduce data usage by limiting image quality and background sync">
          <Toggle
            name="dataSaving"
            checked={appSettings.dataSaving}
            onChange={(checked) => handleSettingToggle('dataSaving', checked)}
          />
        </SettingItem>
        <SettingItem label="Automatic Check-In" description="Automatically check in at pickup and delivery locations">
          <Toggle
            name="autoCheckIn"
            checked={appSettings.autoCheckIn}
            onChange={(checked) => handleSettingToggle('autoCheckIn', checked)}
          />
        </SettingItem>
        <SettingItem label="ELD Integration" description="Share HOS data with the platform for compliance and load planning">
          <Toggle
            name="eldIntegration"
            checked={appSettings.eldIntegration}
            onChange={(checked) => handleSettingToggle('eldIntegration', checked)}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection title="Account Actions">
        <Button variant="secondary" fullWidth onPress={handleSaveSettings}>
          Save Settings
        </Button>
        <Button variant="danger" fullWidth onPress={handleLogout}>
          Logout
        </Button>
      </SettingsSection>
    </Container>
  );
};

export default SettingsScreen;