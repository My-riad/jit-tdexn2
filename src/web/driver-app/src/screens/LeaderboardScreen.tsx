import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native'; // React Native components v0.71.8
import { useDispatch, useSelector } from 'react-redux'; // Redux hooks v8.0.5
import { useNavigation, useRoute } from '@react-navigation/native'; // React Navigation hooks v6.1.6
import styled from 'styled-components/native'; // Styled components for React Native styling v5.3.10

import LeaderboardRow from '../components/LeaderboardRow';
import theme from '../styles/theme';
import { ProfileNavigationProp, ProfileRouteProp } from '../navigation/types';
import { LeaderboardEntry, LeaderboardTimeframe } from '../../../common/interfaces/gamification.interface';
import { useAuth } from '../../../common/hooks/useAuth';
// Constants for timeframe and region options
const TIMEFRAMES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'allTime', label: 'All Time' },
];

const REGIONS = [
  { id: 'all', label: 'All Regions' },
  { id: 'midwest', label: 'Midwest' },
  { id: 'northeast', label: 'Northeast' },
  { id: 'southeast', label: 'Southeast' },
  { id: 'southwest', label: 'Southwest' },
  { id: 'west', label: 'West' },
];

// Styled components for consistent styling
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.primary};
`;

const Header = styled(View)`
  padding: ${theme.spacing.md};
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm};
`;

const Subtitle = styled(Text)`
  font-size: 16px;
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md};
`;

const FilterContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.background.secondary};
`;

const TimeframeButton = styled(TouchableOpacity)<{ selected: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.spacing.sm};
  background-color: ${props => props.selected ? theme.colors.primary.main : theme.colors.background.card};
  margin-right: ${theme.spacing.sm};
`;

const TimeframeButtonText = styled(Text)<{ selected: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
  color: ${props => props.selected ? theme.colors.text.inverted : theme.colors.text.primary};
`;

const RegionSelector = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.spacing.sm};
  background-color: ${theme.colors.background.card};
`;

const RegionText = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.primary};
  margin-right: ${theme.spacing.sm};
`;

const ListContainer = styled(View)`
  flex: 1;
  padding: ${theme.spacing.sm};
`;

const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
`;

const EmptyStateText = styled(Text)`
  font-size: 16px;
  color: ${theme.colors.text.secondary};
  text-align: center;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Separator = styled(View)`
  height: ${theme.spacing.sm};
`;

interface Props {
  navigation: ProfileNavigationProp;
  route: ProfileRouteProp<'Leaderboard'>;
}

/**
 * Screen component that displays driver leaderboards with filtering options
 */
