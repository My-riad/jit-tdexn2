import React, { useEffect, useState, useCallback } from 'react'; // version ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; // version ^8.0.5
import styled from 'styled-components/native'; // version ^5.3.10
import { View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'; // version ^0.71.8
import { Text } from 'react-native'; // version ^0.71.8
import { SafeAreaView } from 'react-native-safe-area-context'; // version ^4.5.3
import { useFocusEffect } from '@react-navigation/native'; // version ^6.1.6

import EarningsSummary from '../components/EarningsSummary';
import WeeklyEarningsChart from '../components/WeeklyEarningsChart';
import LeaderboardRow from '../components/LeaderboardRow';
import AchievementItem from '../components/AchievementItem';
import theme from '../styles/theme';
import { fetchDriverEarnings, fetchEarningsHistory } from '../store/actions/earningsActions';
import { DisplayMode } from '../store/reducers/earningsReducer';
import { ProfileNavigationProp } from '../navigation/types';
import { LeaderboardEntry, Achievement, AchievementProgress } from '../../common/interfaces/gamification.interface';

/**
 * @interface EarningsScreenProps
 * @description Interface defining the props for the EarningsScreen component.
 */
interface EarningsScreenProps {
  navigation: ProfileNavigationProp['navigation'];
}

/**
 * @interface TabData
 * @description Interface defining the structure for tab data.
 */
interface TabData {
  id: string;
  label: string;
}

/**
 * @constant TABS
 * @description Tab options for switching between leaderboard and achievements views.
 */
const TABS: TabData[] = [
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'achievements', label: 'Achievements' },
];

/**
 * @constant MAX_LEADERBOARD_ENTRIES
 * @description Maximum number of leaderboard entries to display in the summary view.
 */
const MAX_LEADERBOARD_ENTRIES = 5;

/**
 * @constant MAX_ACHIEVEMENTS
 * @description Maximum number of achievements to display in the summary view.
 */
const MAX_ACHIEVEMENTS = 3;

/**
 * @styledcomponent Container
 * @description Styled SafeAreaView component for the main container.
 */
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.main};
`;

/**
 * @styledcomponent Content
 * @description Styled ScrollView component for the content area.
 */
const Content = styled(ScrollView)`
  flex: 1;
`;

/**
 * @styledcomponent Section
 * @description Styled View component for a section.
 */
const Section = styled(View)`
  margin-bottom: ${theme.spacing.lg};
`;

/**
 * @styledcomponent SectionHeader
 * @description Styled View component for a section header.
 */
const SectionHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.sm};
`;

/**
 * @styledcomponent SectionTitle
 * @description Styled Text component for a section title.
 */
const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * @styledcomponent ViewAllButton
 * @description Styled TouchableOpacity component for a view all button.
 */
const ViewAllButton = styled(TouchableOpacity)``;

/**
 * @styledcomponent ViewAllText
 * @description Styled Text component for a view all text.
 */
const ViewAllText = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.primary.main};
`;

/**
 * @styledcomponent TabContainer
 * @description Styled View component for the tab container.
 */
const TabContainer = styled(View)`
  flex-direction: row;
  margin-bottom: ${theme.spacing.md};
  padding: 0 ${theme.spacing.md};
`;

/**
 * @styledcomponent Tab
 * @description Styled TouchableOpacity component for a tab.
 */
const Tab = styled(TouchableOpacity)<{ active: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  margin-right: ${theme.spacing.sm};
  border-radius: ${theme.spacing.sm};
  background-color: ${props => props.active ? theme.colors.primary.main : theme.colors.background.secondary};
`;

/**
 * @styledcomponent TabText
 * @description Styled Text component for a tab text.
 */
const TabText = styled(Text)<{ active: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : 'normal'};
  color: ${props => props.active ? theme.colors.text.white : theme.colors.text.secondary};
`;

/**
 * @styledcomponent LeaderboardContainer
 * @description Styled View component for the leaderboard container.
 */
const LeaderboardContainer = styled(View)`
  padding: 0 ${theme.spacing.md};
`;

/**
 * @styledcomponent AchievementsContainer
 * @description Styled View component for the achievements container.
 */
const AchievementsContainer = styled(View)`
  padding: 0 ${theme.spacing.md};
`;

/**
 * @styledcomponent LoadingContainer
 * @description Styled View component for the loading container.
 */
const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
`;

/**
 * @styledcomponent ErrorContainer
 * @description Styled View component for the error container.
 */
const ErrorContainer = styled(View)`
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.error.light};
  border-radius: ${theme.spacing.sm};
  margin: ${theme.spacing.md};
`;

/**
 * @styledcomponent ErrorText
 * @description Styled Text component for the error text.
 */
const ErrorText = styled(Text)`
  color: ${theme.colors.error.main};
  font-size: 14px;
`;

/**
 * @styledcomponent EmptyContainer
 * @description Styled View component for the empty container.
 */
const EmptyContainer = styled(View)`
  padding: ${theme.spacing.xl};
  align-items: center;
  justify-content: center;
`;

/**
 * @styledcomponent EmptyText
 * @description Styled Text component for the empty text.
 */
const EmptyText = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 16px;
  text-align: center;
