import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux ^8.0.5
import styled from 'styled-components'; // styled-components ^5.3.10

import { Card, CardProps } from '../../../shared/components/cards';
import { Section, Grid, GridItem, FlexBox } from '../../../shared/components/layout';
import { Button, IconButton } from '../../../shared/components/buttons';
import { Form, Input, Toggle, Select, FormError } from '../../../shared/components/forms';
import { Modal, Alert, LoadingIndicator, Tooltip } from '../../../shared/components/feedback';
import settingsService from '../../services/settingsService';
import integrationApi from '../../../common/api/integrationApi';

// LD1: Define the type for the TMS connection form state
interface TmsConnectionFormState {
  provider: string;
  apiKey: string;
  endpointUrl: string;
}

// LD1: Define the type for the payment method form state
interface PaymentMethodFormState {
  processor: string;
  accountNumber: string;
  routingNumber: string;
}

// LD1: Define the type for the API key form state
interface ApiKeyFormState {
  name: string;
  permissions: string[];
}

// LD1: Define the type for the webhook settings form state
interface WebhookSettingsFormState {
  webhookUrl: string;
  webhookSecret: string;
  events: string[];
}

// LD1: Define the type for the TMS connection form component props
interface TmsConnectionFormProps {
  onSubmit: (values: TmsConnectionFormState) => void;
  onCancel: () => void;
}

// LD1: Define the type for the Payment Method form component props
interface PaymentMethodFormProps {
  onSubmit: (values: PaymentMethodFormState) => void;
  onCancel: () => void;
}

// LD1: Define the type for the API Key form component props
interface ApiKeyFormProps {
  onSubmit: (values: ApiKeyFormState) => void;
  onCancel: () => void;
}

// LD1: Define the type for the Webhook Settings form component props
interface WebhookSettingsFormProps {
  onSubmit: (values: WebhookSettingsFormState) => void;
  onCancel: () => void;
}

// LD1: Define the TmsConnectionForm component
class TmsConnectionForm extends React.Component<TmsConnectionFormProps> {
  // LD1: Define the initial state for the form
  state = {
    formState: {
      provider: '',
      apiKey: '',
      endpointUrl: '',
    },
    errors: {},
  };

  // LD1: Handle form submission
  handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // LD1: Validate the form
    const isValid = this.validateForm();
    if (isValid) {
      // LD1: Call the onSubmit prop with the form data
      this.props.onSubmit(this.state.formState);
    }
  };

  // LD1: Handle form input changes
  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formState: {
        ...prevState.formState,
        [name]: value,
      },
      errors: {
        ...prevState.errors,
        [name]: '',
      },
    }));
  };

  // LD1: Validate the form inputs
  validateForm = () => {
    let isValid = true;
    const errors = {};

    if (!this.state.formState.provider) {
      errors['provider'] = 'Provider is required';
      isValid = false;
    }

    if (!this.state.formState.apiKey) {
      errors['apiKey'] = 'API Key is required';
      isValid = false;
    }

    if (!this.state.formState.endpointUrl) {
      errors['endpointUrl'] = 'Endpoint URL is required';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  };

  // LD1: Render the form
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <Input
          label="TMS Provider"
          name="provider"
          value={this.state.formState.provider}
          onChange={this.handleChange}
          error={this.state.errors['provider']}
          required
        />
        <Input
          label="API Key"
          name="apiKey"
          value={this.state.formState.apiKey}
          onChange={this.handleChange}
          error={this.state.errors['apiKey']}
          required
        />
        <Input
          label="Endpoint URL"
          name="endpointUrl"
          value={this.state.formState.endpointUrl}
          onChange={this.handleChange}
          error={this.state.errors['endpointUrl']}
          required
        />
        <Button type="submit">Save</Button>
        <Button type="button" onClick={this.props.onCancel}>Cancel</Button>
      </form>
    );
  }
}

// LD1: Define the PaymentMethodForm component
class PaymentMethodForm extends React.Component<PaymentMethodFormProps> {
  // LD1: Define the initial state for the form
  state = {
    formState: {
      processor: '',
      accountNumber: '',
      routingNumber: '',
    },
    errors: {},
  };

  // LD1: Handle form submission
  handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // LD1: Validate the form
    const isValid = this.validateForm();
    if (isValid) {
      // LD1: Call the onSubmit prop with the form data
      this.props.onSubmit(this.state.formState);
    }
  };

  // LD1: Handle form input changes
  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formState: {
        ...prevState.formState,
        [name]: value,
      },
      errors: {
        ...prevState.errors,
        [name]: '',
      },
    }));
  };

  // LD1: Validate the form inputs
  validateForm = () => {
    let isValid = true;
    const errors = {};

    if (!this.state.formState.processor) {
      errors['processor'] = 'Processor is required';
      isValid = false;
    }

    if (!this.state.formState.accountNumber) {
      errors['accountNumber'] = 'Account Number is required';
      isValid = false;
    }

    if (!this.state.formState.routingNumber) {
      errors['routingNumber'] = 'Routing Number is required';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  };

  // LD1: Render the form
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <Input
          label="Payment Processor"
          name="processor"
          value={this.state.formState.processor}
          onChange={this.handleChange}
          error={this.state.errors['processor']}
          required
        />
        <Input
          label="Account Number"
          name="accountNumber"
          value={this.state.formState.accountNumber}
          onChange={this.handleChange}
          error={this.state.errors['accountNumber']}
          required
        />
        <Input
          label="Routing Number"
          name="routingNumber"
          value={this.state.formState.routingNumber}
          onChange={this.handleChange}
          error={this.state.errors['routingNumber']}
          required
        />
        <Button type="submit">Save</Button>
        <Button type="button" onClick={this.props.onCancel}>Cancel</Button>
      </form>
    );
  }
}

