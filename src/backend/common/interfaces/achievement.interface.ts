/**
 * Achievement Interface Definitions
 * 
 * This file defines the core interfaces and types for the platform's gamification
 * achievement system. These interfaces are used throughout the application to
 * implement gamification features that incentivize drivers to make efficient decisions.
 */

/**
 * Categories for grouping achievements by type
 */
export enum AchievementCategory {
  EFFICIENCY = 'efficiency',
  NETWORK_CONTRIBUTION = 'network_contribution',
  ON_TIME_DELIVERY = 'on_time_delivery',
  SMART_HUB_UTILIZATION = 'smart_hub_utilization',
  FUEL_EFFICIENCY = 'fuel_efficiency',
  SAFETY = 'safety',
  MILESTONE = 'milestone'
}

/**
 * Achievement levels to indicate difficulty and prestige
 */
export enum AchievementLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond'
}

/**
 * Types of metrics that can be used for achievement criteria
 */
export enum MetricType {
  EFFICIENCY_SCORE = 'efficiency_score',
  EMPTY_MILES_REDUCTION = 'empty_miles_reduction',
  NETWORK_CONTRIBUTION = 'network_contribution',
  ON_TIME_PERCENTAGE = 'on_time_percentage',
  SMART_HUB_USAGE = 'smart_hub_usage',
  FUEL_EFFICIENCY = 'fuel_efficiency',
  LOADS_COMPLETED = 'loads_completed',
  MILES_DRIVEN = 'miles_driven',
  RELAY_PARTICIPATION = 'relay_participation'
}

/**
 * Timeframes for achievement criteria evaluation
 */
export enum TimeframeType {
  ALL_TIME = 'all_time',
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  SINGLE_EVENT = 'single_event'
}

/**
 * Defines the criteria that must be met to earn an achievement
 */
export interface AchievementCriteria {
  /**
   * The type of metric being measured
   */
  metricType: MetricType;
  
  /**
   * The target value that must be reached to earn the achievement
   */
  threshold: number;
  
  /**
   * The timeframe over which the metric is evaluated
   */
  timeframe: TimeframeType;
  
  /**
   * Comparison operator (e.g., '>=', '=', '<', etc.)
   */
  comparisonOperator: string;
  
  /**
   * Additional parameters specific to this achievement criteria
   */
  additionalParams: Record<string, any>;
}

/**
 * Defines the structure of an achievement in the gamification system
 */
export interface Achievement {
  /**
   * Unique identifier for the achievement
   */
  id: string;
  
  /**
   * Display name of the achievement
   */
  name: string;
  
  /**
   * Detailed description of how to earn the achievement
   */
  description: string;
  
  /**
   * Category the achievement belongs to
   */
  category: AchievementCategory;
  
  /**
   * Difficulty/prestige level of the achievement
   */
  level: AchievementLevel;
  
  /**
   * Points awarded for earning this achievement
   */
  points: number;
  
  /**
   * URL to the badge image for this achievement
   */
  badgeImageUrl: string;
  
  /**
   * Criteria that must be met to earn this achievement
   */
  criteria: AchievementCriteria;
  
  /**
   * Whether the achievement is currently active
   */
  isActive: boolean;
  
  /**
   * When the achievement was created
   */
  createdAt: Date;
  
  /**
   * When the achievement was last updated
   */
  updatedAt: Date;
}

/**
 * Defines the relationship between a driver and an earned achievement
 */
export interface DriverAchievement {
  /**
   * Unique identifier for this driver-achievement relationship
   */
  id: string;
  
  /**
   * ID of the driver who earned the achievement
   */
  driverId: string;
  
  /**
   * ID of the earned achievement
   */
  achievementId: string;
  
  /**
   * When the achievement was earned
   */
  earnedAt: Date;
  
  /**
   * Additional data related to this achievement earning
   */
  achievementData: Record<string, any>;
  
  /**
   * The full achievement object (populated by services as needed)
   */
  achievement: Achievement;
  
  /**
   * When this record was created
   */
  createdAt: Date;
  
  /**
   * When this record was last updated
   */
  updatedAt: Date;
}

/**
 * Tracks a driver's progress toward earning an achievement
 */
export interface AchievementProgress {
  /**
   * ID of the achievement being tracked
   */
  achievementId: string;
  
  /**
   * The full achievement object (populated by services as needed)
   */
  achievement: Achievement;
  
  /**
   * Current metric value toward the achievement
   */
  currentValue: number;
  
  /**
   * Target value needed to earn the achievement
   */
  targetValue: number;
  
  /**
   * Percentage of progress toward earning the achievement
   */
  progressPercentage: number;
  
  /**
   * Whether the achievement has been completed
   */
  isCompleted: boolean;
  
  /**
   * When the achievement was completed (null if not completed)
   */
  completedAt: Date | null;
}

/**
 * Defines the structure of achievement-related events for event-driven processing
 */
export interface AchievementEvent {
  /**
   * Type of achievement event (e.g., 'earned', 'progress_updated', etc.)
   */
  eventType: string;
  
  /**
   * ID of the driver associated with this event
   */
  driverId: string;
  
  /**
   * ID of the achievement associated with this event
   */
  achievementId: string;
  
  /**
   * When the event occurred
   */
  timestamp: Date;
  
  /**
   * Additional event data
   */
  data: Record<string, any>;
}