# src/backend/integration-service/src/services/payment.service.ts
```typescript
import { v4 as uuid } from 'uuid'; // uuid@^9.0.0
import logger from '@common/utils/logger';
import { handleError } from '@common/utils/error-handler';
import { ErrorCodes } from '@common/constants/error-codes';
import { paymentConfig } from '../config';
import { StripeProvider } from '../providers/stripe.provider';
import { PlaidProvider } from '../providers/plaid.provider';
import { PaymentMethod, PaymentMethodType, PaymentProcessor, PaymentMethodCreationParams, PaymentMethodUpdateParams, PaymentMethodResponse, TokenizationRequest, TokenizationResponse, PaymentMethodVerificationRequest, IntegrationOwnerType } from '../models/payment-method.model';
import { db } from '@common/config/database.config';

/**
 * Service for managing payment operations and integrating with payment processors
 */
export class PaymentService {
  /**
   * Cache for storing payment methods.
   * Key: payment_method_id, Value: PaymentMethod object
   */
  private paymentMethodsCache: Map<string, PaymentMethod>;

  /**
   * Initializes the Payment service
   */
  constructor() {
    // Initialize the payment methods cache
    this.paymentMethodsCache = new Map<string, PaymentMethod>();

    // Log service initialization
    logger.info('PaymentService initialized');
  }

  /**
   * Creates a tokenization session for securely collecting payment method information
   * @param request 
   * @returns Response containing the tokenization session details
   */
  async createTokenizationSession(request: TokenizationRequest): Promise<TokenizationResponse> {
    try {
      // Validate the tokenization request parameters
      if (!request.owner_type || !request.owner_id || !request.method_type || !request.return_url) {
        throw new Error('Invalid tokenization request parameters');
      }

      // Determine which payment processor to use (Stripe or Plaid)
      let response: TokenizationResponse;
      if (request.processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.createSetupIntent
        response = await StripeProvider.createSetupIntent(request);
      } else if (request.processor === PaymentProcessor.PLAID) {
        // For Plaid, call PlaidProvider.createLinkToken
        response = await PlaidProvider.createLinkToken(request);
      } else {
        throw new Error('Unsupported payment processor');
      }

      // Return the tokenization response with appropriate session details
      return response;
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.createTokenizationSession');
      throw error;
    }
  }

  /**
   * Processes the callback from tokenization session and creates a payment method
   * @param ownerType 
   * @param ownerId 
   * @param callbackData 
   * @returns Created payment method details
   */
  async processTokenCallback(ownerType: IntegrationOwnerType, ownerId: string, callbackData: any): Promise<PaymentMethodResponse> {
    try {
      // Validate the callback data and owner information
      if (!ownerType || !ownerId || !callbackData) {
        throw new Error('Invalid callback data or owner information');
      }

      // Determine which payment processor to use based on the callback data
      let paymentMethod: Partial<PaymentMethod>;
      if (callbackData.processor === PaymentProcessor.STRIPE) {
        // For Stripe, process the setup intent confirmation
        paymentMethod = await StripeProvider.createPaymentMethod(callbackData, ownerType, ownerId);
      } else if (callbackData.processor === PaymentProcessor.PLAID) {
        // For Plaid, exchange the public token for access token and account information
        paymentMethod = await PlaidProvider.createPaymentMethod(callbackData, ownerType, ownerId);
      } else {
        throw new Error('Unsupported payment processor');
      }

      // Generate a unique payment method ID
      const paymentMethodId = uuid();
      paymentMethod.payment_method_id = paymentMethodId;

      // Prepare the payment method record with provided parameters
      const paymentMethodRecord: PaymentMethod = {
        payment_method_id: paymentMethodId,
        owner_type: paymentMethod.owner_type!,
        owner_id: paymentMethod.owner_id!,
        method_type: paymentMethod.method_type!,
        processor: paymentMethod.processor!,
        processor_payment_method_id: paymentMethod.processor_payment_method_id!,
        processor_data: paymentMethod.processor_data!,
        nickname: paymentMethod.nickname!,
        is_default: paymentMethod.is_default!,
        status: paymentMethod.status!,
        last_four: paymentMethod.last_four!,
        expiration_month: paymentMethod.expiration_month,
        expiration_year: paymentMethod.expiration_year,
        card_brand: paymentMethod.card_brand,
        bank_name: paymentMethod.bank_name,
        account_type: paymentMethod.account_type,
        billing_details: paymentMethod.billing_details,
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Store the payment method in the database
      await db('payment_methods').insert(paymentMethodRecord);

      // Update the cache with the new payment method
      this.updatePaymentMethodCache(paymentMethodRecord);

      // Return the created payment method (with sensitive data removed)
      return this.sanitizePaymentMethod(paymentMethodRecord);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.processTokenCallback');
      throw error;
    }
  }

  /**
   * Retrieves all payment methods for a specific owner
   * @param ownerType 
   * @param ownerId 
   * @returns Array of payment methods
   */
  async getPaymentMethods(ownerType: IntegrationOwnerType, ownerId: string): Promise<PaymentMethodResponse[]> {
    try {
      // Validate the owner type and ID
      if (!ownerType || !ownerId) {
        throw new Error('Invalid owner type or ID');
      }

      // Query the database for payment methods matching the owner
      const paymentMethods: PaymentMethod[] = await db('payment_methods')
        .where({ owner_type: ownerType, owner_id: ownerId });

      // Transform the payment methods to remove sensitive information
      const sanitizedPaymentMethods: PaymentMethodResponse[] = paymentMethods.map(paymentMethod => this.sanitizePaymentMethod(paymentMethod));

      // Update the cache with the retrieved payment methods
      sanitizedPaymentMethods.forEach(paymentMethod => this.updatePaymentMethodCache(paymentMethod as PaymentMethod));

      // Return the payment methods array
      return sanitizedPaymentMethods;
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.getPaymentMethods');
      throw error;
    }
  }

  /**
   * Retrieves a specific payment method by ID
   * @param paymentMethodId 
   * @returns Payment method details
   */
  async getPaymentMethod(paymentMethodId: string): Promise<PaymentMethodResponse> {
    try {
      // Validate the payment method ID
      if (!paymentMethodId) {
        throw new Error('Invalid payment method ID');
      }

      // Check the cache for the payment method
      let paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Transform the payment method to remove sensitive information
      return this.sanitizePaymentMethod(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.getPaymentMethod');
      throw error;
    }
  }

  /**
   * Creates a new payment method record
   * @param params 
   * @returns Created payment method details
   */
  async createPaymentMethod(params: PaymentMethodCreationParams): Promise<PaymentMethodResponse> {
    try {
      // Validate the payment method creation parameters
      if (!params.owner_type || !params.owner_id || !params.method_type || !params.processor || !params.processor_payment_method_id) {
        throw new Error('Invalid payment method creation parameters');
      }

      // Generate a unique payment method ID
      const paymentMethodId = uuid();

      // Prepare the payment method record with provided parameters
      const paymentMethod: PaymentMethod = {
        payment_method_id: paymentMethodId,
        owner_type: params.owner_type,
        owner_id: params.owner_id,
        method_type: params.method_type,
        processor: params.processor,
        processor_payment_method_id: params.processor_payment_method_id,
        processor_data: params.processor_data || {},
        nickname: params.nickname || `Payment Method ${paymentMethodId}`,
        is_default: params.is_default || false,
        status: PaymentMethodStatus.ACTIVE,
        last_four: '0000', // Default value, should be updated by the processor
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Store the payment method in the database
      await db('payment_methods').insert(paymentMethod);

      // Update the cache with the new payment method
      this.updatePaymentMethodCache(paymentMethod);

      // Return the created payment method (with sensitive data removed)
      return this.sanitizePaymentMethod(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.createPaymentMethod');
      throw error;
    }
  }

  /**
   * Updates an existing payment method
   * @param paymentMethodId 
   * @param params 
   * @returns Updated payment method details
   */
  async updatePaymentMethod(paymentMethodId: string, params: PaymentMethodUpdateParams): Promise<PaymentMethodResponse> {
    try {
      // Validate the payment method ID and update parameters
      if (!paymentMethodId || !params) {
        throw new Error('Invalid payment method ID or update parameters');
      }

      // Retrieve the existing payment method
      let paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Determine which payment processor to use based on the payment method
      if (paymentMethod.processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.updatePaymentMethod if needed
        // Implement logic to update Stripe payment method if required
      } else if (paymentMethod.processor === PaymentProcessor.PLAID) {
        // For Plaid, implement appropriate update logic
        // Implement logic to update Plaid payment method if required
      }

      // Update the payment method record with provided parameters
      await db('payment_methods')
        .where({ payment_method_id: paymentMethodId })
        .update(params);

      // Retrieve the updated payment method from the database
      paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Update the cache with the updated payment method
      this.updatePaymentMethodCache(paymentMethod);

      // Return the updated payment method (with sensitive data removed)
      return this.sanitizePaymentMethod(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.updatePaymentMethod');
      throw error;
    }
  }

  /**
   * Deletes a payment method
   * @param paymentMethodId 
   * @returns Success status of the deletion operation
   */
  async deletePaymentMethod(paymentMethodId: string): Promise<{ success: boolean }> {
    try {
      // Validate the payment method ID
      if (!paymentMethodId) {
        throw new Error('Invalid payment method ID');
      }

      // Retrieve the existing payment method
      const paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Determine which payment processor to use based on the payment method
      if (paymentMethod.processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.deletePaymentMethod
        await StripeProvider.deletePaymentMethod(paymentMethod.processor_payment_method_id);
      } else if (paymentMethod.processor === PaymentProcessor.PLAID) {
        // For Plaid, handle any necessary cleanup
        // Implement logic to handle Plaid-specific deletion
      }

      // Delete the payment method from the database
      await db('payment_methods')
        .where({ payment_method_id: paymentMethodId })
        .del();

      // Remove the payment method from the cache
      this.removePaymentMethodFromCache(paymentMethodId);

      // Return success status
      return { success: true };
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.deletePaymentMethod');
      return { success: false };
    }
  }

  /**
   * Verifies a payment method that requires verification
   * @param request 
   * @returns Success status of the verification operation
   */
  async verifyPaymentMethod(request: PaymentMethodVerificationRequest): Promise<{ success: boolean }> {
    try {
      // Validate the verification request
      if (!request || !request.payment_method_id || !request.verification_data) {
        throw new Error('Invalid verification request');
      }

      // Retrieve the payment method to verify
      const paymentMethod = await this.getPaymentMethodFromCache(request.payment_method_id);

      // If payment method is not in PENDING_VERIFICATION status, throw an error
      if (paymentMethod.status !== PaymentMethodStatus.PENDING_VERIFICATION) {
        throw new Error('Payment method is not pending verification');
      }

      // Determine which payment processor to use based on the payment method
      if (paymentMethod.processor === PaymentProcessor.STRIPE) {
        // For Stripe, verify the payment method using appropriate verification data
        // Implement Stripe verification logic
      } else if (paymentMethod.processor === PaymentProcessor.PLAID) {
        // For Plaid, verify micro-deposits or other verification method
        // Implement Plaid verification logic
      }

      // Update the payment method status to ACTIVE if verification succeeds
      await db('payment_methods')
        .where({ payment_method_id: request.payment_method_id })
        .update({ status: PaymentMethodStatus.ACTIVE });

      // Retrieve the updated payment method from the database
      const updatedPaymentMethod = await this.getPaymentMethodFromCache(request.payment_method_id);

      // Update the cache with the updated payment method
      this.updatePaymentMethodCache(updatedPaymentMethod);

      // Return success status
      return { success: true };
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.verifyPaymentMethod');
      return { success: false };
    }
  }

  /**
   * Sets a payment method as the default for an owner
   * @param paymentMethodId 
   * @returns Updated payment method details
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentMethodResponse> {
    try {
      // Validate the payment method ID
      if (!paymentMethodId) {
        throw new Error('Invalid payment method ID');
      }

      // Retrieve the payment method to set as default
      const paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Get all payment methods for the same owner
      const paymentMethods = await this.getPaymentMethods(paymentMethod.owner_type, paymentMethod.owner_id);

      // Update all payment methods to set is_default to false
      await db('payment_methods')
        .where({ owner_type: paymentMethod.owner_type, owner_id: paymentMethod.owner_id })
        .update({ is_default: false });

      // Update the specified payment method to set is_default to true
      await db('payment_methods')
        .where({ payment_method_id: paymentMethodId })
        .update({ is_default: true });

      // Retrieve the updated payment method from the database
      const updatedPaymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);

      // Update the cache with the updated payment methods
      paymentMethods.forEach(paymentMethod => this.updatePaymentMethodCache(paymentMethod as PaymentMethod));

      // Return the updated default payment method
      return this.sanitizePaymentMethod(updatedPaymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.setDefaultPaymentMethod');
      throw error;
    }
  }

  /**
   * Processes a payment using a specified payment method
   * @param paymentMethodId 
   * @param amount 
   * @param currency 
   * @param description 
   * @param metadata 
   * @returns Payment details including ID and status
   */
  async processPayment(\n    paymentMethodId: string,\n    amount: number,\n    currency: string,\n    description: string,\n    metadata: object\n  ): Promise<{ paymentId: string; status: string; client_secret?: string }>\n   {\n    try {\n      // Validate the payment method ID, amount, currency, and description\n      if (!paymentMethodId) {\n        throw new Error('Payment method ID is required');\n      }\n      if (!amount || amount <= 0) {\n        throw new Error('Invalid payment amount');\n      }\n      if (!currency) {\n        throw new Error('Currency is required');\n      }\n      if (!description) {\n        throw new Error('Description is required');\n      }\n\n      // Retrieve the payment method to use for payment\n      const paymentMethod = await this.getPaymentMethodFromCache(paymentMethodId);\n\n      // If payment method is not ACTIVE, throw an error\n      if (paymentMethod.status !== PaymentMethodStatus.ACTIVE) {\n        throw new Error('Payment method is not active');\n      }\n\n      // Determine which payment processor to use based on the payment method\n      if (paymentMethod.processor === PaymentProcessor.STRIPE) {\n        // For Stripe, call StripeProvider.createPaymentIntent\n        const paymentDetails = await StripeProvider.createPaymentIntent(\n          paymentMethod.processor_payment_method_id,\n          amount,\n          currency,\n          description,\n          metadata\n        );\n\n        // Store the payment record in the database\n        // Implement logic to store payment details in the database\n\n        // Return the payment ID, status, and any additional data needed by the client\n        return paymentDetails;\n      } else if (paymentMethod.processor === PaymentProcessor.PLAID) {\n        // For Plaid, call PlaidProvider.initiatePayment\n        const paymentDetails = await PlaidProvider.initiatePayment(\n          paymentMethod.processor_data.access_token,\n          paymentMethod.processor_payment_method_id,\n          amount,\n          description,\n          metadata\n        );\n\n        // Store the payment record in the database\n        // Implement logic to store payment details in the database\n\n        // Return the payment ID, status, and any additional data needed by the client\n        return paymentDetails;\n      } else {\n        throw new Error('Unsupported payment processor');\n      }\n    } catch (error: any) {\n      // Handle errors with standardized error handling\n      handleError(error, 'PaymentService.processPayment');\n      throw error;\n    }\n  }\n

  /**
   * Checks the status of a payment
   * @param paymentId 
   * @param processor 
   * @returns Current status and details of the payment
   */
  async getPaymentStatus(paymentId: string, processor: PaymentProcessor): Promise<{ status: string; details?: any }> {
    try {
      // Validate the payment ID and processor
      if (!paymentId || !processor) {
        throw new Error('Invalid payment ID or processor');
      }

      // Determine which payment processor to use
      if (processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.getPaymentStatus
        return await StripeProvider.getPaymentStatus(paymentId);
      } else if (processor === PaymentProcessor.PLAID) {
        // For Plaid, call PlaidProvider.getPaymentStatus
        return await PlaidProvider.getPaymentStatus(paymentId);
      } else {
        throw new Error('Unsupported payment processor');
      }
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.getPaymentStatus');
      throw error;
    }
  }

  /**
   * Processes a refund for a payment
   * @param paymentId 
   * @param amount 
   * @param reason 
   * @param processor 
   * @returns Refund details including ID and status
   */
  async refundPayment(paymentId: string, amount: number, reason: string, processor: PaymentProcessor): Promise<{ refundId: string; status: string }> {
    try {
      // Validate the payment ID, amount, reason, and processor
      if (!paymentId || !amount || !reason || !processor) {
        throw new Error('Invalid refund parameters');
      }

      // Determine which payment processor to use
      if (processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.refundPayment
        return await StripeProvider.refundPayment(paymentId, amount, reason);
      } else if (processor === PaymentProcessor.PLAID) {
        // For Plaid, implement appropriate refund logic
        // Implement Plaid refund logic
        throw new Error('Plaid refund not implemented');
      } else {
        throw new Error('Unsupported payment processor');
      }

      // Store the refund record in the database
      // Implement logic to store refund details in the database

      // Return the refund ID and status
      return { refundId: 'refund-id', status: 'succeeded' };
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.refundPayment');
      throw error;
    }
  }

  /**
   * Transfers funds to a driver or carrier account
   * @param recipientType 
   * @param recipientId 
   * @param amount 
   * @param currency 
   * @param description 
   * @param metadata 
   * @returns Transfer details including ID and status
   */
  async transferFunds(\n    recipientType: IntegrationOwnerType,\n    recipientId: string,\n    amount: number,\n    currency: string,\n    description: string,\n    metadata: object\n  ): Promise<{ transferId: string; status: string }>\n   {\n    try {\n      // Validate the recipient type, recipient ID, amount, currency, and description\n      if (!recipientType || !recipientId || !amount || !currency || !description) {\n        throw new Error('Invalid transfer parameters');\n      }\n\n      // Get the default payment method for the recipient\n      const paymentMethods = await this.getPaymentMethods(recipientType, recipientId);\n      const defaultPaymentMethod = paymentMethods.find(method => method.is_default);\n\n      // If no default payment method, throw an error\n      if (!defaultPaymentMethod) {\n        throw new Error('No default payment method found for recipient');\n      }\n\n      // Determine which payment processor to use based on the payment method\n      if (defaultPaymentMethod.processor === PaymentProcessor.STRIPE) {\n        // For Stripe, call StripeProvider.createTransfer\n        // Implement Stripe transfer logic\
        throw new Error('Stripe transfer not implemented');
      } else if (defaultPaymentMethod.processor === PaymentProcessor.PLAID) {
        // For Plaid, implement appropriate transfer logic
        // Implement Plaid transfer logic
        throw new Error('Plaid transfer not implemented');
      } else {\n        throw new Error('Unsupported payment processor');\n      }\n\n      // Store the transfer record in the database\
      // Implement logic to store transfer details in the database\n\n      // Return the transfer ID and status\
      return { transferId: 'transfer-id', status: 'succeeded' };\n    } catch (error: any) {\n      // Handle errors with standardized error handling\n      handleError(error, 'PaymentService.transferFunds');\n      throw error;\n    }\n  }\n

  /**
   * Processes an incentive payment to a driver based on efficiency score
   * @param driverId 
   * @param amount 
   * @param incentiveType 
   * @param metadata 
   * @returns Payment details including ID and status
   */
  async processDriverIncentive(driverId: string, amount: number, incentiveType: string, metadata: object): Promise<{ paymentId: string; status: string }> {
    try {
      // Validate the driver ID, amount, and incentive type
      if (!driverId || !amount || !incentiveType) {
        throw new Error('Invalid incentive parameters');
      }

      // Get the default payment method for the driver
      const paymentMethods = await this.getPaymentMethods(IntegrationOwnerType.DRIVER, driverId);
      const defaultPaymentMethod = paymentMethods.find(method => method.is_default);

      // If no default payment method, throw an error
      if (!defaultPaymentMethod) {
        throw new Error('No default payment method found for driver');
      }

      // Prepare metadata with incentive information and driver details
      const transferMetadata = {
        ...metadata,
        incentiveType: incentiveType,
        driverId: driverId,
      };

      // Call transferFunds with the driver as recipient
      const transferDetails = await this.transferFunds(
        IntegrationOwnerType.DRIVER,
        driverId,
        amount,
        'USD', // Assuming USD as the currency
        `Incentive payment for ${incentiveType}`,
        transferMetadata
      );

      // Store the incentive record in the database
      // Implement logic to store incentive details in the database

      // Return the payment ID and status
      return { paymentId: transferDetails.transferId, status: transferDetails.status };
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.processDriverIncentive');
      throw error;
    }
  }

  /**
   * Processes webhook events from payment processors
   * @param processor 
   * @param payload 
   * @param signature 
   * @returns Processed webhook event data
   */
  async handleWebhook(processor: PaymentProcessor, payload: string, signature: string): Promise<{ type: string; data: any }> {
    try {
      // Validate the processor, payload, and signature
      if (!processor || !payload || !signature) {
        throw new Error('Invalid webhook parameters');
      }

      // Determine which payment processor to use
      if (processor === PaymentProcessor.STRIPE) {
        // For Stripe, call StripeProvider.handleWebhookEvent
        return await StripeProvider.handleWebhookEvent(payload, signature);
      } else if (processor === PaymentProcessor.PLAID) {
        // For Plaid, call PlaidProvider.handleWebhook
        // Implement Plaid webhook handling logic
        throw new Error('Plaid webhook not implemented');
      } else {
        throw new Error('Unsupported payment processor');
      }

      // Process the webhook event based on its type
      // Update any relevant records in the database

      // Return the event type and processed data
      return { type: 'webhook-event', data: {} };
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentService.handleWebhook');
      throw error;
    }
  }

  /**
   * Retrieves a payment method from the cache or database
   * @param paymentMethodId 
   * @returns Payment method details
   */
  private async getPaymentMethodFromCache(paymentMethodId: string): Promise<PaymentMethod> {
    // Check if the payment method is in the cache
    if (this.paymentMethodsCache.has(paymentMethodId)) {
      // If found in cache, return the cached payment method
      return this.paymentMethodsCache.get(paymentMethodId)!;
    }

    // If not in cache, query the database
    const paymentMethod: PaymentMethod[] = await db('payment_methods')
      .where({ payment_method_id: paymentMethodId });

    // If found in database, add to cache and return
    if (paymentMethod.length > 0) {
      this.paymentMethodsCache.set(paymentMethodId, paymentMethod[0]);
      return paymentMethod[0];
    }

    // If not found, throw a not found error
    throw new Error('Payment method not found');
  }

  /**
   * Updates the payment method cache with the provided payment method
   * @param paymentMethod 
   */
  private updatePaymentMethodCache(paymentMethod: PaymentMethod): void {
    // Add or update the payment method in the cache using its ID as the key
    this.paymentMethodsCache.set(paymentMethod.payment_method_id, paymentMethod);
  }

  /**
   * Removes a payment method from the cache
   * @param paymentMethodId 
   */
  private removePaymentMethodFromCache(paymentMethodId: string): void {
    // Remove the payment method from the cache using its ID as the key
    this.paymentMethodsCache.delete(paymentMethodId);
  }

  /**
   * Removes sensitive information from a payment method for safe response
   * @param paymentMethod 
   * @returns Payment method with sensitive data removed
   */
  private sanitizePaymentMethod(paymentMethod: PaymentMethod): PaymentMethodResponse {
    // Create a copy of the payment method
    const sanitizedPaymentMethod: PaymentMethodResponse = {
      payment_method_id: paymentMethod.payment_method_id,
      owner_type: paymentMethod.owner_type,
      owner_id: paymentMethod.owner_id,
      method_type: paymentMethod.method_type,
      processor: paymentMethod.processor,
      nickname: paymentMethod.nickname,
      is_default: paymentMethod.is_default,
      status: paymentMethod.status,
      last_four: paymentMethod.last_four,
      expiration_month: paymentMethod.expiration_month,
      expiration_year: paymentMethod.expiration_year,
      card_brand: paymentMethod.card_brand,
      bank_name: paymentMethod.bank_name,
      account_type: paymentMethod.account_type,
      billing_details: paymentMethod.billing_details,
      created_at: paymentMethod.created_at,
      updated_at: paymentMethod.updated_at,
    };

    return sanitizedPaymentMethod;
  }
}

// Export the PaymentService class
export const PaymentServiceInstance = new PaymentService();
export const PaymentService = PaymentServiceInstance;