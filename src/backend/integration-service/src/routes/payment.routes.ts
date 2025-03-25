import express, { Router } from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2

import { PaymentControllerInstance as PaymentController } from '../controllers/payment.controller';
import { authenticate } from '@common/middleware/auth.middleware';
import { validateBody, validateParams } from '@common/middleware/validation.middleware';
import { IntegrationOwnerType, PaymentProcessor } from '../models/payment-method.model';

/**
 * Creates and configures the payment routes for the integration service
 * @returns Configured Express router with payment routes
 */
function createPaymentRoutes(): Router {
  // Create a new Express router instance
  const router = express.Router();

  // Define validation schemas for various payment routes
  const paymentMethodIdSchema = Joi.object({
    paymentMethodId: Joi.string().uuid().required()
  });

  const ownerParamsSchema = Joi.object({
    ownerType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
    ownerId: Joi.string().uuid().required()
  });

  const paymentParamsSchema = Joi.object({
    paymentId: Joi.string().required(),
    processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required()
  });

  const tokenizationRequestSchema = Joi.object({
    owner_type: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
    owner_id: Joi.string().uuid().required(),
    processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required(),
    method_type: Joi.string().required(),
    return_url: Joi.string().uri().required(),
    metadata: Joi.object()
  });

  const tokenCallbackSchema = Joi.object({
    ownerType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
    ownerId: Joi.string().uuid().required(),
    callbackData: Joi.object().required()
  });

  const paymentMethodCreationSchema = Joi.object({
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

  const paymentMethodUpdateSchema = Joi.object({
    nickname: Joi.string(),
    is_default: Joi.boolean(),
    status: Joi.string(),
    billing_details: Joi.object(),
    processor_data: Joi.object()
  });

  const paymentVerificationSchema = Joi.object({
    payment_method_id: Joi.string().uuid().required(),
    verification_data: Joi.object().required()
  });

  const paymentProcessingSchema = Joi.object({
    paymentMethodId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).required(),
    description: Joi.string().required(),
    metadata: Joi.object()
  });

  const refundPaymentSchema = Joi.object({
    paymentId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    reason: Joi.string().required(),
    processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required()
  });

  const transferFundsSchema = Joi.object({
    recipientType: Joi.string().valid(IntegrationOwnerType.CARRIER, IntegrationOwnerType.SHIPPER, IntegrationOwnerType.DRIVER).required(),
    recipientId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).required(),
    description: Joi.string().required(),
    metadata: Joi.object()
  });

  const driverIncentiveSchema = Joi.object({
    driverId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    incentiveType: Joi.string().required(),
    metadata: Joi.object()
  });

  const webhookSchema = Joi.object({
    processor: Joi.string().valid(PaymentProcessor.STRIPE, PaymentProcessor.PLAID).required(),
    payload: Joi.string().required(),
    signature: Joi.string().required()
  });

  // Configure routes for payment method management
  router.get('/:ownerType/:ownerId/payment-methods', authenticate, validateParams(ownerParamsSchema), PaymentController.getPaymentMethods.bind(PaymentController));
  router.get('/payment-methods/:paymentMethodId', authenticate, validateParams(paymentMethodIdSchema), PaymentController.getPaymentMethod.bind(PaymentController));
  router.post('/payment-methods', authenticate, validateBody(paymentMethodCreationSchema), PaymentController.createPaymentMethod.bind(PaymentController));
  router.put('/payment-methods/:paymentMethodId', authenticate, validateParams(paymentMethodIdSchema), validateBody(paymentMethodUpdateSchema), PaymentController.updatePaymentMethod.bind(PaymentController));
  router.delete('/payment-methods/:paymentMethodId', authenticate, validateParams(paymentMethodIdSchema), PaymentController.deletePaymentMethod.bind(PaymentController));
  router.post('/payment-methods/:paymentMethodId/verify', authenticate, validateParams(paymentMethodIdSchema), validateBody(paymentVerificationSchema), PaymentController.verifyPaymentMethod.bind(PaymentController));
  router.post('/payment-methods/:paymentMethodId/default', authenticate, validateParams(paymentMethodIdSchema), PaymentController.setDefaultPaymentMethod.bind(PaymentController));

  // Configure routes for payment processing
  router.post('/tokenization-session', authenticate, validateBody(tokenizationRequestSchema), PaymentController.createTokenizationSession.bind(PaymentController));
  router.post('/token-callback', authenticate, validateBody(tokenCallbackSchema), PaymentController.processTokenCallback.bind(PaymentController));
  router.post('/process-payment', authenticate, validateBody(paymentProcessingSchema), PaymentController.processPayment.bind(PaymentController));
  router.get('/payment-status/:paymentId/:processor', authenticate, validateParams(paymentParamsSchema), PaymentController.getPaymentStatus.bind(PaymentController));
  router.post('/refund-payment', authenticate, validateBody(refundPaymentSchema), PaymentController.refundPayment.bind(PaymentController));
  router.post('/transfer-funds', authenticate, validateBody(transferFundsSchema), PaymentController.transferFunds.bind(PaymentController));
  router.post('/driver-incentive', authenticate, validateBody(driverIncentiveSchema), PaymentController.processDriverIncentive.bind(PaymentController));

  // Configure routes for payment webhooks
  router.post('/webhooks', validateBody(webhookSchema), PaymentController.handleWebhook.bind(PaymentController));

  // Return the configured router
  return router;
}

// Export the configured payment routes router
export default createPaymentRoutes();