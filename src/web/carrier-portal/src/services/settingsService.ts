import axios from 'axios';
import apiClient from '../../../common/api/apiClient';
import { UserProfile, UserUpdateParams } from '../../../common/interfaces/user.interface';
import { Carrier, CarrierUpdateParams } from '../../../common/interfaces/carrier.interface';
import { handleApiError } from '../../../common/utils/errorHandlers';
import logger from '../../../common/utils/logger';

/**
 * Interface defining notification settings structure with channel-specific preferences
 */
export interface NotificationSettings {
  email: {
    loadStatusUpdates: boolean;
    newLoadOpportunities: boolean;
    assignmentConfirmations: boolean;
    paymentNotifications: boolean;
    systemAlerts: boolean;
    marketingCommunications: boolean;
  };
  sms: {
    loadStatusUpdates: boolean;
    newLoadOpportunities: boolean;
    assignmentConfirmations: boolean;
    systemAlerts: boolean;
  };
  push: {
    loadStatusUpdates: boolean;
    newLoadOpportunities: boolean;
    assignmentConfirmations: boolean;
    systemAlerts: boolean;
  };
}

/**
 * Interface for password change request data
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Retrieves the user profile information for the current user
 * @returns User profile data
 */
const getUserProfile = async (): Promise<UserProfile> => {
  try {
    logger.info('Fetching user profile');
    const response = await apiClient.get('/api/v1/auth/me');
    logger.info('User profile retrieved successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to retrieve user profile', { error: apiError });
    throw apiError;
  }
};

/**
 * Updates the user profile information for the current user
 * @param profileData Updated profile information
 * @returns Updated user profile data
 */
const updateUserProfile = async (profileData: UserUpdateParams): Promise<UserProfile> => {
  try {
    logger.info('Updating user profile');
    const response = await apiClient.put('/api/v1/auth/me', profileData);
    logger.info('User profile updated successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to update user profile', { error: apiError });
    throw apiError;
  }
};

/**
 * Uploads a new profile image for the current user
 * @param imageFile The image file to upload
 * @returns URL of the uploaded image
 */
const uploadProfileImage = async (imageFile: File): Promise<{ imageUrl: string }> => {
  try {
    logger.info('Uploading profile image');
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    
    const response = await apiClient.post('/api/v1/auth/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    logger.info('Profile image uploaded successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to upload profile image', { error: apiError });
    throw apiError;
  }
};

/**
 * Retrieves the company settings for the current carrier
 * @returns Carrier company data
 */
const getCompanySettings = async (): Promise<Carrier> => {
  try {
    logger.info('Fetching company settings');
    const response = await apiClient.get('/api/v1/carriers/current');
    logger.info('Company settings retrieved successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to retrieve company settings', { error: apiError });
    throw apiError;
  }
};

/**
 * Updates the company settings for the current carrier
 * @param companyData Updated company information
 * @returns Updated carrier company data
 */
const updateCompanySettings = async (companyData: CarrierUpdateParams): Promise<Carrier> => {
  try {
    logger.info('Updating company settings');
    const response = await apiClient.put('/api/v1/carriers/current', companyData);
    logger.info('Company settings updated successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to update company settings', { error: apiError });
    throw apiError;
  }
};

/**
 * Uploads a new logo for the carrier company
 * @param logoFile The logo file to upload
 * @returns URL of the uploaded logo
 */
const uploadCompanyLogo = async (logoFile: File): Promise<{ logoUrl: string }> => {
  try {
    logger.info('Uploading company logo');
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await apiClient.post('/api/v1/carriers/current/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    logger.info('Company logo uploaded successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to upload company logo', { error: apiError });
    throw apiError;
  }
};

/**
 * Retrieves the notification settings for the current user
 * @returns User's notification preferences
 */
const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    logger.info('Fetching notification settings');
    const response = await apiClient.get('/api/v1/notifications/preferences');
    logger.info('Notification settings retrieved successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to retrieve notification settings', { error: apiError });
    throw apiError;
  }
};

/**
 * Updates the notification settings for the current user
 * @param settings Updated notification preferences
 * @returns Updated notification settings
 */
const updateNotificationSettings = async (settings: NotificationSettings): Promise<NotificationSettings> => {
  try {
    logger.info('Updating notification settings');
    const response = await apiClient.put('/api/v1/notifications/preferences', settings);
    logger.info('Notification settings updated successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to update notification settings', { error: apiError });
    throw apiError;
  }
};

/**
 * Changes the password for the current user
 * @param passwordData Current and new password information
 * @returns Success status of the password change
 */
const changePassword = async (passwordData: PasswordChangeRequest): Promise<{ success: boolean }> => {
  try {
    logger.info('Changing password');
    const response = await apiClient.post('/api/v1/auth/change-password', passwordData);
    logger.info('Password changed successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to change password', { error: apiError });
    throw apiError;
  }
};

/**
 * Initiates the setup process for multi-factor authentication
 * @returns MFA setup information including secret and QR code URL
 */
const setupMfa = async (): Promise<{ secret: string, qrCodeUrl: string }> => {
  try {
    logger.info('Setting up MFA');
    const response = await apiClient.post('/api/v1/auth/mfa/setup');
    logger.info('MFA setup initiated successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to setup MFA', { error: apiError });
    throw apiError;
  }
};

/**
 * Verifies the MFA code during setup or login
 * @param code MFA verification code
 * @returns Success status of the MFA verification
 */
const verifyMfa = async (code: string): Promise<{ success: boolean }> => {
  try {
    logger.info('Verifying MFA code');
    const response = await apiClient.post('/api/v1/auth/mfa/verify', { code });
    logger.info('MFA code verified successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to verify MFA code', { error: apiError });
    throw apiError;
  }
};

/**
 * Disables multi-factor authentication for the current user
 * @returns Success status of the MFA disabling
 */
const disableMfa = async (): Promise<{ success: boolean }> => {
  try {
    logger.info('Disabling MFA');
    const response = await apiClient.post('/api/v1/auth/mfa/disable');
    logger.info('MFA disabled successfully');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error as axios.AxiosError);
    logger.error('Failed to disable MFA', { error: apiError });
    throw apiError;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  getNotificationSettings,
  updateNotificationSettings,
  changePassword,
  setupMfa,
  verifyMfa,
  disableMfa
};