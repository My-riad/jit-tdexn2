import React from 'react';
import styled from 'styled-components';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

import AchievementBadge from '../../shared/components/gamification/AchievementBadge';
import Card from '../../shared/components/cards/Card';
import Text from '../../shared/components/typography/Text';
import Heading from '../../shared/components/typography/Heading';
import FlexBox from '../../shared/components/layout/FlexBox';
import ProgressBar from '../../shared/components/feedback/ProgressBar';
import theme from '../styles/theme';
import { 
  Achievement, 
  AchievementProgress,
  AchievementCategory,
  AchievementLevel 
} from '../../common/interfaces/gamification.interface';

// Default size for achievement badges
const DEFAULT_BADGE_SIZE = 'medium';

// Styled components
const AchievementCard = styled(Card)`
  margin-bottom: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
`;

const AchievementContent = styled(FlexBox)`
  width: 100%;
  align-items: center;
`;

const BadgeContainer = styled.div`
  margin-right: ${theme.spacing.md};
  flex-shrink: 0;
`;

const DetailsContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

const StatusContainer = styled.div`
  margin-left: ${theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CompletedIcon = styled(CheckCircleIcon)`
  width: 24px;
  height: 24px;
  color: ${theme.colors.semantic.success};
`;

export interface AchievementItemProps {
  achievement: Achievement;
  progress: AchievementProgress;
  onClick?: () => void;
}

/**
 * Component that renders an individual achievement item with badge, name, description, and progress
 * 
 * Displays an achievement with its visual badge, details, and current progress status.
 * Shows a progress bar for incomplete achievements and a check icon for completed ones.
 * Can be made interactive to view achievement details when clicked.
 */
const AchievementItem: React.FC<AchievementItemProps> = ({ 
  achievement, 
  progress, 
  onClick 
}) => {
  // Determine if the achievement is earned
  const isEarned = progress ? progress.isCompleted : false;
  
  // Calculate progress percentage for progress bar
  const progressPercentage = progress ? progress.progressPercentage : 0;

  return (
    <AchievementCard onClick={onClick}>
      <AchievementContent>
        <BadgeContainer>
          <AchievementBadge 
            category={achievement.category}
            level={achievement.level}
            size={DEFAULT_BADGE_SIZE}
            isEarned={isEarned}
          />
        </BadgeContainer>
        
        <DetailsContainer>
          <Heading level={5} noMargin>
            {achievement.name}
          </Heading>
          <Text variant="bodySmall" noMargin>
            {achievement.description}
          </Text>
          
          {!isEarned && progress && (
            <ProgressBar 
              value={progressPercentage}
              size="small"
              showLabel
              label={`${progress.currentValue}/${progress.targetValue}`}
            />
          )}
        </DetailsContainer>
        
        {isEarned && (
          <StatusContainer>
            <CompletedIcon />
          </StatusContainer>
        )}
      </AchievementContent>
    </AchievementCard>
  );
};

export default AchievementItem;