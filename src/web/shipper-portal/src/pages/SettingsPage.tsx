import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate, useLocation } from 'react-router-dom'; // version ^6.8.0
import { Person, Business, Notifications, IntegrationInstructions, People, VpnKey } from '@mui/icons-material'; // version ^5.11.0

import MainLayout from '../components/layout/MainLayout';
import Tabs from '../../../shared/components/navigation/Tabs';
import { TabItem } from '../../../shared/components/navigation/Tabs';
import ProfileSettings from '../components/settings/ProfileSettings';
import CompanySettings from '../components/settings/CompanySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import IntegrationSettings from '../components/settings/IntegrationSettings';
import UserManagement from '../components/settings/UserManagement';
import ApiKeyManagement from '../components/settings/ApiKeyManagement';
import useAuth from '../../../common/hooks/useAuth';

// Styled Components
const PageContainer = styled.div`
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const TabContent = styled.div`
  padding: 1rem 0;
`;

// Define settings tabs configuration
const SETTINGS_TABS: TabItem[] = [
  { id: 'profile', label: 'Profile', icon: <Person />, content: <ProfileSettings /> },
  { id: 'company', label: 'Company', icon: <Business />, content: <CompanySettings /> },
  { id: 'notifications', label: 'Notifications', icon: <Notifications />, content: <NotificationSettings /> },
  { id: 'integrations', label: 'Integrations', icon: <IntegrationInstructions />, content: <IntegrationSettings /> },
  { id: 'users', label: 'Users', icon: <People />, content: <UserManagement /> },
  { id: 'api-keys', label: 'API Keys', icon: <VpnKey />, content: <ApiKeyManagement /> },
];

/**
 * Main component for the settings page that organizes various settings components into tabs
 * @returns Rendered settings page with tabbed navigation
 */
const SettingsPage: React.FC = () => {
  // Get current user information using useAuth hook
  const { authState } = useAuth();
  const user = authState.user;

  // Get navigation and location information from React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize state for active tab ID
  const [activeTab, setActiveTab] = useState<string>(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || SETTINGS_TABS[0].id;
  });

  // Handle tab change by updating active tab state and URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tabId);
    navigate({ ...location, search: searchParams.toString() }, { replace: true });
  };

  // Parse tab ID from URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab') || SETTINGS_TABS[0].id;
    setActiveTab(tab);
  }, [location.search]);

  return (
    <MainLayout pageTitle="Settings" pageDescription="Manage your account settings, preferences, and configurations.">
      <PageContainer>
        <PageHeader>
          <PageTitle>Settings</PageTitle>
          <PageDescription>
            Manage your account settings, preferences, and configurations.
          </PageDescription>
        </PageHeader>

        <Tabs
          tabs={SETTINGS_TABS}
          activeTabId={activeTab}
          onChange={handleTabChange}
        />
      </PageContainer>
    </MainLayout>
  );
};

export default SettingsPage;