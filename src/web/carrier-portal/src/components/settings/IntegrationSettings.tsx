import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.10
import * as Yup from 'yup'; // yup ^1.2.0
import { format } from 'date-fns'; // date-fns ^2.30.0

import Card from '../../../../shared/components/cards/Card';
import Tabs from '../../../../shared/components/navigation/Tabs';
import Button from '../../../../shared/components/buttons/Button';
import IconButton from '../../../../shared/components/buttons/IconButton';
import Modal from '../../../../shared/components/feedback/Modal';
import Alert from '../../../../shared/components/feedback/Alert';
import LoadingIndicator from '../../../../shared/components/feedback/LoadingIndicator';
import Badge from '../../../../shared/components/feedback/Badge';
import {
  Form,
  Input,
  Select,
  Checkbox,
  Toggle,
} from '../../../../shared/components/forms';
import DataTable from '../../../../shared/components/tables/DataTable';
import { Section, FlexBox, Grid, GridItem } from '../../../../shared/components/layout';
import ApiKeyManagement from './ApiKeyManagement';
import { useAuthContext } from '../../../../common/contexts/AuthContext';
import integrationService from '../../../services/integrationService';
import {
  EldConnection,
  TmsConnection,
  PaymentMethod,
  IntegrationSettings,
} from '../../../../common/interfaces';
import { theme } from '../../../../shared/styles/theme';

// Define AlertState interface
interface AlertState {
  type: string;
  message: string;
  visible: boolean;
}

// Define EldConnectionFormValues interface
interface EldConnectionFormValues {
  name: string;
  provider: string;
  apiKey: string;
  apiSecret: string;
  accountId: string;
}

// Define TmsConnectionFormValues interface
interface TmsConnectionFormValues {
  name: string;
  provider: string;
  apiKey: string;
  apiSecret: string;
  endpoint: string;
  syncSettings: object;
}

// Define PaymentMethodFormValues interface
interface PaymentMethodFormValues {
  name: string;
  type: string;
  isDefault: boolean;
}

// Define ModalState interface
interface ModalState {
  isOpen: boolean;
  type: string;
  data: any;
}

// Define styled components
const IntegrationSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const IntegrationSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const IntegrationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const IntegrationTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  margin: 0;
`;

const ConnectionList = styled.div`
  margin-top: ${theme.spacing.md};
`;

const ConnectionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
  &:last-child {
    border-bottom: none;
  }
`;

const ConnectionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ConnectionName = styled.div`
  font-weight: 500;
  color: ${theme.colors.text.primary};
`;

const ConnectionProvider = styled.div`
  font-size: 0.875rem;
  color: ${theme.colors.text.secondary};
`;

interface ConnectionStatusProps {
  status: string;
}

const ConnectionStatus = styled.div<ConnectionStatusProps>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${(props) => getStatusColor(props.status).background};
  color: ${(props) => getStatusColor(props.status).text};
`;

const ConnectionActions = styled.div`
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

const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const TabContent = styled.div`
  padding: ${theme.spacing.md} 0;
`;

// Define constants
const TABS = [
  { id: 'eld', label: 'ELD Integration' },
  { id: 'tms', label: 'TMS Integration' },
  { id: 'payment', label: 'Payment Methods' },
  { id: 'api', label: 'API Access' },
];

const ELD_PROVIDERS = [
  { value: 'keeptruckin', label: 'KeepTruckin' },
  { value: 'omnitracs', label: 'Omnitracs' },
  { value: 'samsara', label: 'Samsara' },
  { value: 'geotab', label: 'Geotab' },
  { value: 'isaac', label: 'Isaac Instruments' },
];

const TMS_PROVIDERS = [
  { value: 'mcleod', label: 'McLeod Software' },
  { value: 'tmw', label: 'TMW Systems' },
  { value: 'mercurygate', label: 'MercuryGate' },
  { value: 'prophesy', label: 'Prophesy' },
  { value: 'custom', label: 'Custom TMS' },
];

const PAYMENT_TYPES = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'ach', label: 'ACH Bank Transfer' },
  { value: 'wire', label: 'Wire Transfer' },
];

// Define validation schemas
const ELD_CONNECTION_VALIDATION_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Name is required').max(50, 'Name must be less than 50 characters'),
  provider: Yup.string().required('Provider is required'),
  apiKey: Yup.string().when('provider', {
    is: (val) => val === 'custom',
    then: Yup.string().required('API Key is required'),
  }),
  apiSecret: Yup.string().when('provider', {
    is: (val) => val === 'custom',
    then: Yup.string().required('API Secret is required'),
  }),
  accountId: Yup.string(),
});

const TMS_CONNECTION_VALIDATION_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Name is required').max(50, 'Name must be less than 50 characters'),
  provider: Yup.string().required('Provider is required'),
  apiKey: Yup.string().required('API Key is required'),
  apiSecret: Yup.string().required('API Secret is required'),
  endpoint: Yup.string().url('Must be a valid URL').required('Endpoint URL is required'),
});

const PAYMENT_METHOD_VALIDATION_SCHEMA = Yup.object().shape({
  name: Yup.string().required('Name is required').max(50, 'Name must be less than 50 characters'),
  type: Yup.string().required('Payment type is required'),
  isDefault: Yup.boolean(),
});

