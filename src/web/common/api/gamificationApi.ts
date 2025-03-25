/**
 * API client module for gamification-related operations in the AI-driven Freight Optimization Platform.
 * Provides methods for interacting with driver scores, achievements, leaderboards, rewards, and bonus zones
 * to support the gamification features that incentivize drivers to make efficient decisions.
 */

import { AxiosResponse } from 'axios'; // ^1.4.0
import apiClient from './apiClient';
import { getEndpointWithParams, GAMIFICATION_ENDPOINTS } from '../constants/endpoints';
import {
  Achievement,
  DriverAchievement,
  AchievementProgress,
  DriverScore,
  ScoreHistory,
  Leaderboard,
  LeaderboardEntry,
  Reward,
  DriverReward,
  BonusZone,
  DriverBonus,
  LeaderboardType,
  LeaderboardTimeframe,
  RewardType,
  RewardStatus
} from '../interfaces/gamification.interface';

/**
 * Retrieves a driver's current efficiency score
 * @param driverId - ID of the driver
 * @returns Promise resolving to the driver's score data
 */
const getDriverScore = async (driverId: string): Promise<DriverScore> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.SCORES}/:driverId`, { driverId });
  const response: AxiosResponse<DriverScore> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves a driver's efficiency score history
 * @param driverId - ID of the driver
 * @param options - Optional parameters (timeframe, limit, etc.)
 * @returns Promise resolving to an array of historical score entries
 */
const getDriverScoreHistory = async (
  driverId: string, 
  options: { timeframe?: string; limit?: number; startDate?: string; endDate?: string } = {}
): Promise<ScoreHistory[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.SCORES}/:driverId/history`, { driverId });
  const response: AxiosResponse<ScoreHistory[]> = await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Calculates a driver's efficiency score for a completed load
 * @param driverId - ID of the driver
 * @param loadId - ID of the completed load
 * @param metrics - Object containing metrics for score calculation
 * @returns Promise resolving to the updated driver score
 */
const calculateScoreForLoad = async (
  driverId: string, 
  loadId: string, 
  metrics: {
    emptyMiles?: number;
    networkContribution?: number;
    onTimeDelivery?: boolean;
    hubUtilization?: boolean;
    fuelConsumption?: number;
    [key: string]: any;
  }
): Promise<DriverScore> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.SCORES}/:driverId/calculate`, { driverId });
  const response: AxiosResponse<DriverScore> = await apiClient.post(endpoint, {
    loadId,
    ...metrics
  });
  return response.data;
};

/**
 * Retrieves all achievements earned by a driver
 * @param driverId - ID of the driver
 * @returns Promise resolving to an array of driver achievements
 */
const getDriverAchievements = async (driverId: string): Promise<DriverAchievement[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.ACHIEVEMENTS}/drivers/:driverId`, { driverId });
  const response: AxiosResponse<DriverAchievement[]> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves a driver's progress toward earning achievements
 * @param driverId - ID of the driver
 * @returns Promise resolving to an array of achievement progress data
 */
const getAchievementProgress = async (driverId: string): Promise<AchievementProgress[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.ACHIEVEMENTS}/drivers/:driverId/progress`, { driverId });
  const response: AxiosResponse<AchievementProgress[]> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves all available achievements in the system
 * @returns Promise resolving to an array of all achievements
 */
const getAllAchievements = async (): Promise<Achievement[]> => {
  const response: AxiosResponse<Achievement[]> = await apiClient.get(GAMIFICATION_ENDPOINTS.ACHIEVEMENTS);
  return response.data;
};

/**
 * Retrieves all active leaderboards
 * @param options - Optional parameters for filtering leaderboards
 * @returns Promise resolving to an array of leaderboards
 */
const getLeaderboards = async (
  options: { 
    type?: LeaderboardType; 
    timeframe?: LeaderboardTimeframe; 
    region?: string; 
    isActive?: boolean 
  } = {}
): Promise<Leaderboard[]> => {
  const response: AxiosResponse<Leaderboard[]> = await apiClient.get(GAMIFICATION_ENDPOINTS.LEADERBOARDS, { params: options });
  return response.data;
};

/**
 * Retrieves leaderboards that are currently active
 * @param options - Optional parameters for filtering leaderboards
 * @returns Promise resolving to an array of current leaderboards
 */
const getCurrentLeaderboards = async (
  options: { 
    type?: LeaderboardType; 
    timeframe?: LeaderboardTimeframe; 
    region?: string; 
  } = {}
): Promise<Leaderboard[]> => {
  const endpoint = `${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/current`;
  const response: AxiosResponse<Leaderboard[]> = await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves a specific leaderboard by ID
 * @param leaderboardId - ID of the leaderboard
 * @returns Promise resolving to the leaderboard data
 */
const getLeaderboardById = async (leaderboardId: string): Promise<Leaderboard> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/:leaderboardId`, { leaderboardId });
  const response: AxiosResponse<Leaderboard> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves entries for a specific leaderboard
 * @param leaderboardId - ID of the leaderboard
 * @param options - Optional parameters for pagination
 * @returns Promise resolving to leaderboard entries with pagination info
 */
