import { ThunkAction, Action, AnyAction } from 'redux'; // ^4.2.1
import { ThunkDispatch } from 'redux-thunk'; // ^2.4.2
import { 
  Driver, 
  DriverPreference, 
  DriverUpdateParams 
} from '../../../common/interfaces/driver.interface';
import driverApi from '../../../common/api/driverApi';

// Define action types as an enum for type safety and autocomplete
export enum ProfileActionTypes {
  FETCH_PROFILE_REQUEST = 'profile/FETCH_PROFILE_REQUEST',
  FETCH_PROFILE_SUCCESS = 'profile/FETCH_PROFILE_SUCCESS',
  FETCH_PROFILE_FAILURE = 'profile/FETCH_PROFILE_FAILURE',
  
  FETCH_PREFERENCES_REQUEST = 'profile/FETCH_PREFERENCES_REQUEST',
  FETCH_PREFERENCES_SUCCESS = 'profile/FETCH_PREFERENCES_SUCCESS',
  FETCH_PREFERENCES_FAILURE = 'profile/FETCH_PREFERENCES_FAILURE',
  
  UPDATE_PROFILE_REQUEST = 'profile/UPDATE_PROFILE_REQUEST',
  UPDATE_PROFILE_SUCCESS = 'profile/UPDATE_PROFILE_SUCCESS',
  UPDATE_PROFILE_FAILURE = 'profile/UPDATE_PROFILE_FAILURE',
  
  UPDATE_PREFERENCE_REQUEST = 'profile/UPDATE_PREFERENCE_REQUEST',
  UPDATE_PREFERENCE_SUCCESS = 'profile/UPDATE_PREFERENCE_SUCCESS',
  UPDATE_PREFERENCE_FAILURE = 'profile/UPDATE_PREFERENCE_FAILURE',
  
  DELETE_PREFERENCE_REQUEST = 'profile/DELETE_PREFERENCE_REQUEST',
  DELETE_PREFERENCE_SUCCESS = 'profile/DELETE_PREFERENCE_SUCCESS',
  DELETE_PREFERENCE_FAILURE = 'profile/DELETE_PREFERENCE_FAILURE',
  
  UPDATE_AVATAR_REQUEST = 'profile/UPDATE_AVATAR_REQUEST',
  UPDATE_AVATAR_SUCCESS = 'profile/UPDATE_AVATAR_SUCCESS',
  UPDATE_AVATAR_FAILURE = 'profile/UPDATE_AVATAR_FAILURE',
  
  UPDATE_NOTIFICATION_SETTINGS_REQUEST = 'profile/UPDATE_NOTIFICATION_SETTINGS_REQUEST',
  UPDATE_NOTIFICATION_SETTINGS_SUCCESS = 'profile/UPDATE_NOTIFICATION_SETTINGS_SUCCESS',
  UPDATE_NOTIFICATION_SETTINGS_FAILURE = 'profile/UPDATE_NOTIFICATION_SETTINGS_FAILURE',
}

// Union type of all possible profile actions
export type ProfileAction = Action<ProfileActionTypes> & {
  payload?: any;
  error?: string;
};

// Define types for Redux state and dispatch
export type RootState = {
  profile: {
    driver: Driver | null;
    preferences: DriverPreference[];
    loading: boolean;
    error: string | null;
  };
  // Other state slices would be defined here
};

export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>;

/**
 * Fetches the driver's profile data
 * @param driverId The ID of the driver
 */
export const fetchProfile = (
  driverId: string
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.FETCH_PROFILE_REQUEST });
      const driver = await driverApi.getDriverById(driverId);
      dispatch({
        type: ProfileActionTypes.FETCH_PROFILE_SUCCESS,
        payload: driver
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.FETCH_PROFILE_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Fetches the driver's preferences
 * @param driverId The ID of the driver
 */
export const fetchPreferences = (
  driverId: string
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.FETCH_PREFERENCES_REQUEST });
      const preferences = await driverApi.getDriverPreferences(driverId);
      dispatch({
        type: ProfileActionTypes.FETCH_PREFERENCES_SUCCESS,
        payload: preferences
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.FETCH_PREFERENCES_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Updates the driver's profile information
 * @param driverId The ID of the driver
 * @param profileData The updated profile data
 */
export const updateProfile = (
  driverId: string,
  profileData: DriverUpdateParams
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.UPDATE_PROFILE_REQUEST });
      const updatedDriver = await driverApi.updateDriver(driverId, profileData);
      dispatch({
        type: ProfileActionTypes.UPDATE_PROFILE_SUCCESS,
        payload: updatedDriver
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.UPDATE_PROFILE_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Updates or creates a driver preference
 * @param driverId The ID of the driver
 * @param preference The preference to update or create
 */
export const updatePreference = (
  driverId: string,
  preference: DriverPreference
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.UPDATE_PREFERENCE_REQUEST });
      const updatedPreference = await driverApi.updateDriverPreference(driverId, preference);
      dispatch({
        type: ProfileActionTypes.UPDATE_PREFERENCE_SUCCESS,
        payload: updatedPreference
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.UPDATE_PREFERENCE_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Deletes a driver preference
 * @param driverId The ID of the driver
 * @param preferenceId The ID of the preference to delete
 */
export const deletePreference = (
  driverId: string,
  preferenceId: string
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.DELETE_PREFERENCE_REQUEST });
      await driverApi.deleteDriverPreference(driverId, preferenceId);
      dispatch({
        type: ProfileActionTypes.DELETE_PREFERENCE_SUCCESS,
        payload: preferenceId
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.DELETE_PREFERENCE_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Updates the driver's profile avatar
 * @param driverId The ID of the driver
 * @param avatarFile The new avatar file
 */
export const updateAvatar = (
  driverId: string,
  avatarFile: File
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.UPDATE_AVATAR_REQUEST });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      // TODO: Replace with actual API call when avatar upload endpoint is available
      // This is a placeholder implementation
      
      // Simulate API call with fetch
      let avatarUrl: string;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/v1/drivers/${driverId}/avatar`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload avatar');
        }
        
        const data = await response.json();
        avatarUrl = data.avatarUrl;
      } catch (uploadError) {
        // Fallback for development until API is available
        console.warn('Avatar upload API not implemented yet, simulating response');
        avatarUrl = `https://api.freightoptimization.com/avatars/${driverId}.jpg?t=${Date.now()}`;
      }
      
      dispatch({
        type: ProfileActionTypes.UPDATE_AVATAR_SUCCESS,
        payload: avatarUrl
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.UPDATE_AVATAR_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Updates the driver's notification settings
 * @param driverId The ID of the driver
 * @param notificationSettings The updated notification settings
 */
export const updateNotificationSettings = (
  driverId: string,
  notificationSettings: {
    sms: boolean;
    email: boolean;
    push: boolean;
    [key: string]: any;
  }
): ThunkAction<void, RootState, unknown, Action<string>> => {
  return async (dispatch: AppDispatch) => {
    try {
      dispatch({ type: ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_REQUEST });
      
      // TODO: Replace with actual API call when notification settings endpoint is available
      // This is a placeholder implementation
      
      // In a real implementation, this would likely be a dedicated API endpoint
      // For now, we'll simulate a successful update
      const updatedSettings = { ...notificationSettings };
      
      dispatch({
        type: ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_SUCCESS,
        payload: updatedSettings
      });
    } catch (error) {
      dispatch({
        type: ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_FAILURE,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};