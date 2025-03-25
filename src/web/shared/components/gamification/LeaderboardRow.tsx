import React from 'react';
import styled from 'styled-components';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import FlexBox from '../layout/FlexBox';
import Text from '../typography/Text';
import { LeaderboardEntry } from '../../../common/interfaces/gamification.interface';

// Props interface for the LeaderboardRow component
interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  onClick: (entry: LeaderboardEntry) => void;
  className?: string;
}

// Colors for top three ranks in the leaderboard
const RANK_COLORS: Record<number, string> = {
  1: 'theme.colors.semantic.gold',
  2: 'theme.colors.semantic.silver',
  3: 'theme.colors.semantic.bronze'
};

// The main container for the leaderboard row
const RowContainer = styled.div<{ isCurrentDriver: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  background-color: ${({ theme, isCurrentDriver }) => 
    isCurrentDriver ? theme.colors.background.accent : theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

// Container for the rank number
const RankContainer = styled.div<{ rank: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ theme, rank }) => {
    if (rank === 1) return theme.colors.semantic.warning; // Gold
    if (rank === 2) return theme.colors.text.secondary;   // Silver
    if (rank === 3) return theme.colors.semantic.error;   // Bronze
    return theme.colors.background.tertiary;
  }};
  color: ${({ theme, rank }) => rank <= 3 ? theme.colors.text.inverted : theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  font-size: ${({ theme }) => theme.fonts.size.md};
`;

// Container for the driver name and score
const DriverInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

// Container for the score display
const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing.md};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  font-size: ${({ theme }) => theme.fonts.size.md};
`;

// Container for the rank change indicator
const RankChangeContainer = styled.div<{ direction: 'up' | 'down' | 'same' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  color: ${({ theme, direction }) => 
    direction === 'up' 
      ? theme.colors.semantic.success 
      : direction === 'down' 
        ? theme.colors.semantic.error 
        : theme.colors.text.tertiary};
  font-size: ${({ theme }) => theme.fonts.size.xs};
`;

// Container for the bonus amount
const BonusContainer = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.semantic.success};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  font-size: ${({ theme }) => theme.fonts.size.sm};
`;

// Container for the rank change and bonus
const MetaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};
`;

// Styled component for the driver name
const DriverName = styled(Text)<{ isCurrentDriver: boolean }>`
  font-weight: ${({ theme, isCurrentDriver }) => 
    isCurrentDriver ? theme.fonts.weight.bold : theme.fonts.weight.regular};
  color: ${({ theme, isCurrentDriver }) => 
    isCurrentDriver ? theme.colors.text.accent : theme.colors.text.primary};
`;

// Wrapper for rank change icons
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
`;

// Helper function to format currency values
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// A component that displays a single row in a leaderboard
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, onClick, className }) => {
  // Calculate rank change from previous rank
  const rankChange = entry.previousRank - entry.rank;
  
  // Determine appropriate rank change icon and color
  let rankChangeDirection: 'up' | 'down' | 'same' = 'same';
  let RankChangeIcon = MinusIcon;
  
  if (rankChange > 0) {
    rankChangeDirection = 'up';
    RankChangeIcon = ArrowUpIcon;
  } else if (rankChange < 0) {
    rankChangeDirection = 'down';
    RankChangeIcon = ArrowDownIcon;
  }
  
  return (
    <RowContainer 
      isCurrentDriver={entry.isCurrentDriver}
      onClick={() => onClick(entry)}
      className={className}
    >
      <FlexBox alignItems="center">
        <RankContainer rank={entry.rank}>
          {entry.rank}
        </RankContainer>
        
        <DriverInfoContainer>
          <DriverName 
            isCurrentDriver={entry.isCurrentDriver}
            variant="bodyRegular"
            noMargin
          >
            {entry.driverName}
          </DriverName>
          
          <Text variant="bodySmall" noMargin>
            Score: {entry.score}
          </Text>
        </DriverInfoContainer>
      </FlexBox>
      
      <MetaContainer>
        <RankChangeContainer direction={rankChangeDirection}>
          <IconWrapper>
            <RankChangeIcon />
          </IconWrapper>
          <span>{Math.abs(rankChange) || '-'}</span>
        </RankChangeContainer>
        
        {entry.bonusAmount > 0 && (
          <BonusContainer>
            {formatCurrency(entry.bonusAmount)}
          </BonusContainer>
        )}
      </MetaContainer>
    </RowContainer>
  );
};

export default LeaderboardRow;