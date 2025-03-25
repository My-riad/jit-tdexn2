import { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { 
  LoadStatus, 
  LoadRecommendation, 
  LoadWithDetails 
} from '../../../common/interfaces/load.interface';

/**
 * Root stack navigator parameter list
 */
export interface RootStackParamList {
  Auth: undefined;
  Main: undefined;
}

/**
 * Authentication stack navigator parameter list
 */
export interface AuthStackParamList {
  Login: undefined;
  Registration: undefined;
  ForgotPassword: undefined;
}

/**
 * Main tab navigator parameter list
 */
export interface MainTabParamList {
  Home: undefined;
  Loads: undefined;
  Map: undefined;
  Earnings: undefined;
  Profile: undefined;
}

/**
 * Load stack navigator parameter list
 */
export interface LoadStackParamList {
  LoadList: undefined;
  LoadDetail: { loadId: string; recommendation?: LoadRecommendation };
  ActiveLoad: { loadId: string };
  LoadSearch: undefined;
  StatusUpdate: { loadId: string; currentStatus: LoadStatus };
  SmartHub: { hubId: string; loadId?: string };
}

/**
 * Profile stack navigator parameter list
 */
export interface ProfileStackParamList {
  ProfileMain: undefined;
  Notifications: undefined;
  Settings: undefined;
  Leaderboard: { timeframe?: 'weekly' | 'monthly' | 'allTime'; region?: string };
  Achievements: undefined;
}

/**
 * Type definition for the root stack navigator's navigation prop
 */
export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Type definition for the authentication stack navigator's navigation prop
 */
export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;

/**
 * Type definition for the main tab navigator's navigation prop
 */
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

/**
 * Type definition for the load stack navigator's navigation prop,
 * composed with the main tab navigator to allow navigation to tab screens
 */
export type LoadNavigationProp = CompositeNavigationProp<
  StackNavigationProp<LoadStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

/**
 * Type definition for the profile stack navigator's navigation prop,
 * composed with the main tab navigator to allow navigation to tab screens
 */
export type ProfileNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

/**
 * Type definition for the authentication stack navigator's route prop
 */
export type AuthRouteProp = RouteProp<AuthStackParamList, keyof AuthStackParamList>;

/**
 * Type definition for the load stack navigator's route prop
 */
export type LoadRouteProp = RouteProp<LoadStackParamList, keyof LoadStackParamList>;

/**
 * Type definition for the profile stack navigator's route prop
 */
export type ProfileRouteProp = RouteProp<ProfileStackParamList, keyof ProfileStackParamList>;