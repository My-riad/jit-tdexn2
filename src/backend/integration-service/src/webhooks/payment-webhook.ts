import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import { raw } from 'body-parser'; // body-parser@^1.20.2
import logger from '@common/utils/logger';
import { handleError } from '@common/utils/error-handler';
import { PaymentService, PaymentServiceInstance } from '../services/payment.service';
import { PaymentProcessor } from '../models/payment-method.model';
import { paymentConfig } from '../config';
import { KafkaService } from '@event-bus/services/kafka.service';
import { EventCategories } from '@common/constants/event-types';

/**
 * Creates a middleware that parses the raw request body for webhook signature verification
 * @returns Express middleware function that parses raw request body
 */
const createRawBodyParser = () => {
  // Return a middleware function that uses body-parser.raw to parse the request body
  return raw({
    // Configure the middleware to parse the body as raw buffer
    type: 'application/json',
  });
};

// Export the rawBodyParser middleware for use in the webhook route
export const rawBodyParser = createRawBodyParser();

/**
 * Determines which payment processor sent the webhook based on the request path
 * @param req Express Request
 * @returns The identified payment processor type
 */
const determinePaymentProcessor = (req: Request): PaymentProcessor => {
  // Extract the path from the request URL
  const path = req.url;

  // Check if the path contains 'stripe' and return PaymentProcessor.STRIPE if it does
  if (path.includes('stripe')) {
    return PaymentProcessor.STRIPE;
  }

  // Check if the path contains 'plaid' and return PaymentProcessor.PLAID if it does
  if (path.includes('plaid')) {
    return PaymentProcessor.PLAID;
  }

  // Throw an error if the processor cannot be determined from the path
  throw new Error('Could not determine payment processor from request path');
};

/**
 * Extracts the webhook signature from the request headers based on the payment processor
 * @param req Express Request
 * @param processor PaymentProcessor
 * @returns The extracted signature from the appropriate header
 */
const extractSignature = (req: Request, processor: PaymentProcessor): string => {
  // Check the processor type to determine which header to use
  if (processor === PaymentProcessor.STRIPE) {
    // For Stripe, extract the signature from the 'stripe-signature' header
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }
    return signature;
  } else if (processor === PaymentProcessor.PLAID) {
    // For Plaid, extract the signature from the 'plaid-verification' header
    const signature = req.headers['plaid-verification'] as string;
    if (!signature) {
      throw new Error('Missing plaid-verification header');
    }
    return signature;
  }

  // Throw an error if the signature is missing from the headers
  throw new Error('Could not extract webhook signature from headers');
};

/**
 * Express middleware that handles incoming payment webhook requests
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns Promise that resolves when the webhook is processed
 */
export const handlePaymentWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Log the incoming webhook request
    logger.info('Incoming payment webhook request', {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    // Determine the payment processor from the request path
    const processor = determinePaymentProcessor(req);

    // Extract the webhook signature from the request headers
    const signature = extractSignature(req, processor);

    // Get the raw request body for signature verification
    const payload = req.body;

    // Create an instance of the PaymentService
    const paymentService = PaymentServiceInstance;

    // Call paymentService.handleWebhook with the processor, payload, and signature
    const webhookResult = await paymentService.handleWebhook(processor, payload, signature);

    // Process the webhook event and get the event type and data
    const { type, data } = webhookResult;

    // Publish a payment event to the event bus with the processed data
    const kafkaService = new KafkaService(null); // TODO: Fix this null
    await kafkaService.produceEvent({
      metadata: {
        event_id: uuid(),
        event_type: type,
        event_version: '1.0',
        event_time: new Date().toISOString(),
        producer: 'integration-service',
        correlation_id: uuid(),
        category: EventCategories.PAYMENT,
      },
      payload: data,
    });

    // Return a 200 OK response to acknowledge receipt of the webhook
    res.status(200).send({ received: true });
  } catch (error: any) {
    // Handle errors with appropriate logging and response status codes
    const appError = handleError(error, 'handlePaymentWebhook');
    logger.error('Payment webhook processing failed', {
      error: appError.message,
      code: appError.code,
      url: req.url,
      method: req.method,
    });

    // Send error response with appropriate status code and message
    res.status(appError.statusCode).send({ error: appError.message });
  }
};