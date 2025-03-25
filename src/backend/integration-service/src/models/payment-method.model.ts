/**
 * Payment Method Model
 * 
 * Model definition for payment methods that provides interfaces and enumerations
 * for managing different payment methods (credit cards, debit cards, bank accounts)
 * across multiple payment processors (Stripe, Plaid). This model supports the
 * payment processing capabilities required for driver incentives, carrier settlements,
 * and shipper billing.
 */

import { IntegrationOwnerType } from './integration.model';

/**
 * Enumeration of supported payment method types in the system
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',   // Credit card payment method
  DEBIT_CARD = 'debit_card',     // Debit card payment method
  BANK_ACCOUNT = 'bank_account', // Bank account payment method
}

/**
 * Enumeration of possible payment method statuses
 */
export enum PaymentMethodStatus {
  ACTIVE = 'active',                         // Payment method is active and can be used
  PENDING_VERIFICATION = 'pending_verification', // Payment method requires verification
  INACTIVE = 'inactive',                     // Payment method is inactive
  EXPIRED = 'expired',                       // Payment method has expired
}

/**
 * Enumeration of supported payment processors
 */
export enum PaymentProcessor {
  STRIPE = 'stripe', // Stripe payment processor (v.2023-10)
  PLAID = 'plaid',   // Plaid financial service (v.2023-10)
}

/**
 * Interface for payment method data structure
 */
export interface PaymentMethod {
  payment_method_id: string;                 // Unique identifier for the payment method
  owner_type: IntegrationOwnerType;          // Type of entity that owns this payment method
  owner_id: string;                          // ID of the entity that owns this payment method
  method_type: PaymentMethodType;            // Type of payment method
  processor: PaymentProcessor;               // Payment processor used for this method
  processor_payment_method_id: string;       // ID of this payment method in the processor's system
  processor_data: object;                    // Additional processor-specific data
  nickname: string;                          // User-defined nickname for this payment method
  is_default: boolean;                       // Whether this is the default payment method
  status: PaymentMethodStatus;               // Current status of the payment method
  last_four: string;                         // Last four digits of card or account number
  expiration_month?: number;                 // Expiration month (for cards)
  expiration_year?: number;                  // Expiration year (for cards)
  card_brand?: string;                       // Card brand (for cards, e.g., Visa, Mastercard)
  bank_name?: string;                        // Bank name (for bank accounts)
  account_type?: string;                     // Account type (for bank accounts, e.g., checking, savings)
  billing_details?: object;                  // Billing address and contact information
  created_at: Date;                          // Timestamp when the payment method was created
  updated_at: Date;                          // Timestamp when the payment method was last updated
}

/**
 * Interface for payment method creation parameters
 */
export interface PaymentMethodCreationParams {
  owner_type: IntegrationOwnerType;          // Type of entity that will own this payment method
  owner_id: string;                          // ID of the entity that will own this payment method
  method_type: PaymentMethodType;            // Type of payment method to create
  processor: PaymentProcessor;               // Payment processor to use
  processor_payment_method_id: string;       // ID of this payment method in the processor's system
  processor_data?: object;                   // Additional processor-specific data
  nickname?: string;                         // User-defined nickname for this payment method
  is_default?: boolean;                      // Whether this is the default payment method
  billing_details?: object;                  // Billing address and contact information
}

/**
 * Interface for payment method update parameters
 */
export interface PaymentMethodUpdateParams {
  nickname?: string;                         // Updated nickname
  is_default?: boolean;                      // Updated default status
  status?: PaymentMethodStatus;              // Updated payment method status
  billing_details?: object;                  // Updated billing details
  processor_data?: object;                   // Updated processor-specific data
}

/**
 * Interface for payment method response data with sensitive information removed
 */
export interface PaymentMethodResponse {
  payment_method_id: string;                 // Unique identifier for the payment method
  owner_type: IntegrationOwnerType;          // Type of entity that owns this payment method
  owner_id: string;                          // ID of the entity that owns this payment method
  method_type: PaymentMethodType;            // Type of payment method
  processor: PaymentProcessor;               // Payment processor used for this method
  nickname: string;                          // User-defined nickname for this payment method
  is_default: boolean;                       // Whether this is the default payment method
  status: PaymentMethodStatus;               // Current status of the payment method
  last_four: string;                         // Last four digits of card or account number
  expiration_month?: number;                 // Expiration month (for cards)
  expiration_year?: number;                  // Expiration year (for cards)
  card_brand?: string;                       // Card brand (for cards, e.g., Visa, Mastercard)
  bank_name?: string;                        // Bank name (for bank accounts)
  account_type?: string;                     // Account type (for bank accounts, e.g., checking, savings)
  billing_details?: object;                  // Billing address and contact information
  created_at: Date;                          // Timestamp when the payment method was created
  updated_at: Date;                          // Timestamp when the payment method was last updated
}

/**
 * Interface for tokenization request parameters
 */
export interface TokenizationRequest {
  owner_type: IntegrationOwnerType;          // Type of entity that will own this payment method
  owner_id: string;                          // ID of the entity that will own this payment method
  processor: PaymentProcessor;               // Payment processor to use for tokenization
  method_type: PaymentMethodType;            // Type of payment method to tokenize
  return_url: string;                        // URL to return to after tokenization is complete
  metadata?: object;                         // Additional metadata for the tokenization request
}

/**
 * Interface for tokenization response data
 */
export interface TokenizationResponse {
  session_id: string;                        // Unique identifier for the tokenization session
  client_secret: string;                     // Client secret for use with the processor's client SDK
  processor: PaymentProcessor;               // Payment processor used for tokenization
  expires_at: Date;                          // Expiration time for the tokenization session
}

/**
 * Interface for payment method verification request
 */
export interface PaymentMethodVerificationRequest {
  payment_method_id: string;                 // ID of the payment method to verify
  verification_data: object;                 // Data needed for verification (e.g., micro-deposit amounts)
}