import React from 'react';
import styled from 'styled-components';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Card from '../cards/Card';
import AchievementBadge from './AchievementBadge';
import Heading from '../typography/Heading';
import Text from '../typography/Text';
import ProgressBar from '../feedback/ProgressBar';
import FlexBox from '../layout/FlexBox';
import { theme } from '../../styles/theme';
import { 
  Achievement, 
  AchievementProgress, 
  AchievementCategory, 
  AchievementLevel 
} from '../../../common/interfaces/gamification.interface';

// Default size for achievement badges
const DEFAULT_BADGE_SIZE = 'medium';

/**
 * Props for the AchievementCard component
 */
export interface AchievementCardProps {
  /** The achievement data to display */
  achievement: Achievement;
  /** Optional progress data for the achievement */
  progress?: AchievementProgress;
  /** Optional click handler to make the card interactive */
  onClick?: () => void;
  /** Optional CSS class for additional styling */
  className?: string;
}

/**
 * Styled Card component for achievement cards
 */
const StyledCard = styled(Card)<{ onClick?: () => void }>`
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: ${props => props.onClick ? 'translateY(-2px)' : 'none'};
  }
`;

/**
 * Container for card content with flex layout
 */
const CardContent = styled(FlexBox)`
  width: 100%;
  align-items: center;
`;

/**
 * Container for the achievement badge
 */
const BadgeContainer = styled.div`
  margin-right: ${theme.spacing.md};
  flex-shrink: 0;
`;

/**
 * Container for achievement text content
 */
const ContentContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * Container for achievement status indicator
 */
const StatusContainer = styled.div`
  margin-left: ${theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

/**
 * Container for progress bar
 */
const ProgressContainer = styled.div`
  margin-top: ${theme.spacing.xs};
  width: 100%;
`;

/**
 * Styled CheckCircleIcon for completed achievements
 */
const CompletedIcon = styled(CheckCircleIcon)`
  width: 24px;
  height: 24px;
  color: ${theme.colors.semantic.success};
`;

/**
 * Styled Heading for achievement title
 */
const AchievementTitle = styled(Heading)`
  margin-bottom: ${theme.spacing.xxs};
  font-size: 1rem;
  line-height: 1.2;
`;

/**
 * Styled Text for achievement description
 */
const AchievementDescription = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 0.875rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * A component that displays an achievement card with badge, title, description, and progress
 * 
 * This component is used in both web and mobile interfaces to present gamification 
 * achievements in a consistent, visually appealing format. It shows achievement 
 * details along with current progress or completion status.
 */
const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  onClick,
  className,
}) => {
  // Determine if the achievement is earned
  const isEarned = progress?.isCompleted || false;
  
  // Calculate progress percentage if not earned and progress data exists
  const progressPercentage = !isEarned && progress 
    ? Math.min(100, Math.max(0, (progress.currentValue / progress.targetValue) * 100)) 
    : 0;

  return (
    <StyledCard onClick={onClick} className={className}>
      <CardContent>
        <BadgeContainer>
          <AchievementBadge 
            category={achievement.category} 
            level={achievement.level}
            size={DEFAULT_BADGE_SIZE}
            isEarned={isEarned}
          />
        </BadgeContainer>
        
        <ContentContainer>
          <AchievementTitle level={5}>{achievement.name}</AchievementTitle>
          <AchievementDescription variant="bodySmall" noMargin>
            {achievement.description}
          </AchievementDescription>
          
          {!isEarned && progress && (
            <ProgressContainer>
              <ProgressBar 
                value={progress.currentValue} 
                max={progress.targetValue}
                size="small"
                showLabel
                label={`${progress.currentValue}/${progress.targetValue}`}
              />
            </ProgressContainer>
          )}
        </ContentContainer>
        
        {isEarned && (
          <StatusContainer>
            <CompletedIcon aria-label="Achievement completed" />
          </StatusContainer>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default AchievementCard;