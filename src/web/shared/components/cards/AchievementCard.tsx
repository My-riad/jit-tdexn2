import React from 'react';
import styled from 'styled-components';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import Card, { CardVariant } from './Card';
import AchievementBadge from '../gamification/AchievementBadge';
import Text from '../typography/Text';
import ProgressBar from '../feedback/ProgressBar';
import { theme } from '../../styles/theme';
import { Achievement, AchievementProgress } from '../../../common/interfaces/gamification.interface';

// Default value for isCompact prop
const DEFAULT_COMPACT = false;

/**
 * Props for the AchievementCard component
 */
export interface AchievementCardProps {
  achievement: Achievement;
  progress?: AchievementProgress;
  isCompact?: boolean;
  onClick?: (achievement: Achievement) => void;
  className?: string;
}

// Styled components for layout
const CardContent = styled.div<{ isCompact: boolean }>`
  display: flex;
  flex-direction: ${props => props.isCompact ? 'row' : 'column'};
  align-items: ${props => props.isCompact ? 'center' : 'flex-start'};
  width: 100%;
`;

const BadgeContainer = styled.div<{ isCompact: boolean }>`
  margin-right: ${props => props.isCompact ? theme.spacing.md : '0'};
  margin-bottom: ${props => props.isCompact ? '0' : theme.spacing.md};
  display: flex;
  justify-content: ${props => props.isCompact ? 'flex-start' : 'center'};
  width: ${props => props.isCompact ? 'auto' : '100%'};
`;

const ContentContainer = styled.div<{ isCompact: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: ${props => props.isCompact ? 'auto' : '100%'};
`;

const ProgressContainer = styled.div`
  width: 100%;
  margin-top: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
`;

const StatusContainer = styled.div<{ isEarned: boolean }>`
  display: flex;
  align-items: center;
  margin-top: ${theme.spacing.xs};
  color: ${props => props.isEarned ? theme.colors.semantic.success : theme.colors.text.secondary};
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing.xs};
`;

/**
 * A component that displays achievement information in a card format
 * 
 * Shows achievement details including badge, name, description, progress,
 * and earned status with appropriate visual styling based on achievement
 * category and level.
 */
const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  isCompact = DEFAULT_COMPACT,
  onClick,
  className,
}) => {
  // Determine if the achievement is earned based on progress or isCompleted flag
  const isEarned = progress?.isCompleted || false;
  
  return (
    <Card 
      variant={CardVariant.DEFAULT}
      onClick={onClick ? () => onClick(achievement) : undefined}
      className={className}
      elevation={isEarned ? 'medium' : 'low'}
      aria-label={`${achievement.name} achievement - ${isEarned ? 'Earned' : progress ? 'In Progress' : 'Locked'}`}
    >
      <CardContent isCompact={isCompact}>
        <BadgeContainer isCompact={isCompact}>
          <AchievementBadge 
            category={achievement.category} 
            level={achievement.level}
            isEarned={isEarned}
          />
        </BadgeContainer>
        
        <ContentContainer isCompact={isCompact}>
          <Text 
            variant="label" 
            noMargin 
            truncate={isCompact}
          >
            {achievement.name}
          </Text>
          
          {!isCompact && (
            <Text 
              variant="bodySmall" 
              color="secondary"
              truncate
              lines={2}
            >
              {achievement.description}
            </Text>
          )}
          
          {progress && !isCompact && (
            <ProgressContainer>
              <ProgressBar 
                value={progress.currentValue} 
                max={progress.targetValue}
                size="small"
                showLabel
                thresholds={[
                  { value: 75, color: theme.colors.semantic.success },
                  { value: 50, color: theme.colors.semantic.info },
                  { value: 25, color: theme.colors.semantic.warning },
                  { value: 0, color: theme.colors.semantic.error }
                ]}
              />
            </ProgressContainer>
          )}
          
          <StatusContainer isEarned={isEarned}>
            <StatusIcon>
              {isEarned ? (
                <CheckCircleIcon width={16} height={16} />
              ) : (
                <LockClosedIcon width={16} height={16} />
              )}
            </StatusIcon>
            <Text 
              variant="caption" 
              noMargin
            >
              {isEarned ? 'Earned' : progress ? 'In Progress' : 'Locked'}
            </Text>
          </StatusContainer>
        </ContentContainer>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;