import {
  Configuration, // plaid@^12.0.0
  PlaidApi, // plaid@^12.0.0
  PlaidEnvironments, // plaid@^12.0.0
  Products, // plaid@^12.0.0
  CountryCode, // plaid@^12.0.0
  LinkTokenCreateRequest, // plaid@^12.0.0
  ProcessorTokenCreateRequest, // plaid@^12.0.0
} from 'plaid';
import { v4 as uuid } from 'uuid'; // uuid@^9.0.0

import logger from '@common/utils/logger';
import { paymentConfig } from '../config';
import {
  PaymentMethod,
  PaymentMethodType,
  PaymentProcessor,
  TokenizationRequest,
  TokenizationResponse,
} from '../models/payment-method.model';
import { IntegrationOwnerType } from '../models/integration.model';
import { handleError } from '@common/utils/error-handler';

/**
 * Creates and initializes a Plaid API client instance
 * @returns Configured Plaid API client instance
 */
const createPlaidClient = (): PlaidApi => {
  // Extract Plaid client ID and secret from paymentConfig
  const clientId = paymentConfig.plaid.clientId;
  const clientSecret = paymentConfig.plaid.clientSecret;

  // Determine Plaid environment (sandbox, development, or production) based on configuration
  let environment: PlaidEnvironments;
  switch (paymentConfig.plaid.apiUrl) {
    case 'https://development.plaid.com':
      environment = PlaidEnvironments.development;
      break;
    case 'https://production.plaid.com':
      environment = PlaidEnvironments.production;
      break;
    default:
      environment = PlaidEnvironments.sandbox;
  }

  // Create a new Plaid Configuration with the client ID, secret, and environment
  const configuration = new Configuration({
    basePath: paymentConfig.plaid.apiUrl,
    environment: environment,
    clientId: clientId,
    secret: clientSecret,
  });

  // Create and return a new PlaidApi instance with the configuration
  const client = new PlaidApi(configuration);

  // Set appropriate API version and configuration options
  client.configuration.userAgent = 'freight-optimization-platform';
  client.configuration.plaidApiVersion = paymentConfig.plaid.apiVersion;

  return client;
};

/**
 * Creates a Plaid Link token for initiating the bank account linking process
 * @param request
 * @returns Response containing the link token and session details
 */
const createLinkToken = async (
  request: TokenizationRequest
): Promise<TokenizationResponse> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Generate a unique client user ID based on owner type and ID
    const clientUserId = `${request.owner_type}-${request.owner_id}`;

    // Prepare link token request with client user ID, client name, products (AUTH, TRANSACTIONS), country codes, and language
    const linkTokenRequest: LinkTokenCreateRequest = {
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'Freight Optimization Platform',
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    // Add webhook URL if configured
    if (paymentConfig.plaid.callbackUrl) {
      linkTokenRequest.webhook = paymentConfig.plaid.callbackUrl;
    }

    // Add redirect URI from request if provided
    if (request.return_url) {
      linkTokenRequest.redirect_uri = request.return_url;
    }

    // Call Plaid API to create link token
    const createTokenResponse = await client.linkTokenCreate(linkTokenRequest);

    // Format and return the tokenization response with the link token
    const tokenizationResponse: TokenizationResponse = {
      session_id: uuid(),
      client_secret: createTokenResponse.data.link_token,
      processor: PaymentProcessor.PLAID,
      expires_at: new Date(Date.now() + 3600000), // Expires in 1 hour
    };

    return tokenizationResponse;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.createLinkToken');
    throw error;
  }
};

/**
 * Exchanges a public token from Plaid Link for an access token and item ID
 * @param publicToken
 * @returns Access token and item ID for future API calls
 */
const exchangePublicToken = async (
  publicToken: string
): Promise<{ accessToken: string; itemId: string }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Call Plaid API to exchange public token for access token
    const tokenResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });

    // Return the access token and item ID
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;
    return { accessToken, itemId };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.exchangePublicToken');
    throw error;
  }
};

