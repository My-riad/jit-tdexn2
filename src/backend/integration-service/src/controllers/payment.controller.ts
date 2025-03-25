# src/backend/integration-service/src/controllers/payment.controller.ts
```typescript
import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { PaymentService, PaymentServiceInstance } from '../services/payment.service';
import logger from '@common/utils/logger';
import { handleError } from '@common/utils/error-handler';
import { validateSchema } from '@common/utils/validation';
import { TokenizationRequest, PaymentMethodVerificationRequest, PaymentMethodUpdateParams, PaymentProcessor } from '../models/payment-method.model';
import { IntegrationOwnerType } from '../models/integration.model';

/**
 * Controller for handling payment-related HTTP requests
 */
export class PaymentController {
  /**
   * Payment service instance for managing payment operations
   */
  private paymentService: PaymentService;

  /**
   * Initializes the Payment controller with a payment service instance
   * @param paymentService Payment service instance
   */
  constructor(paymentService: PaymentService) {
    // Store the payment service instance for use in controller methods
    this.paymentService = paymentService;
    // Log controller initialization
    logger.info('PaymentController initialized');
  }

  /**
   * Creates a tokenization session for securely collecting payment method information
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async createTokenizationSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract tokenization request data from request body
      const requestData: TokenizationRequest = req.body;

      // Define the schema for tokenization request validation
      const schema = Joi.object({
        owner_type: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
        owner_id: Joi.string().uuid().required(),
        processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required(),
        method_type: Joi.string().required(),
        return_url: Joi.string().uri().required(),
        metadata: Joi.object()
      });

      // Validate the request data against schema requirements
      const { value, error } = schema.validate(requestData);

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid request data', error: error.details });
      }

      // Call paymentService.createTokenizationSession with validated data
      const tokenizationSession = await this.paymentService.createTokenizationSession(value);

      // Return success response with tokenization session details
      res.status(200).json(tokenizationSession);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.createTokenizationSession');
      next(error);
    }
  }

  /**
   * Processes the callback from tokenization session and creates a payment method
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processTokenCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract owner type, owner ID, and callback data from request
      const { ownerType, ownerId, callbackData } = req.body;

      // Define the schema for callback data validation
      const schema = Joi.object({
        ownerType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
        ownerId: Joi.string().uuid().required(),
        callbackData: Joi.object().required()
      });

      // Validate the request data against schema requirements
      const { value, error } = schema.validate({ ownerType, ownerId, callbackData });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid request data', error: error.details });
      }

      // Call paymentService.processTokenCallback with validated data
      const paymentMethod = await this.paymentService.processTokenCallback(value.ownerType, value.ownerId, value.callbackData);

      // Return success response with created payment method details
      res.status(201).json(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.processTokenCallback');
      next(error);
    }
  }

  /**
   * Retrieves all payment methods for a specific owner
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract owner type and owner ID from request parameters
      const { ownerType, ownerId } = req.params;

      // Define the schema for request parameters validation
      const schema = Joi.object({
        ownerType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
        ownerId: Joi.string().uuid().required()
      });

      // Validate the request parameters against schema requirements
      const { value, error } = schema.validate({ ownerType, ownerId });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid request parameters', error: error.details });
      }

      // Call paymentService.getPaymentMethods with validated data
      const paymentMethods = await this.paymentService.getPaymentMethods(value.ownerType, value.ownerId);

      // Return success response with array of payment methods
      res.status(200).json(paymentMethods);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.getPaymentMethods');
      next(error);
    }
  }

  /**
   * Retrieves a specific payment method by ID
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method ID from request parameters
      const { paymentMethodId } = req.params;

      // Define the schema for payment method ID validation
      const schema = Joi.object({
        paymentMethodId: Joi.string().uuid().required()
      });

      // Validate the payment method ID against schema requirements
      const { value, error } = schema.validate({ paymentMethodId });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid payment method ID', error: error.details });
      }

      // Call paymentService.getPaymentMethod with validated ID
      const paymentMethod = await this.paymentService.getPaymentMethod(value.paymentMethodId);

      // Return success response with payment method details
      res.status(200).json(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.getPaymentMethod');
      next(error);
    }
  }

  /**
   * Creates a new payment method record
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async createPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method creation parameters from request body
      const params = req.body;

      // Define the schema for payment method creation parameters validation
      const schema = Joi.object({
        owner_type: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
        owner_id: Joi.string().uuid().required(),
        method_type: Joi.string().required(),
        processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required(),
        processor_payment_method_id: Joi.string().required(),
        processor_data: Joi.object(),
        nickname: Joi.string(),
        is_default: Joi.boolean(),
        billing_details: Joi.object()
      });

      // Validate the request data against schema requirements
      const { value, error } = schema.validate(params);

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid request data', error: error.details });
      }

      // Call paymentService.createPaymentMethod with validated data
      const paymentMethod = await this.paymentService.createPaymentMethod(value);

      // Return success response with created payment method details
      res.status(201).json(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.createPaymentMethod');
      next(error);
    }
  }

  /**
   * Updates an existing payment method
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async updatePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method ID from request parameters
      const { paymentMethodId } = req.params;

      // Extract update parameters from request body
      const params = req.body;

      // Define the schema for payment method ID and update parameters validation
      const schema = Joi.object({
        paymentMethodId: Joi.string().uuid().required(),
        params: Joi.object({
          nickname: Joi.string(),
          is_default: Joi.boolean(),
          status: Joi.string(),
          billing_details: Joi.object(),
          processor_data: Joi.object()
        })
      });

      // Validate both the ID and update data against schema requirements
      const { value, error } = schema.validate({ paymentMethodId, params });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid request data', error: error.details });
      }

      // Call paymentService.updatePaymentMethod with validated data
      const paymentMethod = await this.paymentService.updatePaymentMethod(value.paymentMethodId, value.params);

      // Return success response with updated payment method details
      res.status(200).json(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.updatePaymentMethod');
      next(error);
    }
  }

  /**
   * Deletes a payment method
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async deletePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method ID from request parameters
      const { paymentMethodId } = req.params;

      // Define the schema for payment method ID validation
      const schema = Joi.object({
        paymentMethodId: Joi.string().uuid().required()
      });

      // Validate the payment method ID against schema requirements
      const { value, error } = schema.validate({ paymentMethodId });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid payment method ID', error: error.details });
      }

      // Call paymentService.deletePaymentMethod with validated ID
      const result = await this.paymentService.deletePaymentMethod(value.paymentMethodId);

      // Return success response with deletion confirmation
      res.status(200).json(result);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.deletePaymentMethod');
      next(error);
    }
  }

  /**
   * Verifies a payment method that requires verification
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async verifyPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract verification request data from request body
      const requestData = req.body;

      // Define the schema for verification request validation
      const schema = Joi.object({
        payment_method_id: Joi.string().uuid().required(),
        verification_data: Joi.object().required()
      });

      // Validate the verification data against schema requirements
      const { value, error } = schema.validate(requestData);

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid verification data', error: error.details });
      }

      // Call paymentService.verifyPaymentMethod with validated data
      const result = await this.paymentService.verifyPaymentMethod(value);

      // Return success response with verification status
      res.status(200).json(result);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.verifyPaymentMethod');
      next(error);
    }
  }

  /**
   * Sets a payment method as the default for an owner
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async setDefaultPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method ID from request parameters
      const { paymentMethodId } = req.params;

      // Define the schema for payment method ID validation
      const schema = Joi.object({
        paymentMethodId: Joi.string().uuid().required()
      });

      // Validate the payment method ID against schema requirements
      const { value, error } = schema.validate({ paymentMethodId });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid payment method ID', error: error.details });
      }

      // Call paymentService.setDefaultPaymentMethod with validated ID
      const paymentMethod = await this.paymentService.setDefaultPaymentMethod(value.paymentMethodId);

      // Return success response with updated payment method details
      res.status(200).json(paymentMethod);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.setDefaultPaymentMethod');
      next(error);
    }
  }

  /**
   * Processes a payment using a specified payment method
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment method ID, amount, currency, description, and metadata from request
      const { paymentMethodId, amount, currency, description, metadata } = req.body;

      // Define the schema for payment parameters validation
      const schema = Joi.object({
        paymentMethodId: Joi.string().uuid().required(),
        amount: Joi.number().positive().required(),
        currency: Joi.string().length(3).required(),
        description: Joi.string().required(),
        metadata: Joi.object()
      });

      // Validate all payment parameters against schema requirements
      const { value, error } = schema.validate({ paymentMethodId, amount, currency, description, metadata });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid payment parameters', error: error.details });
      }

      // Call paymentService.processPayment with validated data
      const paymentDetails = await this.paymentService.processPayment(
        value.paymentMethodId,
        value.amount,
        value.currency,
        value.description,
        value.metadata
      );

      // Return success response with payment details including ID and status
      res.status(200).json(paymentDetails);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.processPayment');
      next(error);
    }
  }

  /**
   * Checks the status of a payment
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment ID and processor from request parameters
      const { paymentId, processor } = req.params;

      // Define the schema for payment ID and processor validation
      const schema = Joi.object({
        paymentId: Joi.string().required(),
        processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required()
      });

      // Validate the parameters against schema requirements
      const { value, error } = schema.validate({ paymentId, processor });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid parameters', error: error.details });
      }

      // Call paymentService.getPaymentStatus with validated data
      const paymentStatus = await this.paymentService.getPaymentStatus(value.paymentId, value.processor);

      // Return success response with payment status and details
      res.status(200).json(paymentStatus);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.getPaymentStatus');
      next(error);
    }
  }

  /**
   * Processes a refund for a payment
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async refundPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract payment ID, amount, reason, and processor from request
      const { paymentId, amount, reason, processor } = req.body;

      // Define the schema for refund parameters validation
      const schema = Joi.object({
        paymentId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        reason: Joi.string().required(),
        processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required()
      });

      // Validate all refund parameters against schema requirements
      const { value, error } = schema.validate({ paymentId, amount, reason, processor });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid refund parameters', error: error.details });
      }

      // Call paymentService.refundPayment with validated data
      const refundDetails = await this.paymentService.refundPayment(
        value.paymentId,
        value.amount,
        value.reason,
        value.processor
      );

      // Return success response with refund details including ID and status
      res.status(200).json(refundDetails);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.refundPayment');
      next(error);
    }
  }

  /**
   * Transfers funds to a driver or carrier account
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async transferFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract recipient type, recipient ID, amount, currency, description, and metadata from request
      const { recipientType, recipientId, amount, currency, description, metadata } = req.body;

      // Define the schema for transfer parameters validation
      const schema = Joi.object({
        recipientType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
        recipientId: Joi.string().uuid().required(),
        amount: Joi.number().positive().required(),
        currency: Joi.string().length(3).required(),
        description: Joi.string().required(),
        metadata: Joi.object()
      });

      // Validate all transfer parameters against schema requirements
      const { value, error } = schema.validate({ recipientType, recipientId, amount, currency, description, metadata });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid transfer parameters', error: error.details });
      }

      // Call paymentService.transferFunds with validated data
      const transferDetails = await this.paymentService.transferFunds(
        value.recipientType as IntegrationOwnerType,
        value.recipientId,
        value.amount,
        value.currency,
        value.description,
        value.metadata
      );

      // Return success response with transfer details including ID and status
      res.status(200).json(transferDetails);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.transferFunds');
      next(error);
    }
  }

  /**
   * Processes an incentive payment to a driver based on efficiency score
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async processDriverIncentive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract driver ID, amount, incentive type, and metadata from request
      const { driverId, amount, incentiveType, metadata } = req.body;

      // Define the schema for incentive parameters validation
      const schema = Joi.object({
        driverId: Joi.string().uuid().required(),
        amount: Joi.number().positive().required(),
        incentiveType: Joi.string().required(),
        metadata: Joi.object()
      });

      // Validate all incentive parameters against schema requirements
      const { value, error } = schema.validate({ driverId, amount, incentiveType, metadata });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid incentive parameters', error: error.details });
      }

      // Call paymentService.processDriverIncentive with validated data
      const paymentDetails = await this.paymentService.processDriverIncentive(
        value.driverId,
        value.amount,
        value.incentiveType,
        value.metadata
      );

      // Return success response with payment details including ID and status
      res.status(200).json(paymentDetails);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.processDriverIncentive');
      next(error);
    }
  }

  /**
   * Processes webhook events from payment processors
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction object
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract processor, payload, and signature from request
      const { processor, payload, signature } = req.body;

      // Define the schema for webhook data validation
      const schema = Joi.object({
        processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required(),
        payload: Joi.string().required(),
        signature: Joi.string().required()
      });

      // Validate the webhook data against schema requirements
      const { value, error } = schema.validate({ processor, payload, signature });

      if (error) {
        // If validation fails, return a 400 Bad Request error
        return res.status(400).json({ message: 'Invalid webhook data', error: error.details });
      }

      // Call paymentService.handleWebhook with validated data
      const eventData = await this.paymentService.handleWebhook(
        value.processor,
        value.payload,
        value.signature
      );

      // Return success response with processed event data
      res.status(200).json(eventData);
    } catch (error: any) {
      // Handle errors with standardized error handling
      handleError(error, 'PaymentController.handleWebhook');
      next(error);
    }
  }
}

// Export the PaymentController class
export const PaymentControllerInstance = new PaymentController(PaymentServiceInstance);
export const { createTokenizationSession, processTokenCallback, getPaymentMethods, getPaymentMethod, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, verifyPaymentMethod, setDefaultPaymentMethod, processPayment, getPaymentStatus, refundPayment, transferFunds, processDriverIncentive, handleWebhook } = PaymentControllerInstance;