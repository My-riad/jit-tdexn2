import React from 'react';
import styled from 'styled-components';
import { 
  StarIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  ClockIcon, 
  FireIcon 
} from '@heroicons/react/24/solid';
import { colors, borders, spacing } from '../../styles/theme';
import { 
  AchievementCategory, 
  AchievementLevel 
} from '../../../common/interfaces/gamification.interface';

// Default values
const DEFAULT_SIZE = 'medium';
const DEFAULT_IS_EARNED = true;

// Props interface
export interface AchievementBadgeProps {
  category: AchievementCategory;
  level: AchievementLevel;
  size?: string;
  isEarned?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

// Helper function to get the appropriate color for an achievement category
const getAchievementCategoryColor = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.EFFICIENCY:
      return colors.semantic.success;
    case AchievementCategory.NETWORK_CONTRIBUTION:
      return colors.primary.blue;
    case AchievementCategory.ON_TIME_DELIVERY:
      return colors.primary.orange;
    case AchievementCategory.SMART_HUB_UTILIZATION:
      return colors.primary.blueLight;
    case AchievementCategory.FUEL_EFFICIENCY:
      return colors.semantic.success;
    case AchievementCategory.SAFETY:
      return colors.semantic.info;
    case AchievementCategory.MILESTONE:
      return colors.primary.orange;
    default:
      return colors.neutral.mediumGray;
  }
};

// Helper function to get the appropriate border style for an achievement level
const getAchievementLevelBorder = (level: AchievementLevel): string => {
  switch (level) {
    case AchievementLevel.BRONZE:
      return `${borders.width.thin} solid #CD7F32`;
    case AchievementLevel.SILVER:
      return `${borders.width.thin} solid #C0C0C0`;
    case AchievementLevel.GOLD:
      return `${borders.width.medium} solid #FFD700`;
    case AchievementLevel.PLATINUM:
      return `${borders.width.medium} solid #E5E4E2`;
    case AchievementLevel.DIAMOND:
      return `${borders.width.thick} solid #B9F2FF`;
    default:
      return `${borders.width.thin} solid ${colors.neutral.lightGray}`;
  }
};

// Helper function to get the default icon for an achievement category
const getDefaultIcon = (category: AchievementCategory): React.ReactNode => {
  switch (category) {
    case AchievementCategory.EFFICIENCY:
      return <ChartBarIcon />;
    case AchievementCategory.NETWORK_CONTRIBUTION:
      return <TrophyIcon />;
    case AchievementCategory.ON_TIME_DELIVERY:
      return <ClockIcon />;
    case AchievementCategory.SMART_HUB_UTILIZATION:
      return <TrophyIcon />;
    case AchievementCategory.FUEL_EFFICIENCY:
      return <FireIcon />;
    case AchievementCategory.SAFETY:
      return <StarIcon />;
    case AchievementCategory.MILESTONE:
      return <StarIcon />;
    default:
      return <StarIcon />;
  }
};

// Styled components
const BadgeContainer = styled.div<{
  category: AchievementCategory;
  level: AchievementLevel;
  size: string;
  isEarned: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${borders.radius.round};
  width: ${props => props.size === 'small' ? '32px' : props.size === 'large' ? '64px' : '48px'};
  height: ${props => props.size === 'small' ? '32px' : props.size === 'large' ? '64px' : '48px'};
  background-color: ${props => getAchievementCategoryColor(props.category)};
  border: ${props => getAchievementLevelBorder(props.level)};
  opacity: ${props => props.isEarned ? 1 : 0.5};
  transition: all 0.2s ease-in-out;
  box-shadow: ${props => props.isEarned ? spacing.xs : 'none'};
`;

const IconWrapper = styled.div<{ size: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '32px' : '24px'};
  height: ${props => props.size === 'small' ? '16px' : props.size === 'large' ? '32px' : '24px'};
  color: ${colors.neutral.white};
`;

/**
 * AchievementBadge Component
 * 
 * Displays achievement badges with different styles based on category, level, and earned status.
 * Visual representation of gamification achievements in the freight optimization platform.
 * 
 * @param category - Achievement category determining the badge color and icon
 * @param level - Achievement level determining the border style 
 * @param size - Badge size ('small', 'medium', or 'large')
 * @param isEarned - Whether the achievement has been earned by the driver
 * @param icon - Optional custom icon to override the default
 * @param className - Optional CSS class for additional styling
 */
const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  category,
  level,
  size = DEFAULT_SIZE,
  isEarned = DEFAULT_IS_EARNED,
  icon,
  className,
}) => {
  // Determine which icon to display
  const badgeIcon = icon || getDefaultIcon(category);

  return (
    <BadgeContainer
      category={category}
      level={level}
      size={size}
      isEarned={isEarned}
      className={className}
      aria-label={`${level} ${category} Achievement ${isEarned ? 'Earned' : 'Not Earned'}`}
    >
      <IconWrapper size={size}>
        {badgeIcon}
      </IconWrapper>
    </BadgeContainer>
  );
};

export default AchievementBadge;