// LD1: Define the ApiKeyForm component
class ApiKeyForm extends React.Component<ApiKeyFormProps> {
  // LD1: Define the initial state for the form
  state = {
    formState: {
      name: '',
      permissions: [],
    },
    errors: {},
  };

  // LD1: Handle form submission
  handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // LD1: Validate the form
    const isValid = this.validateForm();
    if (isValid) {
      // LD1: Call the onSubmit prop with the form data
      this.props.onSubmit(this.state.formState);
    }
  };

  // LD1: Handle form input changes
  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formState: {
        ...prevState.formState,
        [name]: value,
      },
      errors: {
        ...prevState.errors,
        [name]: '',
      },
    }));
  };

  // LD1: Validate the form inputs
  validateForm = () => {
    let isValid = true;
    const errors = {};

    if (!this.state.formState.name) {
      errors['name'] = 'Name is required';
      isValid = false;
    }

    if (!this.state.formState.permissions || this.state.formState.permissions.length === 0) {
      errors['permissions'] = 'At least one permission is required';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  };

  // LD1: Render the form
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <Input
          label="API Key Name"
          name="name"
          value={this.state.formState.name}
          onChange={this.handleChange}
          error={this.state.errors['name']}
          required
        />
        {/* Add a multi-select component for permissions here */}
        <Button type="submit">Save</Button>
        <Button type="button" onClick={this.props.onCancel}>Cancel</Button>
      </form>
    );
  }
}

// LD1: Define the WebhookSettingsForm component
class WebhookSettingsForm extends React.Component<WebhookSettingsFormProps> {
  // LD1: Define the initial state for the form
  state = {
    formState: {
      webhookUrl: '',
      webhookSecret: '',
      events: [],
    },
    errors: {},
  };

  // LD1: Handle form submission
  handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // LD1: Validate the form
    const isValid = this.validateForm();
    if (isValid) {
      // LD1: Call the onSubmit prop with the form data
      this.props.onSubmit(this.state.formState);
    }
  };

  // LD1: Handle form input changes
  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formState: {
        ...prevState.formState,
        [name]: value,
      },
      errors: {
        ...prevState.errors,
        [name]: '',
      },
    }));
  };

  // LD1: Validate the form inputs
  validateForm = () => {
    let isValid = true;
    const errors = {};

    if (!this.state.formState.webhookUrl) {
      errors['webhookUrl'] = 'Webhook URL is required';
      isValid = false;
    }

    if (!this.state.formState.webhookSecret) {
      errors['webhookSecret'] = 'Webhook Secret is required';
      isValid = false;
    }

    if (!this.state.formState.events || this.state.formState.events.length === 0) {
      errors['events'] = 'At least one event is required';
      isValid = false;
    }

    this.setState({ errors });
    return isValid;
  };

  // LD1: Render the form
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <Input
          label="Webhook URL"
          name="webhookUrl"
          value={this.state.formState.webhookUrl}
          onChange={this.handleChange}
          error={this.state.errors['webhookUrl']}
          required
        />
        <Input
          label="Webhook Secret"
          name="webhookSecret"
          value={this.state.formState.webhookSecret}
          onChange={this.handleChange}
          error={this.state.errors['webhookSecret']}
          required
        />
        {/* Add a multi-select component for events here */}
        <Button type="submit">Save</Button>
        <Button type="button" onClick={this.props.onCancel}>Cancel</Button>
      </form>
    );
  }
}

