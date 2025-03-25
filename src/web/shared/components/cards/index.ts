import { Card, CardProps, CardVariant } from './Card';
import { InfoCard, InfoCardProps, InfoCardVariant } from './InfoCard';
import { LoadCard, LoadCardProps, LoadCardVariant } from './LoadCard';
import { DriverCard, DriverCardProps, DriverCardVariant, DriverCardSize } from './DriverCard';
import { StatsCard, StatsCardProps } from './StatsCard';
import { AchievementCard, AchievementCardProps } from './AchievementCard';

/**
 * Exports the base Card component and its associated types.
 * This card provides a basic container with styling for consistent UI elements.
 */
export { Card };
export type { CardProps };
export { CardVariant };

/**
 * Exports the InfoCard component and its associated types.
 * This card is designed for displaying informational content with a title, description, and optional icon.
 */
export { InfoCard };
export type { InfoCardProps };
export { InfoCardVariant };

/**
 * Exports the LoadCard component and its associated types.
 * This card is used to display load information, including origin, destination, and other relevant details.
 */
export { LoadCard };
export type { LoadCardProps };
export { LoadCardVariant };

/**
 * Exports the DriverCard component and its associated types.
 * This card is used to display driver information, including name, status, and other relevant details.
 */
export { DriverCard };
export type { DriverCardProps };
export { DriverCardVariant };
export { DriverCardSize };

/**
 * Exports the StatsCard component and its associated types.
 * This card is used to display statistical information, such as key performance indicators (KPIs).
 */
export { StatsCard };
export type { StatsCardProps };

/**
 * Exports the AchievementCard component and its associated types.
 * This card is used to display achievement information, such as badges and progress.
 */
export { AchievementCard };
export type { AchievementCardProps };