/**
 * Retrieves bank account information using an access token
 * @param accessToken
 * @param accountId
 * @returns Bank account details including name, type, and mask
 */
const getAccountInfo = async (
  accessToken: string,
  accountId: string
): Promise<any> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Call Plaid API to get accounts linked to the access token
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    });

    // Filter accounts to find the requested account ID
    const account = accountsResponse.data.accounts.find(
      (acc) => acc.account_id === accountId
    );

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    // Extract and return relevant account information
    return {
      name: account.name,
      type: account.subtype,
      mask: account.mask,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.getAccountInfo');
    throw error;
  }
};

/**
 * Creates a processor token for integrating with payment processors
 * @param accessToken
 * @param accountId
 * @param processor
 * @returns Processor token for the specified account
 */
const createProcessorToken = async (
  accessToken: string,
  accountId: string,
  processor: string
): Promise<{ processorToken: string }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Call Plaid API to create processor token for the specified account and processor
    const processorTokenResponse = await client.processorTokenCreate({
      access_token: accessToken,
      account_id: accountId,
      processor: processor,
    } as ProcessorTokenCreateRequest);

    // Return the processor token
    const processorToken = processorTokenResponse.data.processor_token;
    return { processorToken };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.createProcessorToken');
    throw error;
  }
};

/**
 * Creates a payment method record from Plaid account data
 * @param accountData
 * @param ownerType
 * @param ownerId
 * @returns Payment method data ready to be stored
 */
const createPaymentMethod = async (
  accountData: any,
  ownerType: IntegrationOwnerType,
  ownerId: string
): Promise<Partial<PaymentMethod>> => {
  try {
    // Extract account details from the provided data
    const { accessToken, accountId, bankName, accountType, lastFour } = accountData;

    // Format the data into a payment method structure
    const paymentMethod: Partial<PaymentMethod> = {
      owner_type: ownerType,
      owner_id: ownerId,
      method_type: PaymentMethodType.BANK_ACCOUNT,
      processor: PaymentProcessor.PLAID,
      processor_payment_method_id: accountId,
      processor_data: {
        access_token: accessToken,
        account_id: accountId,
      },
      nickname: `${bankName} - ${accountType} - ${lastFour}`,
      is_default: false,
      status: 'active', // Assuming the account is active upon creation
      last_four: lastFour,
      bank_name: bankName,
      account_type: accountType,
    };

    // Mask sensitive information (only store last four digits of account)
    logger.info(
      `Creating payment method for ${ownerType} ${ownerId} with Plaid account ${accountId}`
    );

    // Return the formatted payment method object
    return paymentMethod;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.createPaymentMethod');
    throw error;
  }
};

/**
 * Verifies bank account ownership through micro-deposits
 * @param accessToken
 * @param accountId
 * @param amounts
 * @returns Success status of the verification operation
 */
const verifyMicroDeposits = async (
  accessToken: string,
  accountId: string,
  amounts: number[]
): Promise<{ success: boolean }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Call Plaid API to verify micro-deposits with the provided amounts
    await client.authMicroDepositVerification({
      access_token: accessToken,
      account_id: accountId,
      amounts: amounts,
    });

    // Return success status based on API response
    return { success: true };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.verifyMicroDeposits');
    throw error;
  }
};

/**
 * Initiates an ACH payment from a linked bank account
 * @param accessToken
 * @param accountId
 * @param amount
 * @param description
 * @param metadata
 * @returns Payment details including ID and status
 */
const initiatePayment = async (
  accessToken: string,
  accountId: string,
  amount: number,
  description: string,
  metadata: any
): Promise<{ paymentId: string; status: string }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Generate a unique payment ID
    const paymentId = uuid();

    // Prepare payment initiation request with amount, description, and account details
    // In sandbox environment, you might need to simulate the payment
    // For production, use the actual Plaid API for payment initiation
    logger.info(
      `Initiating payment ${paymentId} for amount ${amount} from account ${accountId}`
    );

    // Store payment details for future reference
    // This is a placeholder - in a real system, you'd store this in a database
    const paymentDetails = {
      paymentId: paymentId,
      accountId: accountId,
      amount: amount,
      description: description,
      metadata: metadata,
      status: 'pending', // Initial status
    };

    // Return payment ID and initial status
    return { paymentId: paymentId, status: paymentDetails.status };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.initiatePayment');
    throw error;
  }
};