// LD1: Define the IntegrationSettings component
const IntegrationSettings: React.FC = () => {
  // LD1: Get the current shipper ID from Redux state
  const shipperId = useSelector((state: any) => state.auth.user.shipperId);

  // LD1: Use custom hooks to manage integration settings, TMS connections, payment methods, API keys, and webhook settings
  const integrationSettings = useIntegrationSettings(shipperId);
  const tmsConnections = useTmsConnections(shipperId);
  const paymentMethods = usePaymentMethods(shipperId);
  const apiKeys = useApiKeys(shipperId);
  const webhookSettings = useWebhookSettings(shipperId);

  // LD1: Handle form submissions for updating integration settings
  const handleIntegrationSettingsSubmit = async (values: any) => {
    try {
      await settingsService.updateIntegrationSettings(shipperId, values);
      integrationSettings.fetchSettings();
    } catch (error) {
      integrationSettings.setError(error.message);
    }
  };

  // LD1: Render the integration settings interface with sections for TMS, payment, API, and webhooks
  return (
    <Section>
      <Grid columns={{ md: '1fr', lg: '1fr 1fr' }}>
        <GridItem>
          <Card>
            <h2>TMS Integration</h2>
            <Toggle
              name="tmsEnabled"
              label="Enable TMS Integration"
              checked={integrationSettings.settings?.tmsEnabled || false}
              onChange={value => handleIntegrationSettingsSubmit({ tmsEnabled: value })}
              disabled={integrationSettings.loading}
            />
            {tmsConnections.connections && tmsConnections.connections.map(connection => (
              <Card key={connection.id}>
                {connection.name}
              </Card>
            ))}
            <Button onClick={tmsConnections.addConnection}>Add TMS Connection</Button>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <h2>Payment Integration</h2>
            <Toggle
              name="paymentEnabled"
              label="Enable Payment Integration"
              checked={integrationSettings.settings?.paymentEnabled || false}
              onChange={value => handleIntegrationSettingsSubmit({ paymentEnabled: value })}
              disabled={integrationSettings.loading}
            />
            {paymentMethods.paymentMethods && paymentMethods.paymentMethods.map(method => (
              <Card key={method.id}>
                {method.name}
              </Card>
            ))}
            <Button onClick={paymentMethods.addPaymentMethod}>Add Payment Method</Button>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <h2>API Access</h2>
            <Toggle
              name="apiEnabled"
              label="Enable API Access"
              checked={integrationSettings.settings?.apiEnabled || false}
              onChange={value => handleIntegrationSettingsSubmit({ apiEnabled: value })}
              disabled={integrationSettings.loading}
            />
            {apiKeys.apiKeys && apiKeys.apiKeys.map(key => (
              <Card key={key.id}>
                {key.name}
              </Card>
            ))}
            <Button onClick={apiKeys.addApiKey}>Create API Key</Button>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <h2>Webhooks</h2>
            <Input label="Webhook URL" />
            <Input label="Webhook Secret" />
            <Button>Save Webhook Settings</Button>
          </Card>
        </GridItem>
      </Grid>
    </Section>
  );
};

// LD1: Custom hook that manages the integration settings state and operations
const useIntegrationSettings = (shipperId: string) => {
  const [settings, setSettings] = useState<{ tmsEnabled: boolean, paymentEnabled: boolean, apiEnabled: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getIntegrationSettings(shipperId);
      setSettings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, fetchSettings, setError };
};

// LD1: Custom hook that manages TMS connections
const useTmsConnections = (shipperId: string) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getTmsConnections(shipperId);
      setConnections(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  const addConnection = useCallback(async (connectionParams: any) => {
    setLoading(true);
    try {
      await settingsService.createTmsConnection(shipperId, connectionParams);
      await fetchConnections();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId, fetchConnections]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    setLoading(true);
    try {
      await settingsService.deleteTmsConnection(connectionId);
      await fetchConnections();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchConnections]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return { connections, loading, error, fetchConnections, addConnection, deleteConnection };
};

// LD1: Custom hook that manages payment methods
const usePaymentMethods = (shipperId: string) => {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getPaymentMethods(shipperId);
      setPaymentMethods(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  const addPaymentMethod = useCallback(async (paymentMethodParams: any) => {
    setLoading(true);
    try {
      await settingsService.createPaymentMethod(shipperId, paymentMethodParams);
      await fetchPaymentMethods();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId, fetchPaymentMethods]);

  const deletePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setLoading(true);
    try {
      await settingsService.deletePaymentMethod(paymentMethodId);
      await fetchPaymentMethods();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return { paymentMethods, loading, error, fetchPaymentMethods, addPaymentMethod, deletePaymentMethod };
};

// LD1: Custom hook that manages API keys
const useApiKeys = (shipperId: string) => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getApiKeys(shipperId);
      setApiKeys(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  const addApiKey = useCallback(async (apiKeyParams: any) => {
    setLoading(true);
    try {
      await settingsService.createApiKey(shipperId, apiKeyParams);
      await fetchApiKeys();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId, fetchApiKeys]);

  const revokeApiKey = useCallback(async (keyId: string) => {
    setLoading(true);
    try {
      await settingsService.revokeApiKey(keyId);
      await fetchApiKeys();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchApiKeys]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  return { apiKeys, loading, error, fetchApiKeys, addApiKey, revokeApiKey };
};

// LD1: Custom hook that manages webhook settings
const useWebhookSettings = (shipperId: string) => {
  const [settings, setSettings] = useState<{ webhookUrl: string, webhookSecret: string, events: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getWebhookSettings(shipperId);
      setSettings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId]);

  const updateSettings = useCallback(async (webhookSettings: any) => {
    setLoading(true);
    try {
      await settingsService.updateWebhookSettings(shipperId, webhookSettings);
      await fetchSettings();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [shipperId, fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, fetchSettings, updateSettings, setError };
};

export default IntegrationSettings;