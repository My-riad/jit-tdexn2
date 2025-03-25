import React, { useState, useEffect } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useNavigate, useParams } from 'react-router-dom'; // react-router-dom ^6.8.0

import MainLayout from '../components/layout/MainLayout';
import Tabs from '../../../shared/components/navigation/Tabs';
import ProfileSettings from '../components/settings/ProfileSettings';
import CompanySettings from '../components/settings/CompanySettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import IntegrationSettings from '../components/settings/IntegrationSettings';
import UserManagement from '../components/settings/UserManagement';
import ApiKeyManagement from '../components/settings/ApiKeyManagement';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import settingsService from '../services/settingsService';

// Define styled components for layout and styling
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 8px 0;
`;

const PageDescription = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const TabContent = styled.div`
  padding: 24px 0;
`;

// Define the settings tabs configuration
const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', content: <ProfileSettings /> },
  { id: 'company', label: 'Company', content: <CompanySettings /> },
  { id: 'notifications', label: 'Notifications', content: <NotificationSettings /> },
  { id: 'integrations', label: 'Integrations', content: <IntegrationSettings /> },
  { id: 'users', label: 'Users', content: <UserManagement /> },
  { id: 'api', label: 'API Access', content: <ApiKeyManagement /> }
];

/**
 * Main component for the settings page that provides a tabbed interface for different settings sections
 * @returns {JSX.Element} Rendered settings page with tabs and content
 */
const SettingsPage: React.FC = () => {
  // LD1: Get user and carrier data from authentication context
  const { authState } = useAuthContext();
  const user = authState.user;
  const carrierId = user?.carrierId;

  // LD1: Initialize state for active tab ID
  const [activeTabId, setActiveTabId] = useState<string>(SETTINGS_TABS[0].id);

  // LD1: Get URL parameters to determine initial active tab
  const params = useParams<{ tab?: string }>();

  // LD1: Get navigate function for programmatic navigation
  const navigate = useNavigate();

  // LD1: Define tabs configuration with IDs, labels, and content components
  const tabs = SETTINGS_TABS;

  // LD1: Set active tab based on URL parameter when component mounts or URL changes
  useEffect(() => {
    if (params.tab && tabs.find(tab => tab.id === params.tab)) {
      setActiveTabId(params.tab);
    } else {
      // If params.tab does not exist or is invalid, use the default tab
      setActiveTabId(SETTINGS_TABS[0].id);
    }
  }, [params.tab, tabs]);

  // LD1: Handle tab change by updating URL and active tab state
  const handleTabChange = (tabId: string) => {
    // LD1: Update URL to include the new tab ID using navigate
    navigate(`/settings/${tabId}`);

    // LD1: Update activeTabId state with the new tab ID
    setActiveTabId(tabId);
  };

  // LD1: Render the page with MainLayout wrapper
  return (
    <MainLayout>
      {/* LD1: Render page header with title and description */}
      <PageHeader>
        <PageTitle>Settings</PageTitle>
        <PageDescription>Manage your account and company settings.</PageDescription>
      </PageHeader>

      {/* LD1: Render Tabs component with settings tabs configuration */}
      <Tabs
        tabs={tabs}
        activeTabId={activeTabId}
        onChange={handleTabChange}
      />

      {/* LD1: Conditionally render the active tab content based on active tab ID */}
      {tabs.map((tab) => (
        tab.id === activeTabId && (
          <TabContent key={tab.id}>
            {tab.content}
          </TabContent>
        )
      ))}
    </MainLayout>
  );
};

// IE3: Export the SettingsPage component as the default export
export default SettingsPage;