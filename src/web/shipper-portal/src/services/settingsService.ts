/**
 * A service module that provides functions for managing shipper settings in the AI-driven Freight Optimization Platform.
 * It handles company information, user management, notification preferences, integration settings, and API key management.
 */

import axios from 'axios'; // ^1.4.0
import apiClient from '../../../common/api/apiClient';
import { Shipper, ShipperUpdateParams } from '../../../common/interfaces/shipper.interface';
import { User, UserSummary, UserType, UserStatus, UserInviteParams } from '../../../common/interfaces/user.interface';
import { NotificationPreference } from '../../../common/interfaces';
import { handleApiError } from '../../../common/utils/errorHandlers';

/**
 * Retrieves company settings for a shipper
 * @param shipperId 
 * @returns Promise resolving to shipper company data
 */
const getCompanySettings = async (shipperId: string): Promise<Shipper> => {
  try {
    // LD1: Making a GET request to the shipper settings endpoint
    const response = await apiClient.get<Shipper>(`/api/v1/shippers/${shipperId}`);
    // LD1: Returning the shipper data from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Updates company settings for a shipper
 * @param shipperId 
 * @param updateParams 
 * @returns Promise resolving to updated shipper company data
 */
const updateCompanySettings = async (shipperId: string, updateParams: ShipperUpdateParams): Promise<Shipper> => {
  try {
    // LD1: Making a PUT request to the shipper settings endpoint with update parameters
    const response = await apiClient.put<Shipper>(`/api/v1/shippers/${shipperId}`, updateParams);
    // LD1: Returning the updated shipper data from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Uploads a new company logo for a shipper
 * @param shipperId 
 * @param logoFile 
 * @returns Promise resolving to object with the new logo URL
 */
const uploadCompanyLogo = async (shipperId: string, logoFile: File): Promise<{ logoUrl: string }> => {
  try {
    // LD1: Creating a FormData object and appending the logo file
    const formData = new FormData();
    formData.append('logo', logoFile);

    // LD1: Making a POST request to the logo upload endpoint with the FormData
    const response = await apiClient.post<{ logoUrl: string }>(`/api/v1/shippers/${shipperId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // LD1: Returning the logo URL from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Retrieves a list of users for a shipper organization
 * @param shipperId 
 * @param queryParams 
 * @returns Promise resolving to object with users array and total count
 */
const getUserList = async (shipperId: string, queryParams: any): Promise<{ users: UserSummary[], total: number }> => {
  try {
    // LD1: Making a GET request to the users endpoint with query parameters
    const response = await apiClient.get<{ users: UserSummary[], total: number }>(`/api/v1/shippers/${shipperId}/users`, { params: queryParams });
    // LD1: Returning the users data and total count from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Invites a new user to the shipper organization
 * @param shipperId 
 * @param inviteParams 
 * @returns Promise resolving to success status and message
 */
const inviteUser = async (shipperId: string, inviteParams: UserInviteParams): Promise<{ success: boolean, message: string }> => {
  try {
    // LD1: Making a POST request to the user invite endpoint with invite parameters
    const response = await apiClient.post<{ success: boolean, message: string }>(`/api/v1/shippers/${shipperId}/users/invite`, inviteParams);
    // LD1: Returning the success status and message from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Updates a user's role within the shipper organization
 * @param userId 
 * @param roleId 
 * @returns Promise resolving to success status
 */
const updateUserRole = async (userId: string, roleId: string): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the user role endpoint with role ID
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/users/${userId}/role`, { roleId });
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Deactivates a user account in the shipper organization
 * @param userId 
 * @returns Promise resolving to success status
 */
const deactivateUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the user deactivation endpoint
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/users/${userId}/deactivate`);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Reactivates a deactivated user account in the shipper organization
 * @param userId 
 * @returns Promise resolving to success status
 */
const reactivateUser = async (userId: string): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the user reactivation endpoint
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/users/${userId}/reactivate`);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Retrieves notification preferences for a user
 * @param userId 
 * @returns Promise resolving to array of notification preferences
 */
const getNotificationPreferences = async (userId: string): Promise<NotificationPreference[]> => {
  try {
    // LD1: Making a GET request to the notification preferences endpoint
    const response = await apiClient.get<NotificationPreference[]>(`/api/v1/notifications/preferences/${userId}`);
    // LD1: Returning the notification preferences from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Updates notification preferences for a user
 * @param userId 
 * @param preferences 
 * @returns Promise resolving to success status
 */
const updateNotificationPreferences = async (userId: string, preferences: NotificationPreference[]): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the notification preferences endpoint with updated preferences
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/notifications/preferences/${userId}`, preferences);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Retrieves integration settings for a shipper
 * @param shipperId 
 * @returns Promise resolving to integration settings
 */
const getIntegrationSettings = async (shipperId: string): Promise<{ tmsEnabled: boolean, paymentEnabled: boolean, apiEnabled: boolean }> => {
  try {
    // LD1: Making a GET request to the integration settings endpoint
    const response = await apiClient.get<{ tmsEnabled: boolean, paymentEnabled: boolean, apiEnabled: boolean }>(`/api/v1/shippers/${shipperId}/integrations`);
    // LD1: Returning the integration settings from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Updates integration settings for a shipper
 * @param shipperId 
 * @param settings 
 * @returns Promise resolving to success status
 */
const updateIntegrationSettings = async (shipperId: string, settings: any): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the integration settings endpoint with updated settings
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/shippers/${shipperId}/integrations`, settings);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Retrieves TMS connections for a shipper
 * @param shipperId 
 * @returns Promise resolving to array of TMS connections
 */
const getTmsConnections = async (shipperId: string): Promise<any[]> => {
    try {
        // LD1: Making a GET request to the TMS connections endpoint
        const response = await apiClient.get<any[]>(`/api/v1/shippers/${shipperId}/tms-connections`);
        // LD1: Returning the TMS connections from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Creates a new TMS connection for a shipper
 * @param shipperId 
 * @param connectionParams 
 * @returns Promise resolving to the created TMS connection
 */
const createTmsConnection = async (shipperId: string, connectionParams: any): Promise<any> => {
    try {
        // LD1: Making a POST request to the TMS connections endpoint with connection parameters
        const response = await apiClient.post<any>(`/api/v1/shippers/${shipperId}/tms-connections`, connectionParams);
        // LD1: Returning the created TMS connection from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Deletes a TMS connection for a shipper
 * @param connectionId 
 * @returns Promise resolving to success status
 */
const deleteTmsConnection = async (connectionId: string): Promise<{ success: boolean }> => {
    try {
        // LD1: Making a DELETE request to the TMS connection endpoint
        const response = await apiClient.delete<{ success: boolean }>(`/api/v1/tms-connections/${connectionId}`);
        // LD1: Returning the success status from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Retrieves payment methods for a shipper
 * @param shipperId 
 * @returns Promise resolving to array of payment methods
 */
const getPaymentMethods = async (shipperId: string): Promise<any[]> => {
    try {
        // LD1: Making a GET request to the payment methods endpoint
        const response = await apiClient.get<any[]>(`/api/v1/shippers/${shipperId}/payment-methods`);
        // LD1: Returning the payment methods from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Creates a new payment method for a shipper
 * @param shipperId 
 * @param paymentMethodParams 
 * @returns Promise resolving to the created payment method
 */
const createPaymentMethod = async (shipperId: string, paymentMethodParams: any): Promise<any> => {
    try {
        // LD1: Making a POST request to the payment methods endpoint with payment method parameters
        const response = await apiClient.post<any>(`/api/v1/shippers/${shipperId}/payment-methods`, paymentMethodParams);
        // LD1: Returning the created payment method from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Deletes a payment method for a shipper
 * @param paymentMethodId 
 * @returns Promise resolving to success status
 */
const deletePaymentMethod = async (paymentMethodId: string): Promise<{ success: boolean }> => {
    try {
        // LD1: Making a DELETE request to the payment method endpoint
        const response = await apiClient.delete<{ success: boolean }>(`/api/v1/payment-methods/${paymentMethodId}`);
        // LD1: Returning the success status from the response
        return response.data;
    } catch (error: any) {
        // LD1: Handling any errors using the error handler utility
        throw handleApiError(error);
    }
};

/**
 * Retrieves API keys for a shipper
 * @param shipperId 
 * @returns Promise resolving to array of API keys
 */
const getApiKeys = async (shipperId: string): Promise<any[]> => {
  try {
    // LD1: Making a GET request to the API keys endpoint
    const response = await apiClient.get<any[]>(`/api/v1/shippers/${shipperId}/api-keys`);
    // LD1: Returning the API keys from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Creates a new API key for a shipper
 * @param shipperId 
 * @param apiKeyParams 
 * @returns Promise resolving to the created API key and its full value
 */
const createApiKey = async (shipperId: string, apiKeyParams: any): Promise<{ key: string, apiKey: any }> => {
  try {
    // LD1: Making a POST request to the API keys endpoint with API key parameters
    const response = await apiClient.post<{ key: string, apiKey: any }>(`/api/v1/shippers/${shipperId}/api-keys`, apiKeyParams);
    // LD1: Returning the created API key and its full value from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Revokes an API key for a shipper
 * @param keyId 
 * @returns Promise resolving to success status
 */
const revokeApiKey = async (keyId: string): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a DELETE request to the API key endpoint
    const response = await apiClient.delete<{ success: boolean }>(`/api/v1/api-keys/${keyId}`);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Retrieves webhook settings for a shipper
 * @param shipperId 
 * @returns Promise resolving to webhook settings
 */
const getWebhookSettings = async (shipperId: string): Promise<{ webhookUrl: string, webhookSecret: string, events: string[] }> => {
  try {
    // LD1: Making a GET request to the webhook settings endpoint
    const response = await apiClient.get<{ webhookUrl: string, webhookSecret: string, events: string[] }>(`/api/v1/shippers/${shipperId}/webhooks`);
    // LD1: Returning the webhook settings from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

/**
 * Updates webhook settings for a shipper
 * @param shipperId 
 * @param webhookSettings 
 * @returns Promise resolving to success status
 */
const updateWebhookSettings = async (shipperId: string, webhookSettings: any): Promise<{ success: boolean }> => {
  try {
    // LD1: Making a PUT request to the webhook settings endpoint with updated settings
    const response = await apiClient.put<{ success: boolean }>(`/api/v1/shippers/${shipperId}/webhooks`, webhookSettings);
    // LD1: Returning the success status from the response
    return response.data;
  } catch (error: any) {
    // LD1: Handling any errors using the error handler utility
    throw handleApiError(error);
  }
};

// LD3: Export all settings service functions as a single object
export default {
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  getUserList,
  inviteUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  getIntegrationSettings,
  updateIntegrationSettings,
  getTmsConnections,
  createTmsConnection,
  deleteTmsConnection,
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhookSettings,
  updateWebhookSettings,
};