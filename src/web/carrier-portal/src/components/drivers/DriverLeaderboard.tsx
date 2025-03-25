# src/web/carrier-portal/src/components/drivers/DriverLeaderboard.tsx
```typescript
import React, { useEffect, useState, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import LeaderboardRow from '../../../shared/components/gamification/LeaderboardRow';
import Card from '../../../shared/components/cards/Card';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import Select from '../../../shared/components/forms/Select';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import {
  LeaderboardEntry,
  LeaderboardTimeframe
} from '../../../common/interfaces/gamification.interface';
import { fetchDriverLeaderboard } from '../../store/actions/driverActions';
import { useAppDispatch, useAppSelector } from '../../store';

// Options for the timeframe selector dropdown
const TIMEFRAME_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
];

// Interface defining the props for the DriverLeaderboard component
interface DriverLeaderboardProps {
  title: string;
  subtitle: string;
  limit: number;
  className?: string;
  onDriverClick: (entry: LeaderboardEntry) => void;
  onViewAllClick: () => void;
}

// The main container for the leaderboard
const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

// Header section of the leaderboard
const LeaderboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

// Left section of the header containing title and subtitle
const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
`;

// Right section of the header containing the timeframe selector
const HeaderRight = styled.div`
  width: 150px;
`;

// Body section containing the leaderboard rows
const LeaderboardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// Message displayed when no entries are available
const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

// Link to view all leaderboard entries
const ViewAllLink = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  color: ${props => props.theme.colors.primary.main};
  cursor: pointer;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary.dark};
  }
`;

// A component that displays a leaderboard of drivers ranked by their efficiency scores
const DriverLeaderboard: React.FC<DriverLeaderboardProps> = ({
  title,
  subtitle,
  limit,
  className,
  onDriverClick,
  onViewAllClick
}) => {
  // Initialize state for selected timeframe with default WEEKLY
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>(LeaderboardTimeframe.WEEKLY);

  // Get Redux dispatch function
  const dispatch = useAppDispatch();

  // Select leaderboard entries, loading state, and error from Redux store
  const { entries, loadingLeaderboard, leaderboardError } = useAppSelector(state => state.driver);

  // Fetch leaderboard data on component mount and when timeframe changes
  useEffect(() => {
    dispatch(fetchDriverLeaderboard({ timeframe: selectedTimeframe }));
  }, [dispatch, selectedTimeframe]);

  // Define handler for timeframe selection change
  const handleTimeframeChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeframe(event.target.value as LeaderboardTimeframe);
  }, []);

  // Define handler for leaderboard row click
  const handleRowClick = useCallback((entry: LeaderboardEntry) => {
    onDriverClick(entry);
  }, [onDriverClick]);

  // Render Card component with appropriate styling
  return (
    <Card className={className}>
      <LeaderboardContainer>
        <LeaderboardHeader>
          <HeaderLeft>
            <Heading level={3} noMargin>
              {title}
            </Heading>
            <Text variant="bodySmall" noMargin>
              {subtitle}
            </Text>
          </HeaderLeft>
          <HeaderRight>
            <Select
              name="timeframe"
              options={TIMEFRAME_OPTIONS}
              value={selectedTimeframe}
              onChange={handleTimeframeChange}
              label="Timeframe"
            />
          </HeaderRight>
        </LeaderboardHeader>

        {/* Render loading indicator when data is being fetched */}
        {loadingLeaderboard && <LoadingIndicator />}

        {/* Render error message if fetch failed */}
        {leaderboardError && <Text color="error">{leaderboardError}</Text>}

        {/* Render empty state message if no entries are available */}
        {!loadingLeaderboard && !leaderboardError && entries.length === 0 && (
          <EmptyState>No entries available for the selected timeframe.</EmptyState>
        )}

        {/* Render leaderboard rows for each entry, limited by the limit prop */}
        <LeaderboardBody>
          {entries.slice(0, limit).map(entry => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              onClick={handleRowClick}
            />
          ))}
        </LeaderboardBody>

        {/* Render view all link if entries exceed the limit */}
        {entries.length > limit && (
          <ViewAllLink onClick={onViewAllClick}>
            View All
          </ViewAllLink>
        )}
      </LeaderboardContainer>
    </Card>
  );
};

export default DriverLeaderboard;