// Define table columns
const ELD_CONNECTION_TABLE_COLUMNS = [
  { id: 'name', header: 'Name', accessor: (conn: EldConnection) => conn.name },
  { id: 'provider', header: 'Provider', accessor: (conn: EldConnection) => conn.provider },
  { id: 'status', header: 'Status', accessor: (conn: EldConnection) => conn.status },
  {
    id: 'lastSync',
    header: 'Last Sync',
    accessor: (conn: EldConnection) =>
      conn.lastSyncedAt ? format(new Date(conn.lastSyncedAt), 'MMM d, yyyy h:mm a') : 'Never',
  },
  { id: 'actions', header: 'Actions', accessor: () => null },
];

const TMS_CONNECTION_TABLE_COLUMNS = [
  { id: 'name', header: 'Name', accessor: (conn: TmsConnection) => conn.name },
  { id: 'provider', header: 'Provider', accessor: (conn: TmsConnection) => conn.provider },
  { id: 'status', header: 'Status', accessor: (conn: TmsConnection) => conn.status },
  {
    id: 'lastSync',
    header: 'Last Sync',
    accessor: (conn: TmsConnection) =>
      conn.lastSyncedAt ? format(new Date(conn.lastSyncedAt), 'MMM d, yyyy h:mm a') : 'Never',
  },
  { id: 'actions', header: 'Actions', accessor: () => null },
];

const PAYMENT_METHOD_TABLE_COLUMNS = [
  { id: 'name', header: 'Name', accessor: (method: PaymentMethod) => method.name },
  { id: 'type', header: 'Type', accessor: (method: PaymentMethod) => method.type },
  { id: 'default', header: 'Default', accessor: (method: PaymentMethod) => (method.isDefault ? 'Yes' : 'No') },
  {
    id: 'lastUsed',
    header: 'Last Used',
    accessor: (method: PaymentMethod) =>
      method.lastUsedAt ? format(new Date(method.lastUsedAt), 'MMM d, yyyy') : 'Never',
  },
  { id: 'actions', header: 'Actions', accessor: () => null },
];

// Helper function to determine status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return { background: theme.colors.status.active, text: theme.colors.text.inverted };
    case 'inactive':
      return { background: theme.colors.status.inactive, text: theme.colors.text.inverted };
    case 'warning':
      return { background: theme.colors.status.warning, text: theme.colors.text.primary };
    case 'error':
      return { background: theme.colors.status.error, text: theme.colors.text.inverted };
    default:
      return { background: theme.colors.status.info, text: theme.colors.text.inverted };
  }
};

const IntegrationSettings: React.FC = () => {
  // Get current user and carrier data from authentication context
  const { authState } = useAuthContext();
  const carrierId = authState.user?.carrierId;

  // Initialize state for active tab, integration settings, and loading states
  const [activeTab, setActiveTab] = useState('eld');
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize state for alerts and modals
  const [alert, setAlert] = useState<AlertState>({ type: '', message: '', visible: false });
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: '', data: null });

  // Create validation schemas for different integration types using Yup
  const eldValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    provider: Yup.string().required('Provider is required'),
  });

  const tmsValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    provider: Yup.string().required('Provider is required'),
    endpoint: Yup.string().url('Must be a valid URL').required('Endpoint URL is required'),
  });

  const paymentMethodValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    type: Yup.string().required('Payment type is required'),
  });

  // Fetch integration settings and connections on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      if (!carrierId) return;
      setLoading(true);
      try {
        const settings = await integrationService.getIntegrationSettings(carrierId);
        setIntegrationSettings(settings);
      } catch (error) {
        console.error('Failed to fetch integration settings:', error);
        setAlert({ type: 'error', message: 'Failed to load integration settings.', visible: true });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [carrierId]);

  // Handle tab changes between different integration types (ELD, TMS, Payment, etc.)
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Implement ELD connection management (create, update, delete)
  const handleCreateEldConnection = async (values: EldConnectionFormValues) => {
    // Implement create ELD connection logic here
  };

  const handleUpdateEldConnection = async (connectionId: string, values: EldConnectionFormValues) => {
    // Implement update ELD connection logic here
  };

  const handleDeleteEldConnection = async (connectionId: string) => {
    // Implement delete ELD connection logic here
  };

  // Implement TMS connection management (create, update, delete, sync)
  const handleCreateTmsConnection = async (values: TmsConnectionFormValues) => {
    // Implement create TMS connection logic here
  };

  const handleUpdateTmsConnection = async (connectionId: string, values: TmsConnectionFormValues) => {
    // Implement update TMS connection logic here
  };

  const handleDeleteTmsConnection = async (connectionId: string) => {
    // Implement delete TMS connection logic here
  };

  const handleSyncTmsData = async (connectionId: string) => {
    // Implement sync TMS data logic here
  };

  // Implement payment method management (add, delete, set default)
  const handleAddPaymentMethod = async (values: PaymentMethodFormValues) => {
    // Implement add payment method logic here
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    // Implement delete payment method logic here
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    // Implement set default payment method logic here
  };

  // Implement OAuth flow for ELD providers
  const handleInitiateOAuth = async (provider: string) => {
    // Implement initiate OAuth flow logic here
  };

  const handleOAuthCallback = async (provider: string, code: string, state: string) => {
    // Implement handle OAuth callback logic here
  };

  // Render integration settings with tabs for different integration types
  return (
    <IntegrationSettingsContainer>
      <Tabs tabs={TABS} activeTabId={activeTab} onChange={handleTabChange} />

      {/* Render connection lists with status indicators */}
      {/* Provide action buttons for managing connections */}
      {/* Show loading indicators during API operations */}
      {/* Display success or error alerts based on operation results */}

      {/* Include API key management section for programmatic access */}
      {activeTab === 'api' && <ApiKeyManagement />}
    </IntegrationSettingsContainer>
  );
};

export default IntegrationSettings;