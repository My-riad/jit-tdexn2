/**
 * Gamification Service Configuration Module
 * 
 * This module provides service-specific settings and re-exports common configuration utilities
 * for the Gamification Service. It includes configuration for score calculation weights,
 * achievement criteria, leaderboard settings, and bonus zone parameters.
 */

import {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
} from '../../../common/config/environment.config';

import {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance
} from '../../../common/config/database.config';

import {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';

import {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';

import logger from '../../../common/utils/logger';

/**
 * Interface defining the structure of the score calculation weights
 * Based on the specifications from the efficiency score calculation
 */
export interface ScoreWeights {
  emptyMilesReduction: number;  // Weight for reduction in empty miles
  networkContribution: number;  // Weight for contribution to overall network efficiency
  onTimePerformance: number;    // Weight for on-time pickups and deliveries
  smartHubUtilization: number;  // Weight for Smart Hub participation
  fuelEfficiency: number;       // Weight for fuel efficiency relative to vehicle class average
}

/**
 * Interface defining the structure of leaderboard settings
 */
export interface LeaderboardSettings {
  refreshInterval: number;     // Milliseconds between leaderboard refresh
  cacheExpiration: number;     // Milliseconds until cache expires
  weeklyResetDay: number;      // 0 = Sunday, 1 = Monday, etc.
  monthlyResetDay: number;     // Day of month for monthly reset
  topDriverCount: number;      // Number of top drivers to include
  regionalEnabled: boolean;    // Whether to create region-specific leaderboards
}

/**
 * Interface defining the structure of bonus zone settings
 */
export interface BonusZoneSettings {
  minMultiplier: number;       // Minimum bonus multiplier (e.g., 1.1 = 10% bonus)
  maxMultiplier: number;       // Maximum bonus multiplier (e.g., 2.0 = 100% bonus)
  defaultDuration: number;     // Default duration in milliseconds
  minRadius: number;           // Minimum radius in miles
  maxRadius: number;           // Maximum radius in miles
  updateFrequency: number;     // Milliseconds between bonus zone updates
}

/**
 * Interface defining the structure of achievement settings
 */
export interface AchievementSettings {
  checkFrequency: number;      // Milliseconds between achievement checks
  badgeBasePath: string;       // Base path for badge images
  notificationEnabled: boolean; // Whether to send notifications for achievements
  levelThresholds: number[];   // Thresholds for different achievement levels
}

/**
 * Interface defining the structure of the gamification configuration
 */
export interface GamificationConfig {
  scoreWeights: ScoreWeights;
  leaderboardSettings: LeaderboardSettings;
  bonusZoneSettings: BonusZoneSettings;
  achievementSettings: AchievementSettings;
}

/**
 * Object containing all gamification service configuration settings
 */
const gamificationConfig: GamificationConfig = {
  scoreWeights: {
    emptyMilesReduction: 0.3,    // 30% weight for empty miles reduction
    networkContribution: 0.25,   // 25% weight for network contribution
    onTimePerformance: 0.2,      // 20% weight for on-time performance
    smartHubUtilization: 0.15,   // 15% weight for Smart Hub utilization
    fuelEfficiency: 0.1          // 10% weight for fuel efficiency
  },
  leaderboardSettings: {
    refreshInterval: getEnvNumber('GAMIFICATION_LEADERBOARD_REFRESH_INTERVAL', 3600000), // 1 hour default
    cacheExpiration: getEnvNumber('GAMIFICATION_LEADERBOARD_CACHE_EXPIRATION', 300000),  // 5 minutes default
    weeklyResetDay: getEnvNumber('GAMIFICATION_LEADERBOARD_WEEKLY_RESET_DAY', 0),        // Sunday by default
    monthlyResetDay: getEnvNumber('GAMIFICATION_LEADERBOARD_MONTHLY_RESET_DAY', 1),      // 1st of month by default
    topDriverCount: getEnvNumber('GAMIFICATION_LEADERBOARD_TOP_DRIVER_COUNT', 100),      // Top 100 drivers by default
    regionalEnabled: getEnvBoolean('GAMIFICATION_LEADERBOARD_REGIONAL_ENABLED', true)    // Regional leaderboards enabled by default
  },
  bonusZoneSettings: {
    minMultiplier: getEnvNumber('GAMIFICATION_BONUS_ZONE_MIN_MULTIPLIER', 1.1),          // 10% bonus minimum
    maxMultiplier: getEnvNumber('GAMIFICATION_BONUS_ZONE_MAX_MULTIPLIER', 2.0),          // 100% bonus maximum
    defaultDuration: getEnvNumber('GAMIFICATION_BONUS_ZONE_DEFAULT_DURATION', 86400000), // 24 hours default
    minRadius: getEnvNumber('GAMIFICATION_BONUS_ZONE_MIN_RADIUS', 50),                   // 50 miles minimum
    maxRadius: getEnvNumber('GAMIFICATION_BONUS_ZONE_MAX_RADIUS', 200),                  // 200 miles maximum
    updateFrequency: getEnvNumber('GAMIFICATION_BONUS_ZONE_UPDATE_FREQUENCY', 3600000)   // 1 hour update frequency
  },
  achievementSettings: {
    checkFrequency: getEnvNumber('GAMIFICATION_ACHIEVEMENT_CHECK_FREQUENCY', 86400000),  // Check daily by default
    badgeBasePath: getEnv('GAMIFICATION_ACHIEVEMENT_BADGE_BASE_PATH', 'assets/images/achievement-badges/'),
    notificationEnabled: getEnvBoolean('GAMIFICATION_ACHIEVEMENT_NOTIFICATION_ENABLED', true),
    levelThresholds: [100, 500, 1000, 5000] // Default thresholds for achievements
  }
};

/**
 * Retrieves the gamification service configuration settings
 * 
 * @returns Configuration object with gamification settings
 */
export const getGamificationConfig = (): GamificationConfig => {
  return gamificationConfig;
};

/**
 * Initializes the gamification service configuration
 * 
 * @returns Promise that resolves when configuration is initialized
 */
export const initializeGamificationConfig = async (): Promise<void> => {
  // Load environment variables
  loadEnvConfig();
  
  // Initialize database connection
  const dbConfig = getDatabaseConfig();
  createKnexInstance(dbConfig);
  
  // Initialize Redis client for caching leaderboards and scores
  getDefaultRedisClient('gamification');
  
  // Set up Kafka configuration for event processing
  const kafkaConfig = getKafkaConfig();
  
  // Load score calculation weights from environment or defaults
  if (process.env.GAMIFICATION_SCORE_WEIGHTS) {
    try {
      const weightsFromEnv = JSON.parse(process.env.GAMIFICATION_SCORE_WEIGHTS);
      gamificationConfig.scoreWeights = {
        ...gamificationConfig.scoreWeights,
        ...weightsFromEnv
      };
    } catch (error) {
      logger.error('Failed to parse GAMIFICATION_SCORE_WEIGHTS environment variable', { error });
    }
  }
  
  // Load achievement criteria from environment or defaults
  if (process.env.GAMIFICATION_ACHIEVEMENT_LEVEL_THRESHOLDS) {
    try {
      const thresholdsFromEnv = JSON.parse(process.env.GAMIFICATION_ACHIEVEMENT_LEVEL_THRESHOLDS);
      if (Array.isArray(thresholdsFromEnv)) {
        gamificationConfig.achievementSettings.levelThresholds = thresholdsFromEnv;
      }
    } catch (error) {
      logger.error('Failed to parse GAMIFICATION_ACHIEVEMENT_LEVEL_THRESHOLDS environment variable', { error });
    }
  }
  
  // Load leaderboard settings from environment or defaults
  // Already loaded via getEnvNumber/getEnvBoolean in the configuration object
  
  // Load bonus zone parameters from environment or defaults
  // Already loaded via getEnvNumber in the configuration object
  
  logger.info('Gamification configuration initialized', {
    scoreWeights: gamificationConfig.scoreWeights,
    environment: NODE_ENV
  });
};

// Re-export common configuration utilities
export {
  loadEnvConfig,
  getEnv,
  requireEnv,
  getEnvNumber,
  getEnvBoolean,
  NODE_ENV,
  IS_PRODUCTION
} from '../../../common/config/environment.config';

export {
  getDatabaseConfig,
  createKnexInstance,
  getKnexInstance
} from '../../../common/config/database.config';

export {
  getKafkaConfig,
  getProducerConfig,
  getConsumerConfig
} from '../../../common/config/kafka.config';

export {
  getRedisConfig,
  getDefaultRedisClient
} from '../../../common/config/redis.config';