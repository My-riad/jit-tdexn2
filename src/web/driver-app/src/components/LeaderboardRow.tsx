import React from 'react';
import styled from 'styled-components/native';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline'; // v2.0.13
import { LeaderboardEntry } from '../../../common/interfaces/gamification.interface';
import theme from '../styles/theme';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  onPress: (entry: LeaderboardEntry) => void;
  style?: object;
}

// Colors for top three ranks in the leaderboard
const RANK_COLORS: Record<number, string> = {
  1: theme.colors.semantic.gold,
  2: theme.colors.semantic.silver,
  3: theme.colors.semantic.bronze
};

// Container for the entire row, highlighting if current driver
const Container = styled(TouchableOpacity)<{ isCurrentDriver: boolean }>`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.md};
  background-color: ${props => props.isCurrentDriver ? theme.colors.background.accent : theme.colors.background.card};
  border-radius: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
`;

// Container for the rank number with special styling for top 3
const RankContainer = styled(View)<{ rank: number }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.rank <= 3 ? RANK_COLORS[props.rank] : theme.colors.background.secondary};
  justify-content: center;
  align-items: center;
`;

// Text for rank number with special styling for top 3
const RankText = styled(Text)<{ rank: number }>`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.rank <= 3 ? theme.colors.text.inverted : theme.colors.text.primary};
`;

// Container for driver name and score
const DriverInfoContainer = styled(View)`
  flex: 1;
  margin-left: ${theme.spacing.md};
`;

// Driver name text with special styling for current driver
const DriverName = styled(Text)<{ isCurrentDriver: boolean }>`
  font-size: 16px;
  font-weight: ${props => props.isCurrentDriver ? 'bold' : 'normal'};
  color: ${props => props.isCurrentDriver ? theme.colors.text.accent : theme.colors.text.primary};
`;

// Text for driver score
const ScoreText = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs};
`;

// Container for meta information (rank change and bonus)
const MetaContainer = styled(View)`
  align-items: flex-end;
`;

// Container for rank change indicator
const RankChangeContainer = styled(View)`
  flex-direction: row;
  align-items: center;
`;

// Text for rank change with color based on direction
const RankChangeText = styled(Text)<{ direction: 'up' | 'down' | 'same' }>`
  font-size: 12px;
  margin-left: ${theme.spacing.xs};
  color: ${props => 
    props.direction === 'up' 
      ? theme.colors.semantic.success 
      : props.direction === 'down' 
        ? theme.colors.semantic.error 
        : theme.colors.text.tertiary
  };
`;

// Text for bonus amount
const BonusText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.semantic.success};
  margin-top: ${theme.spacing.xs};
`;

// Container for rank change icon
const IconContainer = styled(View)`
  width: 16px;
  height: 16px;
`;

/**
 * Helper function to format currency values
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * A component that displays a single row in a leaderboard for the driver mobile application
 */
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, onPress, style }) => {
  // Calculate rank change from previous position
  const rankChange = entry.previousRank - entry.rank;
  
  // Determine rank change direction
  let rankChangeDirection: 'up' | 'down' | 'same' = 'same';
  if (rankChange > 0) {
    rankChangeDirection = 'up';
  } else if (rankChange < 0) {
    rankChangeDirection = 'down';
  }
  
  // Choose the appropriate icon based on rank change
  let RankChangeIcon = MinusIcon;
  if (rankChangeDirection === 'up') {
    RankChangeIcon = ArrowUpIcon;
  } else if (rankChangeDirection === 'down') {
    RankChangeIcon = ArrowDownIcon;
  }
  
  return (
    <Container 
      isCurrentDriver={entry.isCurrentDriver}
      onPress={() => onPress(entry)}
      style={style}
    >
      <RankContainer rank={entry.rank}>
        <RankText rank={entry.rank}>{entry.rank}</RankText>
      </RankContainer>
      
      <DriverInfoContainer>
        <DriverName isCurrentDriver={entry.isCurrentDriver}>
          {entry.driverName}
        </DriverName>
        <ScoreText>Score: {entry.score}</ScoreText>
      </DriverInfoContainer>
      
      <MetaContainer>
        <RankChangeContainer>
          <IconContainer>
            <RankChangeIcon 
              color={
                rankChangeDirection === 'up'
                  ? theme.colors.semantic.success
                  : rankChangeDirection === 'down'
                    ? theme.colors.semantic.error
                    : theme.colors.text.tertiary
              }
              width={16}
              height={16}
            />
          </IconContainer>
          <RankChangeText direction={rankChangeDirection}>
            {rankChange !== 0 ? Math.abs(rankChange) : '-'}
          </RankChangeText>
        </RankChangeContainer>
        
        {entry.bonusAmount > 0 && (
          <BonusText>{formatCurrency(entry.bonusAmount)}</BonusText>
        )}
      </MetaContainer>
    </Container>
  );
};

export default LeaderboardRow;