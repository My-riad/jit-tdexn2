# src/backend/integration-service/src/providers/stripe.provider.ts
```typescript
import Stripe from 'stripe'; // stripe@^12.0.0
import { v4 as uuid } from 'uuid'; // uuid@^9.0.0

import logger from '@common/utils/logger';
import { paymentConfig } from '../config';
import { PaymentMethod, PaymentMethodType, PaymentProcessor, TokenizationRequest, TokenizationResponse } from '../models/payment-method.model';
import { IntegrationOwnerType } from '../models/integration.model';
import { handleError } from '@common/utils/error-handler';

/**
 * Creates and initializes a Stripe API client instance
 * @returns Configured Stripe API client instance
 */
const createStripeClient = (): Stripe => {
  // Extract Stripe API key from paymentConfig
  const apiKey = paymentConfig.stripe.apiKey;

  // Create a new Stripe instance with the API key and appropriate configuration options
  const stripe = new Stripe(apiKey, {
    apiVersion: paymentConfig.stripe.apiVersion as Stripe.StripeConfig['apiVersion'],
    typescript: true,
  });

  return stripe;
};

/**
 * Creates a Stripe Setup Intent for securely collecting payment method information
 * @param request 
 * @returns Response containing the setup intent and session details
 */
const createSetupIntent = async (request: TokenizationRequest): Promise<TokenizationResponse> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Generate a unique client reference ID based on owner type and ID
    const clientReferenceId = `${request.owner_type}-${request.owner_id}-${uuid()}`;

    // Prepare setup intent request with appropriate metadata
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: [request.method_type],
      metadata: {
        owner_type: request.owner_type,
        owner_id: request.owner_id,
        clientReferenceId: clientReferenceId,
        ...request.metadata,
      },
    });

    // Format and return the tokenization response with the client_secret
    const response: TokenizationResponse = {
      session_id: setupIntent.id,
      client_secret: setupIntent.client_secret as string,
      processor: PaymentProcessor.STRIPE,
      expires_at: new Date(Date.now() + 3600000), // Set appropriate expiration time based on Stripe's limits
    };

    return response;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createSetupIntent');
    throw error;
  }
};

/**
 * Creates a Stripe Payment Intent for processing a payment
 * @param paymentMethodId 
 * @param amount 
 * @param currency 
 * @param description 
 * @param metadata 
 * @returns Payment details including ID and status
 */
const createPaymentIntent = async (
  paymentMethodId: string,
  amount: number,
  currency: string,
  description: string,
  metadata: object
): Promise<{ paymentId: string; status: string; client_secret?: string }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Validate the amount and currency
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (!currency) {
      throw new Error('Currency is required');
    }

    // Prepare payment intent request with amount, currency, payment method, description, and metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method: paymentMethodId,
      description: description,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
        allow_promotions: true,
      },
    });

    // Return the payment ID (Stripe payment intent ID), status, and client_secret if needed
    return {
      paymentId: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createPaymentIntent');
    throw error;
  }
};

/**
 * Retrieves details of a payment method from Stripe
 * @param paymentMethodId 
 * @returns Payment method details from Stripe
 */
const retrievePaymentMethod = async (paymentMethodId: string): Promise<any> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Call Stripe API to retrieve the payment method
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Return the payment method details
    return paymentMethod;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.retrievePaymentMethod');
    throw error;
  }
};

/**
 * Creates a payment method record from Stripe payment method data
 * @param paymentMethodData 
 * @param ownerType 
 * @param ownerId 
 * @returns Payment method data ready to be stored
 */
const createPaymentMethod = async (
  paymentMethodData: any,
  ownerType: IntegrationOwnerType,
  ownerId: string
): Promise<Partial<PaymentMethod>> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Extract payment method details from the provided data
    const { id, type, card, billing_details, metadata, bank_account } = paymentMethodData;

    // Determine the payment method type (CREDIT_CARD, DEBIT_CARD, BANK_ACCOUNT) based on Stripe data
    let methodType: PaymentMethodType;
    if (type === 'card') {
      methodType = PaymentMethodType.CREDIT_CARD;
    } else if (type === 'us_bank_account') {
      methodType = PaymentMethodType.BANK_ACCOUNT;
    } else {
      throw new Error(`Unsupported payment method type: ${type}`);
    }

    // Format the data into a payment method structure
    const paymentMethod: Partial<PaymentMethod> = {
      owner_type: ownerType,
      owner_id: ownerId,
      method_type: methodType,
      processor: PaymentProcessor.STRIPE,
      processor_payment_method_id: id,
      processor_data: paymentMethodData,
      nickname: metadata?.nickname || `Stripe ${type}`,
      is_default: false, // Set appropriate values for method_type, processor (STRIPE), and other fields
      status: 'active',
    };

    // Extract and store last four digits, expiration date, card brand, or bank information
    if (card) {
      paymentMethod.last_four = card.last4;
      paymentMethod.expiration_month = card.exp_month;
      paymentMethod.expiration_year = card.exp_year;
      paymentMethod.card_brand = card.brand;
    } else if (bank_account) {
      paymentMethod.last_four = bank_account.last4;
      paymentMethod.bank_name = bank_account.bank_name;
      paymentMethod.account_type = bank_account.account_type;
    }

    // Mask sensitive information
    if (billing_details) {
      paymentMethod.billing_details = {
        name: billing_details.name,
        email: billing_details.email,
        address: billing_details.address,
      };
    }

    // Return the formatted payment method object
    return paymentMethod;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createPaymentMethod');
    throw error;
  }
};

/**
 * Updates an existing Stripe payment method
 * @param stripePaymentMethodId 
 * @param updateData 
 * @returns Updated payment method details from Stripe
 */
const updatePaymentMethod = async (stripePaymentMethodId: string, updateData: object): Promise<any> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Prepare update data for Stripe API (billing details, metadata, etc.)
    const updateParams = updateData;

    // Call Stripe API to update the payment method
    const paymentMethod = await stripe.paymentMethods.update(stripePaymentMethodId, updateParams);

    // Return the updated payment method details
    return paymentMethod;
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.updatePaymentMethod');
    throw error;
  }
};

/**
 * Deletes a payment method from Stripe
 * @param stripePaymentMethodId 
 * @returns Success status of the deletion operation
 */
const deletePaymentMethod = async (stripePaymentMethodId: string): Promise<{ success: boolean }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Call Stripe API to detach the payment method
    await stripe.paymentMethods.detach(stripePaymentMethodId);

    // Return success status based on API response
    return { success: true };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.deletePaymentMethod');
    return { success: false };
  }
};

/**
 * Checks the status of a payment in Stripe
 * @param paymentIntentId 
 * @returns Current status and details of the payment
 */
const getPaymentStatus = async (paymentIntentId: string): Promise<{ status: string; details?: any }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Call Stripe API to retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Map Stripe payment intent status to standardized status
    const status = paymentIntent.status;

    // Return the payment status and any additional details
    return { status: status, details: paymentIntent };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.getPaymentStatus');
    throw error;
  }
};

/**
 * Processes a refund for a Stripe payment
 * @param paymentIntentId 
 * @param amount 
 * @param reason 
 * @returns Refund details including ID and status
 */
const refundPayment = async (paymentIntentId: string, amount: number, reason: string): Promise<{ refundId: string; status: string }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Validate the payment intent ID and amount
    if (!paymentIntentId) {
      throw new Error('Payment intent ID is required');
    }
    if (!amount || amount <= 0) {
      throw new Error('Invalid refund amount');
    }

    // Prepare refund request with payment intent ID, amount, and reason
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    // Return the refund ID and status
    return {
      refundId: refund.id,
      status: refund.status,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.refundPayment');
    throw error;
  }
};

/**
 * Creates or retrieves a Stripe customer for an owner
 * @param ownerType 
 * @param ownerId 
 * @param customerData 
 * @returns Stripe customer ID
 */
const createCustomer = async (ownerType: IntegrationOwnerType, ownerId: string, customerData: object): Promise<{ customerId: string }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Check if customer already exists for the owner
    // Implement logic to check if a customer already exists for the owner

    // If exists, return the existing customer ID
    // Implement logic to retrieve existing customer ID

    // If not, prepare customer creation request with owner information
    const customer = await stripe.customers.create(customerData);

    // Store the customer ID mapping for future reference
    // Implement logic to store the customer ID mapping

    // Return the customer ID
    return { customerId: customer.id };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createCustomer');
    throw error;
  }
};

/**
 * Transfers funds to a connected Stripe account
 * @param destinationAccountId 
 * @param amount 
 * @param currency 
 * @param description 
 * @param metadata 
 * @returns Transfer details including ID and status
 */
const createTransfer = async (destinationAccountId: string, amount: number, currency: string, description: string, metadata: object): Promise<{ transferId: string; status: string }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Validate the destination account ID, amount, and currency
    if (!destinationAccountId) {
      throw new Error('Destination account ID is required');
    }
    if (!amount || amount <= 0) {
      throw new Error('Invalid transfer amount');
    }
    if (!currency) {
      throw new Error('Currency is required');
    }

    // Prepare transfer request with destination, amount, currency, description, and metadata
    const transfer = await stripe.transfers.create({
      destination: destinationAccountId,
      amount: amount,
      currency: currency,
      description: description,
      metadata: metadata,
    });

    // Return the transfer ID and status
    return {
      transferId: transfer.id,
      status: transfer.status,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createTransfer');
    throw error;
  }
};

/**
 * Creates a payout to a bank account
 * @param connectedAccountId 
 * @param amount 
 * @param currency 
 * @param description 
 * @param metadata 
 * @returns Payout details including ID and status
 */
const createPayoutToBank = async (connectedAccountId: string, amount: number, currency: string, description: string, metadata: object): Promise<{ payoutId: string; status: string }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Validate the connected account ID, amount, and currency
    if (!connectedAccountId) {
      throw new Error('Connected account ID is required');
    }
    if (!amount || amount <= 0) {
      throw new Error('Invalid payout amount');
    }
    if (!currency) {
      throw new Error('Currency is required');
    }

    // Prepare payout request with amount, currency, description, and metadata
    const payout = await stripe.payouts.create({
      amount: amount,
      currency: currency,
      method: 'standard',
      destination: connectedAccountId,
      description: description,
      metadata: metadata,
    });

    // Return the payout ID and status
    return {
      payoutId: payout.id,
      status: payout.status,
    };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.createPayoutToBank');
    throw error;
  }
};

/**
 * Processes Stripe webhook events
 * @param payload 
 * @param signature 
 * @returns Processed webhook event data
 */
const handleWebhookEvent = async (payload: string, signature: string): Promise<{ type: string; data: any }> => {
  try {
    // Initialize Stripe client using createStripeClient()
    const stripe = createStripeClient();

    // Retrieve webhook secret from configuration
    const webhookSecret = paymentConfig.stripe.apiSecret;

    // Verify webhook signature to ensure authenticity
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed.`, { error: err.message });
      throw err;
    }

    // Parse the event data from the payload
    const data = event.data.object;

    // Handle different event types (payment_intent.succeeded, payment_method.attached, etc.)
    switch (event.type) {
      case 'payment_intent.succeeded':
        // For payment-related events, update payment status accordingly
        logger.info(`PaymentIntent succeeded: ${data.id}`);
        break;
      case 'payment_method.attached':
        // For payment method events, handle updates or status changes
        logger.info(`PaymentMethod attached: ${data.id}`);
        break;
      default:
        logger.warn(`Unhandled event type: ${event.type}`);
    }

    // Return the event type and processed data
    return { type: event.type, data: data };
  } catch (error: any) {
    // Handle errors with standardized error handling
    handleError(error, 'StripeProvider.handleWebhookEvent');
    throw error;
  }
};

// Export the StripeProvider functions
export const StripeProvider = {
  createSetupIntent,
  createPaymentIntent,
  retrievePaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentStatus,
  refundPayment,
  createCustomer,
  createTransfer,
  createPayoutToBank,
  handleWebhookEvent,
};