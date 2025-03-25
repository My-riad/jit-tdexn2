import { Request, Response, NextFunction } from 'express'; // express@^4.18.2
import {
  createUserService,
  getUserByIdService,
  getUserByEmailService,
  updateUserService,
  deleteUserService,
  changePasswordService,
  requestPasswordResetService,
  resetPasswordService,
  verifyEmailService,
  resendVerificationEmailService,
  getUserProfileService,
  searchUsersService,
  addRolesToUserService,
  removeRolesFromUserService,
  setupMfaService,
  verifyMfaSetupService,
  disableMfaService,
} from '../services/user.service';
import {
  UserCreationParams,
  UserUpdateParams,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmation,
  MfaSetupRequest,
  MfaSetupVerification,
  MfaDisableRequest,
} from '../../../common/interfaces/user.interface';
import { createError } from '../../../common/utils/error-handler';
import logger from '../../../common/utils/logger';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { StatusCodes } from '../../../common/constants/status-codes';

/**
 * Validates a user ID format
 * @param userId 
 * @returns True if the user ID is valid, false otherwise
 */
const validateUserId = (userId: string): boolean => {
  // Basic check for non-empty string
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  // Add more sophisticated validation if needed (e.g., UUID format)
  return true;
};

/**
 * Creates a new user with the provided data
 * @param req 
 * @param res 
 * @param next 
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user data from request body
    const userData: UserCreationParams = req.body;

    // Call createUserService to create the user
    const userId = await createUserService(userData);

    // Return success response with the created user ID
    res.status(StatusCodes.CREATED).json({
      message: 'User created successfully',
      userId: userId,
    });
  } catch (error) {
    // Log the error
    logger.error('Error creating user', { error });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves a user by their ID
 * @param req 
 * @param res 
 * @param next 
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Call getUserByIdService to retrieve the user
    const user = await getUserByIdService(userId);

    // Return the user profile in the response
    res.status(StatusCodes.OK).json({
      message: 'User retrieved successfully',
      user: user,
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting user by ID', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves a user by their email address
 * @param req 
 * @param res 
 * @param next 
 */
