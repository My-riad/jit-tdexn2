# src/web/shipper-portal/src/components/settings/ApiKeyManagement.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { Copy, Delete, Visibility, VisibilityOff } from '@mui/icons-material'; // @mui/icons-material ^5.11.0

import DataTable from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import FormError from '../../../shared/components/forms/FormError';
import settingsService from '../../services/settingsService';
import useAuth from '../../../common/hooks/useAuth';
import useNotification from '../../../common/hooks/useNotification';
import { formatDate } from '../../../common/utils/dateTimeUtils';

// Styled Components
const Container = styled.div`
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
`;

const Description = styled.p`
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.875rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const KeyDisplay = styled.div`
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-family: monospace;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KeyWarning = styled.p`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const NoKeysMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

// Interfaces
interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  status: string;
}

interface ApiKeyFormValues {
  name: string;
  permissions: string[];
  expiration: string;
}

interface ApiKeyFormErrors {
  name: string | null;
  permissions: string | null;
  expiration: string | null;
}

interface NewApiKeyResponse {
  key: string;
  apiKey: ApiKey;
}

// Constants
const PERMISSION_OPTIONS = [
  { value: 'read', label: 'Read Only' },
  { value: 'write', label: 'Read & Write' },
  { value: 'admin', label: 'Full Access' },
];

const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '30days', label: '30 Days' },
  { value: '60days', label: '60 Days' },
  { value: '90days', label: '90 Days' },
  { value: '1year', label: '1 Year' },
];

const INITIAL_FORM_VALUES: ApiKeyFormValues = {
  name: '',
  permissions: [],
  expiration: '90days',
};

const INITIAL_FORM_ERRORS: ApiKeyFormErrors = {
  name: null,
  permissions: null,
  expiration: null,
};

const API_KEY_COLUMNS = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'prefix', header: 'Key Prefix', sortable: false },
  { field: 'permissions', header: 'Permissions', sortable: false },
  { field: 'createdAt', header: 'Created', sortable: true },
  { field: 'expiresAt', header: 'Expires', sortable: true },
  { field: 'lastUsed', header: 'Last Used', sortable: true },
  { field: 'actions', header: 'Actions', sortable: false },
];

/**
 * Validates the API key creation form
 * @param formValues Object containing form values
 * @returns Object containing validation errors if any
 */
const validateForm = (formValues: ApiKeyFormValues): ApiKeyFormErrors => {
  const errors: ApiKeyFormErrors = {};

  if (!formValues.name) {
    errors.name = 'Name is required';
  }

  if (formValues.permissions.length === 0) {
    errors.permissions = 'Permissions are required';
  }

  if (!formValues.expiration) {
    errors.expiration = 'Expiration is required';
  }

  return errors;
};

/**
 * Main component for managing API keys
 */
const ApiKeyManagement: React.FC = () => {
  // Get current user information from auth context
  const { authState } = useAuth();
  const shipperId = authState.user?.shipperId;

  // Initialize state for API keys, loading state, modal visibility, and form values
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<ApiKeyFormValues>(INITIAL_FORM_VALUES);
  const [formErrors, setFormErrors] = useState<ApiKeyFormErrors>(INITIAL_FORM_ERRORS);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
  const { showNotification } = useNotification();

  // Create function to fetch API keys from the service
  const fetchApiKeys = useCallback(async () => {
    if (!shipperId) return;

    setLoading(true);
    try {
      const keys = await settingsService.getApiKeys(shipperId);
      setApiKeys(keys);
    } catch (error: any) {
      showNotification({ type: 'error', message: error.message || 'Failed to fetch API keys' });
    } finally {
      setLoading(false);
    }
  }, [shipperId, showNotification]);

  // Load API keys when component mounts
  useEffect(() => {
    if (shipperId) {
      fetchApiKeys();
    }
  }, [shipperId, fetchApiKeys]);

  // Handle creating a new API key
  const handleCreateApiKey = async () => {
    const errors = validateForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!shipperId) return;

    setLoading(true);
    try {
      const response = await settingsService.createApiKey(shipperId, formValues);
      setNewApiKey(response.key);
      setApiKeys(prev => [...prev, response.apiKey]);
      setIsModalOpen(false);
      setFormValues(INITIAL_FORM_VALUES);
      showNotification({ type: 'success', message: 'API key created successfully' });
    } catch (error: any) {
      showNotification({ type: 'error', message: error.message || 'Failed to create API key' });
    } finally {
      setLoading(false);
    }
  };

  // Handle revoking an existing API key
  const handleRevokeApiKey = async (apiKeyId: string) => {
    setSelectedApiKeyId(apiKeyId);
    setLoading(true);
    try {
      await settingsService.revokeApiKey(apiKeyId);
      setApiKeys(prev => prev.filter(key => key.id !== apiKeyId));
      showNotification({ type: 'success', message: 'API key revoked successfully' });
    } catch (error: any) {
      showNotification({ type: 'error', message: error.message || 'Failed to revoke API key' });
    } finally {
      setLoading(false);
      setSelectedApiKeyId(null);
    }
  };

  // Handle copying API key to clipboard
  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      showNotification({ type: 'info', message: 'API key copied to clipboard' });
    }
  };

  // Render the component with DataTable for existing keys and Modal for creating new keys
  return (
    <Container>
      <Header>
        <Title>API Keys</Title>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Create API Key
        </Button>
      </Header>
      <Description>
        Manage API keys for programmatic access to the AI-driven Freight Optimization Platform.
      </Description>

      {newApiKey && (
        <KeyDisplay>
          <CopyButton onClick={handleCopyKey} aria-label="Copy API key">
            <Copy />
          </CopyButton>
          <code>{newApiKey}</code>
          <KeyWarning>
            Store this API key securely. It will not be shown again.
          </KeyWarning>
        </KeyDisplay>
      )}

      {apiKeys.length > 0 ? (
        <DataTable
          data={apiKeys}
          columns={[
            ...API_KEY_COLUMNS,
            {
              field: 'actions',
              header: 'Actions',
              renderCell: (apiKey: ApiKey) => (
                <Button
                  variant="danger"
                  size="small"
                  disabled={loading && selectedApiKeyId === apiKey.id}
                  onClick={() => handleRevokeApiKey(apiKey.id)}
                >
                  <Delete />
                  Revoke
                </Button>
              ),
            },
          ]}
          loading={loading}
          emptyStateMessage="No API keys have been created yet."
        />
      ) : (
        <NoKeysMessage>No API keys have been created yet.</NoKeysMessage>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New API Key">
        <FormGroup>
          <Input
            label="Name"
            name="name"
            value={formValues.name}
            onChange={e => setFormValues({ ...formValues, name: e.target.value })}
            error={formErrors.name}
            required
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="Permissions"
            name="permissions"
            options={PERMISSION_OPTIONS}
            value={formValues.permissions.join(',')}
            onChange={e => setFormValues({ ...formValues, permissions: e.target.value.split(',') })}
            error={formErrors.permissions}
            required
            multiple
          />
        </FormGroup>
        <FormGroup>
          <Select
            label="Expiration"
            name="expiration"
            options={EXPIRATION_OPTIONS}
            value={formValues.expiration}
            onChange={e => setFormValues({ ...formValues, expiration: e.target.value })}
            error={formErrors.expiration}
            required
          />
        </FormGroup>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateApiKey} disabled={loading}>
            Create
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ApiKeyManagement;