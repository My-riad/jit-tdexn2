import { ProfileActionTypes, ProfileAction } from '../actions/profileActions';
import { Driver, DriverPreference } from '../../../common/interfaces/driver.interface';

/**
 * Interface defining the shape of the profile state in the Redux store
 */
export interface ProfileState {
  driver: Driver | null;
  preferences: DriverPreference[];
  loading: boolean;
  preferencesLoading: boolean;
  updating: boolean;
  preferenceUpdating: boolean;
  preferenceDeleting: boolean;
  avatarUploading: boolean;
  notificationSettingsUpdating: boolean;
  error: string | null;
  preferencesError: string | null;
  updateError: string | null;
  preferenceUpdateError: string | null;
  preferenceDeleteError: string | null;
  avatarUpdateError: string | null;
  notificationSettingsError: string | null;
}

/**
 * Initial state for the profile reducer
 */
export const initialState: ProfileState = {
  driver: null,
  preferences: [],
  loading: false,
  preferencesLoading: false,
  updating: false,
  preferenceUpdating: false,
  preferenceDeleting: false,
  avatarUploading: false,
  notificationSettingsUpdating: false,
  error: null,
  preferencesError: null,
  updateError: null,
  preferenceUpdateError: null,
  preferenceDeleteError: null,
  avatarUpdateError: null,
  notificationSettingsError: null
};

/**
 * Redux reducer function that handles profile-related actions and updates the profile state accordingly
 * 
 * @param state - Current profile state
 * @param action - Action dispatched to the reducer
 * @returns Updated profile state
 */
const profileReducer = (
  state: ProfileState = initialState,
  action: ProfileAction
): ProfileState => {
  switch (action.type) {
    // Fetch profile actions
    case ProfileActionTypes.FETCH_PROFILE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case ProfileActionTypes.FETCH_PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        driver: action.payload,
        error: null
      };
    case ProfileActionTypes.FETCH_PROFILE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.error || 'Failed to fetch profile'
      };
      
    // Fetch preferences actions
    case ProfileActionTypes.FETCH_PREFERENCES_REQUEST:
      return {
        ...state,
        preferencesLoading: true,
        preferencesError: null
      };
    case ProfileActionTypes.FETCH_PREFERENCES_SUCCESS:
      return {
        ...state,
        preferencesLoading: false,
        preferences: action.payload,
        preferencesError: null
      };
    case ProfileActionTypes.FETCH_PREFERENCES_FAILURE:
      return {
        ...state,
        preferencesLoading: false,
        preferencesError: action.error || 'Failed to fetch preferences'
      };
      
    // Update profile actions
    case ProfileActionTypes.UPDATE_PROFILE_REQUEST:
      return {
        ...state,
        updating: true,
        updateError: null
      };
    case ProfileActionTypes.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        updating: false,
        driver: action.payload,
        updateError: null
      };
    case ProfileActionTypes.UPDATE_PROFILE_FAILURE:
      return {
        ...state,
        updating: false,
        updateError: action.error || 'Failed to update profile'
      };
      
    // Update preference actions
    case ProfileActionTypes.UPDATE_PREFERENCE_REQUEST:
      return {
        ...state,
        preferenceUpdating: true,
        preferenceUpdateError: null
      };
    case ProfileActionTypes.UPDATE_PREFERENCE_SUCCESS:
      // Find if the preference already exists
      const preferenceIndex = state.preferences.findIndex(
        pref => pref.id === action.payload.id
      );
      
      // If found, update it; otherwise, add the new preference
      const updatedPreferences = preferenceIndex >= 0
        ? [
            ...state.preferences.slice(0, preferenceIndex),
            action.payload,
            ...state.preferences.slice(preferenceIndex + 1)
          ]
        : [...state.preferences, action.payload];
        
      return {
        ...state,
        preferenceUpdating: false,
        preferences: updatedPreferences,
        preferenceUpdateError: null
      };
    case ProfileActionTypes.UPDATE_PREFERENCE_FAILURE:
      return {
        ...state,
        preferenceUpdating: false,
        preferenceUpdateError: action.error || 'Failed to update preference'
      };
      
    // Delete preference actions
    case ProfileActionTypes.DELETE_PREFERENCE_REQUEST:
      return {
        ...state,
        preferenceDeleting: true,
        preferenceDeleteError: null
      };
    case ProfileActionTypes.DELETE_PREFERENCE_SUCCESS:
      return {
        ...state,
        preferenceDeleting: false,
        preferences: state.preferences.filter(
          pref => pref.id !== action.payload
        ),
        preferenceDeleteError: null
      };
    case ProfileActionTypes.DELETE_PREFERENCE_FAILURE:
      return {
        ...state,
        preferenceDeleting: false,
        preferenceDeleteError: action.error || 'Failed to delete preference'
      };
      
    // Update avatar actions
    case ProfileActionTypes.UPDATE_AVATAR_REQUEST:
      return {
        ...state,
        avatarUploading: true,
        avatarUpdateError: null
      };
    case ProfileActionTypes.UPDATE_AVATAR_SUCCESS:
      return {
        ...state,
        avatarUploading: false,
        driver: state.driver
          ? { ...state.driver, avatarUrl: action.payload }
          : null,
        avatarUpdateError: null
      };
    case ProfileActionTypes.UPDATE_AVATAR_FAILURE:
      return {
        ...state,
        avatarUploading: false,
        avatarUpdateError: action.error || 'Failed to update avatar'
      };
      
    // Update notification settings actions
    case ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_REQUEST:
      return {
        ...state,
        notificationSettingsUpdating: true,
        notificationSettingsError: null
      };
    case ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_SUCCESS:
      return {
        ...state,
        notificationSettingsUpdating: false,
        driver: state.driver
          ? {
              ...state.driver,
              notificationSettings: action.payload
            }
          : null,
        notificationSettingsError: null
      };
    case ProfileActionTypes.UPDATE_NOTIFICATION_SETTINGS_FAILURE:
      return {
        ...state,
        notificationSettingsUpdating: false,
        notificationSettingsError: action.error || 'Failed to update notification settings'
      };
      
    default:
      return state;
  }
};

export default profileReducer;