const getLeaderboardEntries = async (
  leaderboardId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ entries: LeaderboardEntry[]; total: number; page: number; limit: number; }> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/:leaderboardId/entries`, { leaderboardId });
  const response: AxiosResponse<{ entries: LeaderboardEntry[]; total: number; page: number; limit: number; }> = 
    await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves the top N entries for a specific leaderboard
 * @param leaderboardId - ID of the leaderboard
 * @param limit - Number of top entries to retrieve
 * @returns Promise resolving to an array of top leaderboard entries
 */
const getTopLeaderboardEntries = async (leaderboardId: string, limit: number = 10): Promise<LeaderboardEntry[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/:leaderboardId/top`, { leaderboardId });
  const response: AxiosResponse<LeaderboardEntry[]> = await apiClient.get(endpoint, { params: { limit } });
  return response.data;
};

/**
 * Retrieves a driver's entry in a specific leaderboard
 * @param leaderboardId - ID of the leaderboard
 * @param driverId - ID of the driver
 * @returns Promise resolving to the driver's leaderboard entry
 */
const getDriverLeaderboardEntry = async (leaderboardId: string, driverId: string): Promise<LeaderboardEntry> => {
  const endpoint = getEndpointWithParams(
    `${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/:leaderboardId/drivers/:driverId`, 
    { leaderboardId, driverId }
  );
  const response: AxiosResponse<LeaderboardEntry> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves all leaderboard entries for a specific driver
 * @param driverId - ID of the driver
 * @param options - Optional parameters for filtering entries
 * @returns Promise resolving to the driver's entries across leaderboards
 */
const getDriverLeaderboardEntries = async (
  driverId: string,
  options: { 
    type?: LeaderboardType; 
    timeframe?: LeaderboardTimeframe; 
    isActive?: boolean 
  } = {}
): Promise<{ entries: LeaderboardEntry[]; total: number; }> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.LEADERBOARDS}/drivers/:driverId`, { driverId });
  const response: AxiosResponse<{ entries: LeaderboardEntry[]; total: number; }> = 
    await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves all rewards for a specific driver
 * @param driverId - ID of the driver
 * @param options - Optional parameters for filtering rewards
 * @returns Promise resolving to an array of driver rewards
 */
const getDriverRewards = async (
  driverId: string,
  options: { 
    status?: RewardStatus; 
    type?: RewardType;
  } = {}
): Promise<DriverReward[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId`, { driverId });
  const response: AxiosResponse<DriverReward[]> = await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves all bonuses for a specific driver
 * @param driverId - ID of the driver
 * @param options - Optional parameters for filtering bonuses
 * @returns Promise resolving to an array of driver bonuses
 */
const getDriverBonuses = async (
  driverId: string,
  options: { 
    paid?: boolean; 
    dateRange?: { startDate: string; endDate: string; }
  } = {}
): Promise<DriverBonus[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/bonuses`, { driverId });
  const response: AxiosResponse<DriverBonus[]> = await apiClient.get(endpoint, { params: options });
  return response.data;
};

/**
 * Retrieves all unpaid bonuses for a specific driver
 * @param driverId - ID of the driver
 * @returns Promise resolving to an array of unpaid driver bonuses
 */
const getUnpaidBonusesForDriver = async (driverId: string): Promise<DriverBonus[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/bonuses/unpaid`, { driverId });
  const response: AxiosResponse<DriverBonus[]> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves the total amount of unpaid bonuses for a driver
 * @param driverId - ID of the driver
 * @returns Promise resolving to the total unpaid amount
 */
