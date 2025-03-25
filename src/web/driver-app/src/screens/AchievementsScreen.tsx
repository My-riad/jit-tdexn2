import React, { useEffect, useState, useCallback } from 'react'; // React core and hooks for component functionality // version ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; // Redux hooks for accessing state and dispatching actions // version ^8.0.5
import { useNavigation } from '@react-navigation/native'; // Navigation hook for screen navigation // version ^6.1.6
import styled from 'styled-components'; // CSS-in-JS styling solution // version ^5.3.6
import { FlatList, RefreshControl } from 'react-native'; // React Native components for list rendering and pull-to-refresh // version ^0.71.8

import AchievementItem from '../components/AchievementItem'; // Component for displaying individual achievement items
import LoadingIndicator from '../../shared/components/feedback/LoadingIndicator'; // Loading indicator component for async operations
import Alert from '../../shared/components/feedback/Alert'; // Alert component for displaying error messages
import Tabs from '../../shared/components/navigation/Tabs'; // Tabs component for categorizing achievements
import Container from '../../shared/components/layout/Container'; // Container component for layout structure
import Heading from '../../shared/components/typography/Heading'; // Heading component for section titles
import Text from '../../shared/components/typography/Text'; // Text component for descriptions and messages
import theme from '../styles/theme'; // Theme variables for consistent styling
import { 
  Achievement, 
  AchievementProgress, 
  AchievementCategory 
} from '../../common/interfaces/gamification.interface'; // TypeScript interfaces for achievement data
import { ProfileNavigationProp } from '../navigation/types'; // Navigation prop type for the profile stack navigator
import gamificationApi from '../../common/api/gamificationApi'; // API client for gamification-related operations

// Styled components for consistent styling
const ScreenContainer = styled(Container)`
  flex: 1;
  background-color: ${theme.colors.background.primary};
  padding: ${theme.spacing.md};
`;

const HeaderContainer = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding-top: ${theme.spacing.sm};
`;

const TabsContainer = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const AchievementsList = styled(FlatList)`
  flex: 1;
`;

const EmptyStateContainer = styled.div`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
`;

const EmptyStateText = styled(Text)`
  text-align: center;
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.md};
`;

// Constant for the 'all' category tab
const CATEGORY_ALL = 'all';

// Combined type for an achievement with its progress data
interface AchievementWithProgress {
  Achievement: Achievement;
  progress: AchievementProgress | null;
}

/**
 * Screen component that displays a driver's achievements and progress
 */
const AchievementsScreen: React.FC = () => {
  // Get navigation prop using useNavigation hook
  const navigation = useNavigation<ProfileNavigationProp>();

  // Get driver ID from Redux state using useSelector
  const driverId = useSelector((state: any) => state.auth.user?.driverId);

  // Initialize state for achievements, progress, loading, error, and selected category
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_ALL);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Create fetchAchievements function using useCallback to load achievements and progress data
  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all achievements and achievement progress data
      const [achievementsData, progressData] = await Promise.all([
        gamificationApi.getAllAchievements(),
        gamificationApi.getAchievementProgress(driverId)
      ]);
      setAchievements(achievementsData);
      setAchievementProgress(progressData);
    } catch (e: any) {
      // Handle errors during data fetching
      setError(e.message || 'Failed to load achievements.');
      console.error('Error fetching achievements:', e);
    } finally {
      // Set loading to false after data is fetched or error occurs
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId]);

  // Use useEffect to call fetchAchievements on component mount
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Create getAchievementsByCategory function to filter achievements by category
  const getAchievementsByCategory = useCallback((category: string): AchievementWithProgress[] => {
    if (category === CATEGORY_ALL) {
      // If category is 'all', return all achievements with their progress
      return achievements.map(achievement => ({
        Achievement: achievement,
        progress: achievementProgress.find(p => p.achievementId === achievement.id) || null
      }));
    } else {
      // If category is specific, filter achievements by category and include their progress
      return achievements
        .filter(achievement => achievement.category === category)
        .map(achievement => ({
          Achievement: achievement,
          progress: achievementProgress.find(p => p.achievementId === achievement.id) || null
        }));
    }
  }, [achievements, achievementProgress]);

  // Create handleRefresh function to handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAchievements();
  }, [fetchAchievements]);

  // Create handleCategoryChange function to handle tab selection
  const handleCategoryChange = useCallback((tabId: string) => {
    setSelectedCategory(tabId);
  }, []);

  // Create renderAchievementItem function to render individual achievement items
  const renderAchievementItem = useCallback(({ item }: { item: AchievementWithProgress }) => (
    <AchievementItem 
      achievement={item.Achievement} 
      progress={item.progress || undefined}
    />
  ), []);

  // Define tab data for achievement categories
  const tabData = [
    { id: CATEGORY_ALL, label: 'All', content: null },
    { id: AchievementCategory.EFFICIENCY, label: 'Efficiency', content: null },
    { id: AchievementCategory.NETWORK_CONTRIBUTION, label: 'Contribution', content: null },
    { id: AchievementCategory.ON_TIME_DELIVERY, label: 'On Time', content: null },
  ];

  // Render screen with header, tabs for categories, and FlatList of achievements
  return (
    <ScreenContainer>
      <HeaderContainer>
        <Heading level={3}>Achievements</Heading>
        <Text variant="bodySmall">Track your progress and earn rewards!</Text>
      </HeaderContainer>

      <TabsContainer>
        <Tabs 
          tabs={tabData}
          activeTabId={selectedCategory}
          onChange={handleCategoryChange}
        />
      </TabsContainer>

      {loading ? (
        // Show loading indicator when loading
        <LoadingIndicator fullPage={false} />
      ) : error ? (
        // Show error alert if error occurs
        <Alert severity="error" message={error} />
      ) : (
        // Show FlatList of achievements or empty state message
        <AchievementsList
          data={getAchievementsByCategory(selectedCategory)}
          renderItem={renderAchievementItem}
          keyExtractor={item => item.Achievement.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={() => (
            // Show empty state message if no achievements in selected category
            <EmptyStateContainer>
              <Text variant="bodyRegular" align="center">
                No achievements in this category yet. Keep driving and unlock new achievements!
              </Text>
            </EmptyStateContainer>
          )}
        />
      )}
    </ScreenContainer>
  );
};

export default AchievementsScreen;