const LeaderboardScreen: React.FC<Props> = ({ navigation, route }) => {
  // Get navigation and route objects using React Navigation hooks
  const { navigate } = useNavigation<ProfileNavigationProp>();
  const { params } = useRoute<ProfileRouteProp<'Leaderboard'>>();

  // Extract timeframe and region parameters from route.params
  const initialTimeframe = (params?.timeframe || 'weekly') as LeaderboardTimeframe;
  const initialRegion = params?.region || 'all';

  // Get current user information using useAuth hook
  const { authState } = useAuth();
  const currentDriverId = authState.user?.driverId;

  // Set up state for leaderboard entries, loading state, selected timeframe, and selected region
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<LeaderboardTimeframe>(initialTimeframe);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  // Use useSelector to get leaderboard data from Redux store
  // TODO: Implement Redux store for leaderboard data

  /**
   * Function to fetch leaderboard data based on selected filters
   */
  const fetchLeaderboardData = useCallback(async (timeframe: string, region: string) => {
    setLoading(true);
    try {
      // Determine the leaderboard type (default to EFFICIENCY)
      const leaderboardType = 'EFFICIENCY'; // TODO: Implement dynamic leaderboard type selection

      // TODO: Call gamificationApi.getCurrentLeaderboards to get active leaderboards
      // TODO: Find the appropriate leaderboard based on timeframe and region
      // TODO: If leaderboard is found, fetch entries using gamificationApi.getLeaderboardEntries
      const mockLeaderboardEntries: LeaderboardEntry[] = [
        { id: '1', leaderboardId: 'lb1', driverId: 'd1', driverName: 'Driver 1', rank: 1, previousRank: 2, score: 95, bonusAmount: 500, isCurrentDriver: false },
        { id: '2', leaderboardId: 'lb1', driverId: 'd2', driverName: 'Driver 2', rank: 2, previousRank: 1, score: 92, bonusAmount: 400, isCurrentDriver: false },
        { id: '3', leaderboardId: 'lb1', driverId: 'd3', driverName: 'Driver 3', rank: 3, previousRank: 3, score: 89, bonusAmount: 300, isCurrentDriver: false },
        { id: '4', leaderboardId: 'lb1', driverId: 'd4', driverName: 'Driver 4', rank: 4, previousRank: 5, score: 85, bonusAmount: 200, isCurrentDriver: false },
        { id: '5', leaderboardId: 'lb1', driverId: 'd5', driverName: 'Driver 5', rank: 5, previousRank: 4, score: 82, bonusAmount: 100, isCurrentDriver: false },
      ];

      // Process entries to mark the current driver's entry
      const processedEntries = mockLeaderboardEntries.map(entry => ({
        ...entry,
        isCurrentDriver: entry.driverId === currentDriverId,
      }));

      // Update state with the fetched entries
      setLeaderboardEntries(processedEntries);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // TODO: Handle any errors and set loading state to false
    } finally {
      setLoading(false);
    }
  }, [currentDriverId]);

  /**
   * Function to handle pull-to-refresh action
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeaderboardData(selectedTimeframe, selectedRegion);
    setRefreshing(false);
  }, [fetchLeaderboardData, selectedTimeframe, selectedRegion]);

  /**
   * Function to handle press on a leaderboard entry
   */
  const handleEntryPress = useCallback((entry: LeaderboardEntry) => {
    if (entry.isCurrentDriver) {
      navigate('ProfileMain');
    } else {
      // TODO: Show driver details in a modal or navigate to driver profile view
      console.log('Navigate to driver profile or show details for:', entry.driverName);
    }
  }, [navigate]);

  /**
   * Function to render a leaderboard entry item
   */
  const renderLeaderboardEntry = useCallback(({ item }: { item: LeaderboardEntry }) => (
    <LeaderboardRow entry={item} onPress={handleEntryPress} />
  ), [handleEntryPress]);

  /**
   * Function to render timeframe selection buttons
   */
  const renderTimeframeSelector = useCallback(() => (
    <View style={{ flexDirection: 'row' }}>
      {TIMEFRAMES.map(timeframe => (
        <TimeframeButton
          key={timeframe.id}
          selected={selectedTimeframe === timeframe.id}
          onPress={() => {
            setSelectedTimeframe(timeframe.id as LeaderboardTimeframe);
            fetchLeaderboardData(timeframe.id, selectedRegion);
          }}
        >
          <TimeframeButtonText selected={selectedTimeframe === timeframe.id}>
            {timeframe.label}
          </TimeframeButtonText>
        </TimeframeButton>
      ))}
    </View>
  ), [selectedTimeframe, selectedRegion, fetchLeaderboardData]);

  /**
   * Function to render region selection dropdown
   */
  const renderRegionSelector = useCallback(() => (
    <RegionSelector onPress={() => {
      // TODO: Implement region selection dropdown or modal
      console.log('Open region selector');
    }}>
      <RegionText>{REGIONS.find(r => r.id === selectedRegion)?.label}</RegionText>
      {/* TODO: Add dropdown icon */}
    </RegionSelector>
  ), [selectedRegion]);

  // Use useEffect to fetch leaderboard data when component mounts or filters change
  useEffect(() => {
    fetchLeaderboardData(selectedTimeframe, selectedRegion);
  }, [fetchLeaderboardData, selectedTimeframe, selectedRegion]);

  return (
    <Container>
      <Header>
        <Title>Leaderboard</Title>
        <Subtitle>See how you rank against other drivers</Subtitle>
      </Header>

      <FilterContainer>
        {renderTimeframeSelector()}
        {renderRegionSelector()}
      </FilterContainer>

      {loading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </LoadingContainer>
      ) : (
        <ListContainer>
          {leaderboardEntries.length > 0 ? (
            <FlatList
              data={leaderboardEntries}
              renderItem={renderLeaderboardEntry}
              keyExtractor={item => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary.main]}
                />
              }
              ListEmptyComponent={() => (
                <EmptyStateContainer>
                  <EmptyStateText>No leaderboard entries found for the selected filters.</EmptyStateText>
                </EmptyStateContainer>
              )}
              ItemSeparatorComponent={() => <Separator />}
            />
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No leaderboard entries found.</EmptyStateText>
            </EmptyStateContainer>
          )}
        </ListContainer>
      )}
    </Container>
  );
};

export default LeaderboardScreen;