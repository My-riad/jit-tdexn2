import { combineReducers } from 'redux'; // redux ^4.2.0
import authReducer from './authReducer';
import loadReducer, { LoadState } from './loadReducer';
import profileReducer, { ProfileState } from './profileReducer';
import mapReducer, { MapState } from './mapReducer';
import earningsReducer, { EarningsState } from './earningsReducer';
import notificationReducer, { NotificationState } from './notificationReducer';
import { AuthState } from '../../../common/interfaces/auth.interface';

/**
 * @interface RootState
 * @description Interface defining the structure of the root state in the Redux store
 * @export_type named
 * @members_exposed auth, load, profile, map, earnings, notification
 */
export interface RootState {
  /**
   * @member auth
   * @member_type AuthState
   * @export_type named
   * @description Authentication state
   */
  auth: AuthState;
  /**
   * @member load
   * @member_type LoadState
   * @export_type named
   * @description Load-related state
   */
  load: LoadState;
  /**
   * @member profile
   * @member_type ProfileState
   * @export_type named
   * @description Driver profile state
   */
  profile: ProfileState;
  /**
   * @member map
   * @member_type MapState
   * @export_type named
   * @description Map-related state
   */
  map: MapState;
  /**
   * @member earnings
   * @member_type EarningsState
   * @export_type named
   * @description Earnings-related state
   */
  earnings: EarningsState;
  /**
   * @member notification
   * @member_type NotificationState
   * @export_type named
   * @description Notification-related state
   */
  notification: NotificationState;
}

/**
 * @function rootReducer
 * @description Combines all reducers into a single root reducer for the Redux store
 * @param {object} reducers - An object containing all the reducers to be combined
 * @returns {object} The combined root reducer
 * @export_type default
 */
const rootReducer = combineReducers<RootState>({
  auth: authReducer,
  load: loadReducer,
  profile: profileReducer,
  map: mapReducer,
  earnings: earningsReducer,
  notification: notificationReducer,
});

export default rootReducer;