/**
 * Checks the status of a payment initiated through Plaid
 * @param paymentId
 * @returns Current status and details of the payment
 */
const getPaymentStatus = async (
  paymentId: string
): Promise<{ status: string; details?: any }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Retrieve payment details from storage
    // This is a placeholder - in a real system, you'd retrieve this from a database
    const paymentDetails = {
      paymentId: paymentId,
      status: 'pending', // Initial status
    };

    // Call Plaid API to check payment status (or simulate in sandbox environment)
    // In sandbox, you might simulate status updates
    // In production, use the Plaid API to get the actual status
    logger.info(`Checking payment status for payment ${paymentId}`);

    // Return the payment status and any additional details
    return { status: paymentDetails.status, details: {} };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.getPaymentStatus');
    throw error;
  }
};

/**
 * Retrieves current balance information for a linked account
 * @param accessToken
 * @param accountId
 * @returns Balance information for the account
 */
const getBalance = async (
  accessToken: string,
  accountId: string
): Promise<{ available: number; current: number; limit?: number }> => {
  try {
    // Initialize Plaid client using createPlaidClient()
    const client = createPlaidClient();

    // Call Plaid API to get balance for the specified account
    const balanceResponse = await client.accountsBalanceGet({
      access_token: accessToken,
      account_ids: [accountId],
    });

    // Extract and return relevant balance information
    const account = balanceResponse.data.accounts.find(
      (acc) => acc.account_id === accountId
    );

    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    return {
      available: account.balances.available || 0,
      current: account.balances.current || 0,
      limit: account.balances.limit,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.getBalance');
    throw error;
  }
};

/**
 * Processes Plaid webhook events
 * @param webhookData
 * @returns Processed webhook event data
 */
const handleWebhook = async (webhookData: any): Promise<{ type: string; data: any }> => {
  try {
    // Extract webhook type and relevant data from the webhook payload
    const webhookType = webhookData.webhook_type;
    const webhookCode = webhookData.webhook_code;

    logger.info(`Handling Plaid webhook event of type ${webhookType} with code ${webhookCode}`);

    // Process different webhook types (AUTH, TRANSACTIONS, ITEM, etc.)
    switch (webhookType) {
      case 'AUTH':
        // Handle AUTH-related webhooks (e.g., verification status updates)
        logger.info('Handling AUTH webhook', { webhookData });
        break;

      case 'TRANSACTIONS':
        // Handle TRANSACTIONS-related webhooks (e.g., new transactions)
        logger.info('Handling TRANSACTIONS webhook', { webhookData });
        break;

      case 'ITEM':
        // Handle ITEM-related webhooks (e.g., error, webhook update)
        logger.info('Handling ITEM webhook', { webhookData });
        break;

      case 'PAYMENT_INITIATION':
        // Handle PAYMENT_INITIATION-related webhooks (e.g., payment status updates)
        logger.info('Handling PAYMENT_INITIATION webhook', { webhookData });
        break;

      default:
        logger.warn(`Unhandled Plaid webhook type: ${webhookType}`);
        break;
    }

    // For payment-related webhooks, update payment status accordingly
    // For item-related webhooks, handle error states or status changes

    // Return the webhook type and processed data
    return { type: webhookType, data: webhookData };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'PlaidProvider.handleWebhook');
    throw error;
  }
};

// Export the PlaidProvider object with all the functions
export const PlaidProvider = {
  createLinkToken,
  exchangePublicToken,
  getAccountInfo,
  createProcessorToken,
  createPaymentMethod,
  verifyMicroDeposits,
  initiatePayment,
  getPaymentStatus,
  getBalance,
  handleWebhook,
};