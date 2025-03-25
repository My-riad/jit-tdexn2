import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { 
  AchievementCategory, 
  AchievementLevel, 
  MetricType, 
  TimeframeType 
} from '../../common/interfaces/achievement.interface';

/**
 * Seeds the achievements table with predefined achievements for the gamification system.
 * These achievements are designed to incentivize drivers to make efficient decisions,
 * utilize Smart Hubs, reduce empty miles, and contribute to overall network optimization.
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data from the achievements table
  await knex('achievements').del();

  // Define achievements by category
  const achievements = [
    // EFFICIENCY category achievements
    createAchievement({
      name: 'Efficiency Master',
      description: 'Maintain an efficiency score of 90+ for a week',
      category: AchievementCategory.EFFICIENCY,
      level: AchievementLevel.GOLD,
      points: 500,
      criteria: {
        metricType: MetricType.EFFICIENCY_SCORE,
        threshold: 90,
        timeframe: TimeframeType.WEEKLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Empty Mile Eliminator',
      description: 'Reduce empty miles by 50% compared to fleet average',
      category: AchievementCategory.EFFICIENCY,
      level: AchievementLevel.SILVER,
      points: 300,
      criteria: {
        metricType: MetricType.EMPTY_MILES_REDUCTION,
        threshold: 50,
        timeframe: TimeframeType.MONTHLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Zero Deadhead Hero',
      description: 'Complete 5 consecutive loads with less than 5% empty miles',
      category: AchievementCategory.EFFICIENCY,
      level: AchievementLevel.PLATINUM,
      points: 750,
      criteria: {
        metricType: MetricType.EMPTY_MILES_REDUCTION,
        threshold: 95,
        timeframe: TimeframeType.SINGLE_EVENT,
        comparisonOperator: '>=',
        additionalParams: {
          consecutiveCount: 5
        }
      }
    }),

    // NETWORK_CONTRIBUTION category achievements
    createAchievement({
      name: 'Network Optimizer',
      description: 'Contribute to network efficiency with a score of 85+ for a month',
      category: AchievementCategory.NETWORK_CONTRIBUTION,
      level: AchievementLevel.SILVER,
      points: 400,
      criteria: {
        metricType: MetricType.NETWORK_CONTRIBUTION,
        threshold: 85,
        timeframe: TimeframeType.MONTHLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Team Player',
      description: 'Accept 10 loads that significantly improve network efficiency',
      category: AchievementCategory.NETWORK_CONTRIBUTION,
      level: AchievementLevel.BRONZE,
      points: 200,
      criteria: {
        metricType: MetricType.NETWORK_CONTRIBUTION,
        threshold: 10,
        timeframe: TimeframeType.ALL_TIME,
        comparisonOperator: '>=',
        additionalParams: {
          significantThreshold: 80
        }
      }
    }),

    // ON_TIME_DELIVERY category achievements
    createAchievement({
      name: 'Perfect Delivery',
      description: 'Maintain 100% on-time delivery for 20 consecutive loads',
      category: AchievementCategory.ON_TIME_DELIVERY,
      level: AchievementLevel.DIAMOND,
      points: 1000,
      criteria: {
        metricType: MetricType.ON_TIME_PERCENTAGE,
        threshold: 100,
        timeframe: TimeframeType.SINGLE_EVENT,
        comparisonOperator: '==',
        additionalParams: {
          consecutiveCount: 20
        }
      }
    }),
    createAchievement({
      name: 'Reliability Champion',
      description: 'Maintain 95%+ on-time delivery rate for a month',
      category: AchievementCategory.ON_TIME_DELIVERY,
      level: AchievementLevel.GOLD,
      points: 500,
      criteria: {
        metricType: MetricType.ON_TIME_PERCENTAGE,
        threshold: 95,
        timeframe: TimeframeType.MONTHLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),

    // SMART_HUB_UTILIZATION category achievements
    createAchievement({
      name: 'Hub Connector',
      description: 'Complete 15 load exchanges at Smart Hubs',
      category: AchievementCategory.SMART_HUB_UTILIZATION,
      level: AchievementLevel.SILVER,
      points: 350,
      criteria: {
        metricType: MetricType.SMART_HUB_USAGE,
        threshold: 15,
        timeframe: TimeframeType.ALL_TIME,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Hub Master',
      description: 'Complete 5 load exchanges at Smart Hubs in a single week',
      category: AchievementCategory.SMART_HUB_UTILIZATION,
      level: AchievementLevel.GOLD,
      points: 450,
      criteria: {
        metricType: MetricType.SMART_HUB_USAGE,
        threshold: 5,
        timeframe: TimeframeType.WEEKLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Relay Champion',
      description: 'Participate in 10 successful relay hauls',
      category: AchievementCategory.SMART_HUB_UTILIZATION,
      level: AchievementLevel.GOLD,
      points: 500,
      criteria: {
        metricType: MetricType.RELAY_PARTICIPATION,
        threshold: 10,
        timeframe: TimeframeType.ALL_TIME,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),

    // FUEL_EFFICIENCY category achievements
    createAchievement({
      name: 'Fuel Optimizer',
      description: 'Maintain fuel efficiency 15% better than fleet average for a month',
      category: AchievementCategory.FUEL_EFFICIENCY,
      level: AchievementLevel.SILVER,
      points: 300,
      criteria: {
        metricType: MetricType.FUEL_EFFICIENCY,
        threshold: 15,
        timeframe: TimeframeType.MONTHLY,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),

    // MILESTONE category achievements
    createAchievement({
      name: 'Century Driver',
      description: 'Complete 100 loads',
      category: AchievementCategory.MILESTONE,
      level: AchievementLevel.BRONZE,
      points: 250,
      criteria: {
        metricType: MetricType.LOADS_COMPLETED,
        threshold: 100,
        timeframe: TimeframeType.ALL_TIME,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Road Warrior',
      description: 'Drive 100,000 miles',
      category: AchievementCategory.MILESTONE,
      level: AchievementLevel.SILVER,
      points: 400,
      criteria: {
        metricType: MetricType.MILES_DRIVEN,
        threshold: 100000,
        timeframe: TimeframeType.ALL_TIME,
        comparisonOperator: '>=',
        additionalParams: {}
      }
    }),
    createAchievement({
      name: 'Elite Driver',
      description: 'Maintain an efficiency score of 90+ for 3 consecutive months',
      category: AchievementCategory.MILESTONE,
      level: AchievementLevel.DIAMOND,
      points: 1000,
      criteria: {
        metricType: MetricType.EFFICIENCY_SCORE,
        threshold: 90,
        timeframe: TimeframeType.MONTHLY,
        comparisonOperator: '>=',
        additionalParams: {
          consecutiveCount: 3
        }
      }
    })
  ];

  // Insert achievements into the database
  await knex('achievements').insert(achievements);
  
  console.log('Achievements table seeded successfully');
}

/**
 * Helper function to create an achievement record with consistent structure
 */
function createAchievement({
  name,
  description,
  category,
  level,
  points,
  criteria
}: {
  name: string;
  description: string;
  category: AchievementCategory;
  level: AchievementLevel;
  points: number;
  criteria: {
    metricType: MetricType;
    threshold: number;
    timeframe: TimeframeType;
    comparisonOperator: string;
    additionalParams: Record<string, any>;
  };
}) {
  return {
    id: uuidv4(),
    name,
    description,
    category,
    level,
    points,
    badgeImageUrl: `/assets/badges/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    criteria,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export default seed;