import React from 'react'; // version ^18.2.0
import AchievementBadge, { AchievementBadgeProps } from './AchievementBadge';
import LeaderboardRow, { LeaderboardRowProps } from './LeaderboardRow';
import ScoreDisplay, { ScoreDisplayProps } from './ScoreDisplay';
import RewardCard, { RewardCardProps } from './RewardCard';
import BonusAlert, { BonusAlertProps } from './BonusAlert';
import {
  AchievementCategory,
  AchievementLevel,
  LeaderboardEntry,
  Reward,
  DriverReward,
  BonusZone
} from '../../../common/interfaces/gamification.interface';

/**
 * @file
 * This file serves as the central export point for all gamification-related components used throughout the application.
 * It provides a clean interface for importing gamification components like achievement badges, leaderboard rows, score displays, reward cards, and bonus alerts,
 * which are essential for implementing the gamification and incentive features of the freight optimization platform.
 *
 * Requirements Addressed:
 * - F-004: Driver Score System - System where drivers earn points for accepting optimized loads, with higher scores unlocking better loads, fuel discounts, and cash bonuses.
 * - F-005: Leaderboards & AI-Powered Rewards - Weekly and monthly cash bonuses for top efficiency drivers with gamified badges (Platinum Driver, Optimization Master, etc.).
 * - F-006: Dynamic Bonus Zones - System where drivers earn extra money for hauling loads to specific zones where AI predicts another driver needs them, visualized through real-time heat maps.
 * - F-007: Fuel & Emission Reduction Incentives - Drivers who opt for AI-recommended backhauls get fuel card discounts, supported by corporate partnerships with fueling stations.
 */

// Export AchievementBadge Component and its Props
export { AchievementBadge };
export type { AchievementBadgeProps };

// Export LeaderboardRow Component and its Props
export { LeaderboardRow };
export type { LeaderboardRowProps };

// Export ScoreDisplay Component and its Props
export { ScoreDisplay };
export type { ScoreDisplayProps };

// Export RewardCard Component and its Props
export { RewardCard };
export type { RewardCardProps };

// Export BonusAlert Component and its Props
export { BonusAlert };
export type { BonusAlertProps };

// Export types and enums related to gamification
export type {
    AchievementCategory,
    AchievementLevel,
    LeaderboardEntry,
    Reward,
    DriverReward,
    BonusZone
};