export const getUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract email from request query parameters
    const email = req.query.email as string;

    // Call getUserByEmailService to retrieve the user
    const user = await getUserByEmailService(email);

    // Return the user profile in the response
    res.status(StatusCodes.OK).json({
      message: 'User retrieved successfully',
      user: user,
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting user by email', { error, email: req.query.email });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Updates an existing user with the provided data
 * @param req 
 * @param res 
 * @param next 
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Extract user data from request body
    const userData: UserUpdateParams = req.body;

    // Call updateUserService to update the user
    const success = await updateUserService(userId, userData);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'User updated successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error updating user', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Deletes a user by their ID
 * @param req 
 * @param res 
 * @param next 
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Call deleteUserService to delete the user
    const success = await deleteUserService(userId);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'User deleted successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error deleting user', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Changes a user's password
 * @param req 
 * @param res 
 * @param next 
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Extract password data from request body
    const passwordData: PasswordChangeRequest = req.body;

    // Call changePasswordService to change the password
    const success = await changePasswordService(userId, passwordData);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Password changed successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error changing password', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Initiates a password reset process
 * @param req 
 * @param res 
 * @param next 
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract email from request body
    const { email }: PasswordResetRequest = req.body;

    // Call requestPasswordResetService to initiate the reset
    await requestPasswordResetService(email);

    // Return success response (even if email not found for security)
    res.status(StatusCodes.OK).json({
      message: 'Password reset requested successfully. Check your email for instructions.',
    });
  } catch (error) {
    // Log the error
    logger.error('Error requesting password reset', { error, email: req.body.email });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Resets a user's password using a reset token
 * @param req 
 * @param res 
 * @param next 
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract reset data from request body (token, newPassword, confirmPassword)
    const resetData: PasswordResetConfirmation = req.body;

    // Call resetPasswordService to reset the password
    const success = await resetPasswordService(resetData.token, resetData.newPassword);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Password reset successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error resetting password', { error });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Verifies a user's email using a verification token
 * @param req 
 * @param res 
 * @param next 
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract verification token from request query parameters
    const token = req.query.token as string;

    // Call verifyEmailService to verify the email
    const success = await verifyEmailService(token);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Email verified successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error verifying email', { error, token: req.query.token });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Resends a verification email to a user
 * @param req 
 * @param res 
 * @param next 
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Call resendVerificationEmailService to resend the email
    await resendVerificationEmailService(userId);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Verification email resent successfully',
    });
  } catch (error) {
    // Log the error
    logger.error('Error resending verification email', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Retrieves a user's public profile
 * @param req 
 * @param res 
 * @param next 
 */
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Call getUserProfileService to retrieve the profile
    const userProfile = await getUserProfileService(userId);

    // Return the user profile in the response
    res.status(StatusCodes.OK).json({
      message: 'User profile retrieved successfully',
      userProfile: userProfile,
    });
  } catch (error) {
    // Log the error
    logger.error('Error getting user profile', { error, userId: req.params.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Searches for users based on criteria with pagination
 * @param req 
 * @param res 
 * @param next 
 */
export const searchUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract search criteria from request query
    const searchCriteria = req.query;

    // Extract pagination parameters (page, limit) from request query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Call searchUsersService with criteria and pagination
    const results = await searchUsersService(searchCriteria, page, limit);

    // Return paginated search results in the response
    res.status(StatusCodes.OK).json({
      message: 'Users retrieved successfully',
      ...results,
    });
  } catch (error) {
    // Log the error
    logger.error('Error searching users', { error, searchCriteria: req.query });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Adds roles to an existing user
 * @param req 
 * @param res 
 * @param next 
 */
export const addRolesToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Extract role IDs from request body
    const { roleIds } = req.body;

    // Call addRolesToUserService to add roles
    const success = await addRolesToUserService(userId, roleIds);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Roles added to user successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error adding roles to user', { error, userId: req.params.userId, roleIds: req.body.roleIds });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Removes roles from an existing user
 * @param req 
 * @param res 
 * @param next 
 */
export const removeRolesFromUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.userId;

    // Extract role IDs from request body
    const { roleIds } = req.body;

    // Call removeRolesFromUserService to remove roles
    const success = await removeRolesFromUserService(userId, roleIds);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'Roles removed from user successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error removing roles from user', { error, userId: req.params.userId, roleIds: req.body.roleIds });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Sets up multi-factor authentication for a user
 * @param req 
 * @param res 
 * @param next 
 */
export const setupMfa = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract setup request data from request body
    const setupRequest: MfaSetupRequest = req.body;

    // Call setupMfaService to generate MFA setup information
    const mfaInfo = await setupMfaService(setupRequest.userId);

    // Return MFA setup information in the response
    res.status(StatusCodes.OK).json({
      message: 'MFA setup information generated successfully',
      ...mfaInfo,
    });
  } catch (error) {
    // Log the error
    logger.error('Error setting up MFA', { error, userId: req.body.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Verifies and enables MFA for a user
 * @param req 
 * @param res 
 * @param next 
 */
export const verifyMfaSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract verification data from request body
    const verificationData: MfaSetupVerification = req.body;

    // Call verifyMfaSetupService to verify and enable MFA
    const success = await verifyMfaSetupService(verificationData);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'MFA verified and enabled successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error verifying MFA setup', { error, userId: req.body.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};

/**
 * Disables MFA for a user
 * @param req 
 * @param res 
 * @param next 
 */
export const disableMfa = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract disable request data from request body
    const disableRequest: MfaDisableRequest = req.body;

    // Call disableMfaService to disable MFA
    const success = await disableMfaService(disableRequest);

    // Return success response
    res.status(StatusCodes.OK).json({
      message: 'MFA disabled successfully',
      success: success,
    });
  } catch (error) {
    // Log the error
    logger.error('Error disabling MFA', { error, userId: req.body.userId });
    // Forward any errors to the error handling middleware
    next(error);
  }
};