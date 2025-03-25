import React, { useEffect, useState, useCallback } from 'react'; // version ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // version ^8.0.5
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native'; // version ^0.70.6
import styled from 'styled-components/native'; // version ^5.3.6
import { Ionicons } from '@expo/vector-icons'; // version ^13.0.0

import { LoadCard } from '../components/LoadCard';
import FilterOptions from '../components/FilterOptions';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { LoadRecommendation } from '../../../common/interfaces/load.interface';
import { LoadNavigationProp } from '../navigation/types';
import {
  fetchLoadRecommendations,
  filterRecommendations,
  sortRecommendations,
} from '../store/actions/loadActions';
import { colors } from '../styles/colors';

/**
 * @description Interface defining the props for the LoadListScreen component
 */
interface LoadListScreenProps {
  /**
   * @description Navigation prop for the load stack navigator
   */
  navigation: LoadNavigationProp<'LoadList'>;
}

/**
 * @description Styled component for the main container
 */
const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

/**
 * @description Styled component for the header section
 */
const Header = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

/**
 * @description Styled component for the title text
 */
const Title = styled(Text)`
  font-size: 20px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
`;

/**
 * @description Styled component for the filter button
 */
const FilterButton = styled(TouchableOpacity)`
  padding: 8px;
`;

/**
 * @description Styled component for the empty state container
 */
const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

/**
 * @description Styled component for the empty state text
 */
const EmptyStateText = styled(Text)`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin-top: 12px;
`;

/**
 * @description Styled component for the error container
 */
const ErrorContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

/**
 * @description Styled component for the error text
 */
const ErrorText = styled(Text)`
  font-size: 16px;
  color: ${props => props.theme.colors.error};
  text-align: center;
  margin-top: 12px;
`;

/**
 * @description Styled component for the retry button
 */
const RetryButton = styled(TouchableOpacity)`
  margin-top: 16px;
  padding: 12px 24px;
  background-color: ${props => props.theme.colors.primary.main};
  border-radius: 8px;
`;

/**
 * @description Styled component for the retry button text
 */
const RetryButtonText = styled(Text)`
  color: white;
  font-weight: bold;
`;

/**
 * @description Styled component for the list container
 */
const ListContainer = styled(View)`
  flex: 1;
  padding-horizontal: 16px;
`;

/**
 * @description Screen component that displays a list of recommended loads for the driver
 * @param props - The component props
 * @returns The rendered load list screen
 */
const LoadListScreen: React.FC<LoadListScreenProps> = (props) => {
  // Get the navigation prop from the component props
  const { navigation } = props;

  // Get the Redux dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // Get the current user/driver ID from Redux state using useSelector
  const driverId = useSelector((state: any) => state.auth.user?.id);

  // Get the load recommendations, loading state, and error state from Redux using useSelector
  const recommendations = useSelector((state: any) => state.loads.recommendations);
  const loading = useSelector((state: any) => state.loads.loading);
  const error = useSelector((state: any) => state.loads.error);

  // Initialize state for filter visibility using useState
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Initialize state for favorite loads using useState
  const [favoriteLoads, setFavoriteLoads] = useState<string[]>([]);

  /**
   * @description Function to handle navigating to load details when a load is selected
   */
  const handleLoadPress = useCallback((load: LoadRecommendation) => {
    navigation.navigate('LoadDetail', { loadId: load.loadId, recommendation: load });
  }, [navigation]);

  /**
   * @description Function to toggle the filter visibility
   */
  const toggleFilters = useCallback(() => {
    setFiltersVisible(prev => !prev);
  }, []);

  /**
   * @description Function to toggle a load as favorite
   */
  const toggleFavorite = useCallback((loadId: string) => {
    setFavoriteLoads(prev => {
      if (prev.includes(loadId)) {
        return prev.filter(id => id !== loadId);
      } else {
        return [...prev, loadId];
      }
    });
  }, []);

  /**
   * @description Function to handle pull-to-refresh functionality
   */
  const handleRefresh = useCallback(() => {
    if (driverId) {
      dispatch(fetchLoadRecommendations(driverId));
    }
  }, [dispatch, driverId]);

  // Use useEffect to fetch load recommendations when the component mounts or driverId changes
  useEffect(() => {
    if (driverId) {
      dispatch(fetchLoadRecommendations(driverId));
    }
  }, [dispatch, driverId]);

  return (
    <Container>
      {/* Render the header with title and filter toggle button */}
      <Header>
        <Title>Recommended Loads</Title>
        <FilterButton onPress={toggleFilters}>
          <Ionicons name="options-outline" size={24} color={colors.primary.blue} />
        </FilterButton>
      </Header>

      {/* Conditionally render the FilterOptions component when filters are visible */}
      {filtersVisible && <FilterOptions />}

      {/* Render a loading indicator when recommendations are being fetched */}
      {loading && <LoadingIndicator />}

      {/* Render an error message if there was an error fetching recommendations */}
      {error && (
        <ErrorContainer>
          <ErrorText>Error: {error}</ErrorText>
          <RetryButton onPress={handleRefresh}>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      )}

      {/* Render an empty state message if there are no recommendations */}
      {!loading && !error && (!recommendations || recommendations.length === 0) && (
        <EmptyStateContainer>
          <Ionicons name="search-off-outline" size={60} color={colors.neutral.mediumGray} />
          <EmptyStateText>No loads found. Please check back later.</EmptyStateText>
        </EmptyStateContainer>
      )}

      {/* Render the FlatList of load recommendations with LoadCard components */}
      {!loading && !error && recommendations && recommendations.length > 0 && (
        <ListContainer>
          <FlatList
            data={recommendations}
            keyExtractor={(item) => item.loadId}
            renderItem={({ item }) => (
              <LoadCard
                load={item}
                onPress={() => handleLoadPress(item)}
                isFavorite={favoriteLoads.includes(item.loadId)}
                onToggleFavorite={toggleFavorite}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary.blue} />
            }
          />
        </ListContainer>
      )}
    </Container>
  );
};

export default LoadListScreen;