`;

/**
 * @function EarningsScreen
 * @param {EarningsScreenProps} props - The props for the component.
 * @returns {JSX.Element} - The rendered EarningsScreen component.
 * @description Screen component that displays driver earnings information, leaderboard, and achievements
 */
const EarningsScreen: React.FC<EarningsScreenProps> = ({ navigation }) => {
  // Extract navigation prop from component props
  
  // Use useSelector to get auth state to get current user ID
  const auth = useSelector((state: any) => state.auth);
  const driverId = auth.user?.driverId;

  // Use useSelector to get earnings data from Redux store
  const earnings = useSelector((state: any) => state.earnings.earnings);

  // Use useSelector to get earnings history from Redux store
  const earningsHistory = useSelector((state: any) => state.earnings.earningsHistory);

  // Use useSelector to get leaderboard data from Redux store
  const leaderboard = useSelector((state: any) => state.leaderboard.entries) as LeaderboardEntry[];

  // Use useSelector to get achievements data from Redux store
  const achievements = useSelector((state: any) => state.achievements.achievements) as Achievement[];
  const achievementProgress = useSelector((state: any) => state.achievements.progress) as AchievementProgress[];

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Use useState to manage refreshing state
  const [refreshing, setRefreshing] = useState(false);

  // Use useState to manage active tab state
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  /**
   * @function onRefresh
   * @description Function to handle refresh action.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (driverId) {
      dispatch(fetchDriverEarnings(driverId)).then(() => setRefreshing(false));
      dispatch(fetchEarningsHistory(driverId)).then(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [dispatch, driverId]);

  // Use useFocusEffect to fetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (driverId) {
        dispatch(fetchDriverEarnings(driverId));
        dispatch(fetchEarningsHistory(driverId));
      }
    }, [dispatch, driverId])
  );

  /**
   * @function navigateToFullLeaderboard
   * @description Define a function to navigate to the full leaderboard screen.
   */
  const navigateToFullLeaderboard = useCallback(() => {
    navigation.navigate('Leaderboard', { timeframe: 'weekly', region: 'Midwest' });
  }, [navigation]);

  /**
   * @function navigateToAchievements
   * @description Define a function to navigate to the achievements screen.
   */
  const navigateToAchievements = useCallback(() => {
    navigation.navigate('Achievements');
  }, [navigation]);

  /**
   * @function handleLeaderboardEntryPress
   * @description Define a function to handle leaderboard entry press.
   */
  const handleLeaderboardEntryPress = useCallback((entry: LeaderboardEntry) => {
    // Implement navigation or action for leaderboard entry press
    console.log('Leaderboard entry pressed:', entry);
  }, []);

  /**
   * @function handleAchievementItemPress
   * @description Define a function to handle achievement item press.
   */
  const handleAchievementItemPress = useCallback((achievement: Achievement) => {
    // Implement navigation or action for achievement item press
    console.log('Achievement item pressed:', achievement);
  }, []);

  // Render a SafeAreaView as the main container
  return (
    <Container>
      {/* Render a ScrollView with RefreshControl for pull-to-refresh */}
      <Content
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Render EarningsSummary component at the top */}
        <Section>
          <EarningsSummary driverId={driverId} />
        </Section>

        {/* Render WeeklyEarningsChart component to visualize earnings history */}
        <Section>
          <WeeklyEarningsChart driverId={driverId} />
        </Section>

        {/* Render tab navigation for switching between Leaderboard and Achievements */}
        <TabContainer>
          {TABS.map(tab => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            >
              <TabText active={activeTab === tab.id}>{tab.label}</TabText>
            </Tab>
          ))}
        </TabContainer>

        {/* If Leaderboard tab is active, render leaderboard section with top entries */}
        {activeTab === 'leaderboard' && (
          <Section>
            <SectionHeader>
              <SectionTitle>Top {MAX_LEADERBOARD_ENTRIES} Drivers</SectionTitle>
              <ViewAllButton onPress={navigateToFullLeaderboard}>
                <ViewAllText>View All</ViewAllText>
              </ViewAllButton>
            </SectionHeader>
            <LeaderboardContainer>
              {leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES).map(entry => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  onPress={handleLeaderboardEntryPress}
                />
              ))}
            </LeaderboardContainer>
          </Section>
        )}

        {/* If Achievements tab is active, render achievements section with recent or highlighted achievements */}
        {activeTab === 'achievements' && (
          <Section>
            <SectionHeader>
              <SectionTitle>Recent Achievements</SectionTitle>
              <ViewAllButton onPress={navigateToAchievements}>
                <ViewAllText>View All</ViewAllText>
              </ViewAllButton>
            </SectionHeader>
            <AchievementsContainer>
              {achievements.slice(0, MAX_ACHIEVEMENTS).map(achievement => {
                const progress = achievementProgress.find(p => p.achievementId === achievement.id);
                return (
                  <AchievementItem
                    key={achievement.id}
                    achievement={achievement}
                    progress={progress}
                    onPress={() => handleAchievementItemPress(achievement)}
                  />
                );
              })}
            </AchievementsContainer>
          </Section>
        )}
      </Content>
    </Container>
  );
};

export default EarningsScreen;