const getTotalUnpaidAmount = async (driverId: string): Promise<{ amount: number }> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/bonuses/total-unpaid`, { driverId });
  const response: AxiosResponse<{ amount: number }> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Processes the redemption of a non-monetary reward
 * @param driverId - ID of the driver
 * @param rewardId - ID of the reward to redeem
 * @returns Promise resolving to the redeemed reward
 */
const redeemReward = async (driverId: string, rewardId: string): Promise<DriverReward> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/redeem`, { driverId });
  const response: AxiosResponse<DriverReward> = await apiClient.post(endpoint, { driverId, rewardId });
  return response.data;
};

/**
 * Retrieves fuel discount rewards based on driver efficiency score
 * @param driverId - ID of the driver
 * @returns Promise resolving to an array of fuel discount rewards
 */
const getDriverFuelDiscounts = async (driverId: string): Promise<DriverReward[]> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/fuel-discounts`, { driverId });
  const response: AxiosResponse<DriverReward[]> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Checks if a driver has access to premium loads based on their efficiency score
 * @param driverId - ID of the driver
 * @returns Promise resolving to premium load access status
 */
const checkPremiumLoadAccess = async (driverId: string): Promise<{ 
  hasAccess: boolean; 
  requiredScore: number; 
  currentScore: number; 
}> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/premium-load-access`, { driverId });
  const response: AxiosResponse<{ hasAccess: boolean; requiredScore: number; currentScore: number; }> = 
    await apiClient.get(endpoint);
  return response.data;
};

/**
 * Gets a summary of all rewards for a driver within a date range
 * @param driverId - ID of the driver
 * @param dateRange - Date range for the summary
 * @returns Promise resolving to reward summary data
 */
const getDriverRewardSummary = async (
  driverId: string,
  dateRange: { startDate: string; endDate: string; }
): Promise<{ 
  totalEarned: number; 
  bonuses: number; 
  rewards: number; 
  fuelSavings: number; 
}> => {
  const endpoint = getEndpointWithParams(`${GAMIFICATION_ENDPOINTS.REWARDS}/drivers/:driverId/summary`, { driverId });
  const response: AxiosResponse<{ 
    totalEarned: number; 
    bonuses: number; 
    rewards: number; 
    fuelSavings: number; 
  }> = await apiClient.get(endpoint, { params: dateRange });
  return response.data;
};

/**
 * Retrieves all currently active bonus zones
 * @returns Promise resolving to an array of active bonus zones
 */
const getActiveBonusZones = async (): Promise<BonusZone[]> => {
  const endpoint = `${GAMIFICATION_ENDPOINTS.BONUS_ZONES}/active`;
  const response: AxiosResponse<BonusZone[]> = await apiClient.get(endpoint);
  return response.data;
};

/**
 * Retrieves bonus zones within a specified radius of a location
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param radiusMiles - Radius in miles to search
 * @returns Promise resolving to an array of nearby bonus zones
 */
const getBonusZonesInRadius = async (
  latitude: number,
  longitude: number,
  radiusMiles: number
): Promise<BonusZone[]> => {
  const endpoint = `${GAMIFICATION_ENDPOINTS.BONUS_ZONES}/nearby`;
  const response: AxiosResponse<BonusZone[]> = await apiClient.get(endpoint, { 
    params: { latitude, longitude, radiusMiles } 
  });
  return response.data;
};

/**
 * Checks if a position is within any active bonus zone
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise resolving to bonus zone check result
 */
const checkPositionInBonusZone = async (
  latitude: number,
  longitude: number
): Promise<{ inBonusZone: boolean; bonusZone?: BonusZone; multiplier?: number; }> => {
  const endpoint = `${GAMIFICATION_ENDPOINTS.BONUS_ZONES}/check-position`;
  const response: AxiosResponse<{ inBonusZone: boolean; bonusZone?: BonusZone; multiplier?: number; }> = 
    await apiClient.get(endpoint, { params: { latitude, longitude } });
  return response.data;
};

export default {
  getDriverScore,
  getDriverScoreHistory,
  calculateScoreForLoad,
  getDriverAchievements,
  getAchievementProgress,
  getAllAchievements,
  getLeaderboards,
  getCurrentLeaderboards,
  getLeaderboardById,
  getLeaderboardEntries,
  getTopLeaderboardEntries,
  getDriverLeaderboardEntry,
  getDriverLeaderboardEntries,
  getDriverRewards,
  getDriverBonuses,
  getUnpaidBonusesForDriver,
  getTotalUnpaidAmount,
  redeemReward,
  getDriverFuelDiscounts,
  checkPremiumLoadAccess,
  getDriverRewardSummary,
  getActiveBonusZones,
  getBonusZonesInRadius,
  checkPositionInBonusZone
};