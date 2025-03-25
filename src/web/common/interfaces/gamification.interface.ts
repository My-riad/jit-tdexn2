/**
 * Gamification Interfaces and Enums
 * 
 * This file defines the TypeScript interfaces and enums for the gamification features
 * of the freight optimization platform, including achievements, leaderboards, driver scores,
 * rewards, and bonus zones.
 */

export enum AchievementCategory {
  EFFICIENCY = 'EFFICIENCY',
  NETWORK_CONTRIBUTION = 'NETWORK_CONTRIBUTION',
  ON_TIME_DELIVERY = 'ON_TIME_DELIVERY',
  SMART_HUB_UTILIZATION = 'SMART_HUB_UTILIZATION',
  FUEL_EFFICIENCY = 'FUEL_EFFICIENCY',
  SAFETY = 'SAFETY',
  MILESTONE = 'MILESTONE'
}

export enum AchievementLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND'
}

export enum RewardType {
  FUEL_DISCOUNT = 'FUEL_DISCOUNT',
  PREMIUM_LOAD_ACCESS = 'PREMIUM_LOAD_ACCESS',
  CASH_BONUS = 'CASH_BONUS',
  MAINTENANCE_DISCOUNT = 'MAINTENANCE_DISCOUNT',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT'
}

export enum LeaderboardType {
  EFFICIENCY = 'EFFICIENCY',
  NETWORK_CONTRIBUTION = 'NETWORK_CONTRIBUTION',
  EMPTY_MILES_REDUCTION = 'EMPTY_MILES_REDUCTION',
  SMART_HUB_USAGE = 'SMART_HUB_USAGE'
}

export enum LeaderboardTimeframe {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  ALL_TIME = 'ALL_TIME'
}

export enum RewardStatus {
  AVAILABLE = 'AVAILABLE',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  level: AchievementLevel;
  points: number;
  badgeImageUrl: string;
  isActive: boolean;
}

export interface DriverAchievement {
  id: string;
  driverId: string;
  achievementId: string;
  achievement: Achievement;
  earnedAt: string; // ISO date string
}

export interface AchievementProgress {
  achievementId: string;
  achievement: Achievement;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface DriverScore {
  id: string;
  driverId: string;
  totalScore: number; // 0-100 scale
  
  // Component scores based on the weighted algorithm
  emptyMilesScore: number; // 30% weight - reduction compared to regional average
  networkContributionScore: number; // 25% weight - impact on overall network efficiency
  onTimeScore: number; // 20% weight - percentage of on-time pickups and deliveries
  hubUtilizationScore: number; // 15% weight - frequency of participation in load exchanges
  fuelEfficiencyScore: number; // 10% weight - MPG relative to vehicle class average
  
  // Additional factors that might affect the score
  scoreFactors: Record<string, number>;
  calculatedAt: string; // ISO date string
}

export interface ScoreHistory {
  score: number;
  date: string; // ISO date string
}

export interface Leaderboard {
  id: string;
  name: string;
  leaderboardType: LeaderboardType;
  timeframe: LeaderboardTimeframe;
  region: string;
  startPeriod: string; // ISO date string
  endPeriod: string; // ISO date string
  isActive: boolean;
  lastUpdated: string; // ISO date string
  bonusStructure: Record<number, number>; // Map of rank to bonus amount
}

export interface LeaderboardEntry {
  id: string;
  leaderboardId: string;
  driverId: string;
  driverName: string;
  rank: number;
  previousRank: number;
  score: number;
  bonusAmount: number;
  isCurrentDriver: boolean; // Flag to highlight the current user
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  rewardType: RewardType;
  value: number; // Amount of discount, bonus, etc.
  requiredScore: number; // Minimum efficiency score needed
  imageUrl: string;
}

export interface DriverReward {
  id: string;
  driverId: string;
  rewardId: string;
  reward: Reward;
  status: RewardStatus;
  redeemedAt: string; // ISO date string
  expiresAt: string; // ISO date string
}

export interface BonusZone {
  id: string;
  name: string;
  boundary: Array<{latitude: number, longitude: number}>; // Polygon coordinates
  multiplier: number; // Payment multiplier for loads in this zone
  reason: string; // Explanation for bonus zone creation
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  isActive: boolean;
}

export interface DriverBonus {
  id: string;
  driverId: string;
  zoneId: string;
  assignmentId: string; // Reference to load assignment
  bonusAmount: number;
  bonusReason: string;
  paid: boolean;
  earnedAt: string; // ISO date string
  paidAt: string; // ISO date string
}