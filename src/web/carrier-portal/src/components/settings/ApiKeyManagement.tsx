import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { Copy, Delete } from '@mui/icons-material'; // @mui/icons-material ^5.11.0

import DataTable, { ColumnDefinition } from '../../../shared/components/tables/DataTable';
import Button from '../../../shared/components/buttons/Button';
import Modal from '../../../shared/components/feedback/Modal';
import Form from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import integrationService from '../../services/integrationService';
import { ApiKey } from '../../../common/interfaces';
import useAuth from '../../../common/hooks/useAuth';
import theme from '../../../shared/styles/theme';

/**
 * Interface defining the structure of the form data for creating a new API key
 */
interface ApiKeyFormData {
  name: string;
  description: string;
  expiresIn: number;
  permissions: string[];
}

/**
 * Container for the API key management section
 */
const Container = styled.div`
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borders.radius.md};
  box-shadow: ${theme.shadows.sm};
`;

/**
 * Header for the API key management section
 */
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Title for the API key management section
 */
const Title = styled.h2`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Description text for the API key management section
 */
const Description = styled.p`
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Container for displaying a newly created API key
 */
const KeyContainer = styled.div`
  background-color: ${theme.colors.background.light};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borders.radius.sm};
  margin-bottom: ${theme.spacing.md};
  position: relative;
`;

/**
 * Element for displaying the API key value
 */
const KeyValue = styled.code`
  font-family: monospace;
  word-break: break-all;
  display: block;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Button for copying the API key to clipboard
 */
const CopyButton = styled.button`
  position: absolute;
  top: ${theme.spacing.sm};
  right: ${theme.spacing.sm};
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.primary.main};
`;

/**
 * Warning text about API key security
 */
const WarningText = styled.p`
  color: ${theme.colors.warning.main};
  font-weight: ${theme.typography.fontWeightMedium};
  margin-top: ${theme.spacing.md};
`;

/**
 * Form group for API key creation form
 */
const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Footer for the modal dialogs
 */
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
`;

/**
 * Array of column definitions for the API keys table
 */
const API_KEY_COLUMNS: ColumnDefinition<ApiKey>[] = [
  { field: 'name', header: 'Name' },
  { field: 'description', header: 'Description' },
  { field: 'createdAt', header: 'Created At' },
  {
    field: 'actions',
    header: 'Actions',
    renderCell: (apiKey: ApiKey) => (
      <Button
        variant="danger"
        size="small"
        onClick={() => handleRevokeApiKey(apiKey.id)}
      >
        Revoke
      </Button>
    ),
  },
];

/**
 * Array of expiration options for API keys
 */
const EXPIRATION_OPTIONS = [
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 180, label: '180 Days' },
  { value: 365, label: '1 Year' },
];

/**
 * Array of permission options for API keys
 */
const PERMISSION_OPTIONS = [
  { value: 'read:loads', label: 'Read Loads' },
  { value: 'write:loads', label: 'Write Loads' },
  { value: 'read:drivers', label: 'Read Drivers' },
  { value: 'write:drivers', label: 'Write Drivers' },
];

/**
 * Initial form data for API key creation
 */
const INITIAL_FORM_DATA: ApiKeyFormData = {
  name: '',
  description: '',
  expiresIn: 30,
  permissions: [],
};

/**
 * Component for managing API keys in the carrier portal settings
 */
const ApiKeyManagement: React.FC = () => {
  // Get carrier ID from authentication context
  const { authState } = useAuth();
  const carrierId = authState.user?.carrierId;

  // Initialize state for API keys, loading state, modal visibility, and form data
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [keyInfoModalOpen, setKeyInfoModalOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState<ApiKeyFormData>(INITIAL_FORM_DATA);

  // Create function to fetch API keys from the integration service
  const fetchApiKeys = useCallback(async () => {
    if (!carrierId) return;
    setLoading(true);
    try {
      const keys = await integrationService.getApiKeys(carrierId);
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }, [carrierId]);

  // Create function to handle creating a new API key
  const handleCreateApiKey = async () => {
    if (!carrierId) return;
    setLoading(true);
    try {
      const apiKey = await integrationService.createApiKey(carrierId, formData);
      setNewApiKey(apiKey);
      setCreateModalOpen(false);
      setKeyInfoModalOpen(true);
      await fetchApiKeys(); // Refresh API key list
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create function to handle revoking an API key
  const handleRevokeApiKey = async (keyId: string) => {
    setLoading(true);
    try {
      await integrationService.revokeApiKey(keyId);
      await fetchApiKeys(); // Refresh API key list
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create function to copy API key to clipboard
  const handleCopyApiKey = () => {
    if (newApiKey?.secret) {
      navigator.clipboard.writeText(newApiKey.secret);
    }
  };

  // Use useEffect to fetch API keys on component mount
  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  // Render the component
  return (
    <Container>
      <Header>
        <Title>API Keys</Title>
        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          Create New Key
        </Button>
      </Header>
      <Description>
        Manage API keys for programmatic access to your account.
      </Description>

      <DataTable
        data={apiKeys}
        columns={API_KEY_COLUMNS}
        loading={loading}
      />

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create API Key"
      >
        <Form
          initialValues={INITIAL_FORM_DATA}
          onSubmit={async () => {
            await handleCreateApiKey();
          }}
        >
          <FormGroup>
            <Input
              name="name"
              label="Name"
              placeholder="Key Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <Input
              name="description"
              label="Description"
              placeholder="Key Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormGroup>
          {/* Add expiresIn and permissions selection here */}
          <ModalFooter>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              Create Key
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal
        isOpen={keyInfoModalOpen}
        onClose={() => setKeyInfoModalOpen(false)}
        title="New API Key Created"
      >
        {newApiKey && (
          <>
            <KeyContainer>
              <KeyValue>{newApiKey.secret}</KeyValue>
              <CopyButton onClick={handleCopyApiKey}>
                <Copy />
              </CopyButton>
            </KeyContainer>
            <WarningText>
              Store this API key securely. You won't be able to see it again.
            </WarningText>
          </>
        )}
        <ModalFooter>
          <Button variant="primary" onClick={() => setKeyInfoModalOpen(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ApiKeyManagement;