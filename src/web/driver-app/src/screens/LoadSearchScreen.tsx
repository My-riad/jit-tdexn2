import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux v8.0.5
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.1.6
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'; // react-native v0.70.6
import styled from 'styled-components/native'; // styled-components/native v5.3.6

import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import Button from '../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import LoadCard from '../components/LoadCard';
import FilterOptions from '../components/FilterOptions';
import { getLoads } from '../../../common/api/loadApi';
import { filterRecommendations, fetchLoadRecommendations } from '../store/actions/loadActions';
import useDebounce from '../../../common/hooks/useDebounce';
import { LoadSearchParams, LoadRecommendation } from '../../../common/interfaces/load.interface';

interface LoadSearchScreenProps {
  navigation: any;
  route: any;
}

const DEBOUNCE_DELAY = 500;
const INITIAL_SEARCH_PARAMS = { page: 1, limit: 20, query: '' };

const Container = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
  padding: 16px;
`;

const SearchContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled(Input)`
  flex: 1;
  margin-right: 8px;
`;

const FilterButton = styled(TouchableOpacity)`
  padding: 10px;
  background-color: ${props => props.theme.colors.primary.main};
  border-radius: 8px;
`;

const FilterButtonText = styled(Text)`
  color: ${props => props.theme.colors.text.inverse};
  font-weight: bold;
`;

const LoadList = styled(FlatList)`
  flex: 1;
`;

const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const EmptyStateText = styled(Text)`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

const LoadItemSeparator = styled(View)`
  height: 16px;
`;

/**
 * Screen component for searching and filtering available loads
 */
const LoadSearchScreen: React.FC<LoadSearchScreenProps> = ({ navigation, route }) => {
  // LD1: Initialize state for search query, loading state, search results, and filter visibility
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<LoadRecommendation[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // LD1: Get the navigation object for navigating to other screens
  const nav = useNavigation();

  // LD1: Get the Redux dispatch function for dispatching actions
  const dispatch = useDispatch();

  // LD1: Get the driver ID and load recommendations from Redux state
  const driverId = useSelector((state: any) => state.auth.driverId);
  const loadRecommendations = useSelector((state: any) => state.loads.recommendations);

  // LD1: Create a debounced search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY);

  // LD1: Define a function to handle search input changes
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  // LD1: Define a function to perform the search with the current query and filters
  const performSearch = useCallback(async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      // LD1: Fetch loads based on search criteria
      const searchParams: LoadSearchParams = {
        query: debouncedSearchQuery,
        page: INITIAL_SEARCH_PARAMS.page,
        limit: INITIAL_SEARCH_PARAMS.limit,
      };
      const { loads } = await getLoads(searchParams);

      // LD1: Update search results with fetched loads
      setSearchResults(loads as any);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, driverId]);

  // LD1: Define a function to toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // LD1: Define a function to handle load selection and navigate to details
  const handleLoadPress = (load: LoadRecommendation) => {
    nav.navigate('LoadDetails', { loadId: load.loadId });
  };

  // LD1: Define a function to apply filters using Redux actions
  const applyFilters = (filters: object) => {
    dispatch(filterRecommendations(filters));
  };

  // LD1: Define a function to clear filters and reset search
  const clearFilters = () => {
    dispatch(filterRecommendations({}));
  };

  // LD1: Use useEffect to fetch initial load recommendations when the component mounts
  useEffect(() => {
    if (driverId) {
      dispatch(fetchLoadRecommendations(driverId));
    }
  }, [dispatch, driverId]);

  // LD1: Use useEffect to update search results when debounced query changes
  useEffect(() => {
    performSearch();
  }, [debouncedSearchQuery, performSearch]);

  // LD1: Render the screen with search input, filter toggle, and load results
  return (
    <Container>
      <SearchContainer>
        <SearchInput
          placeholder="Search for loads"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <FilterButton onPress={toggleFilters}>
          <FilterButtonText>Filters</FilterButtonText>
        </FilterButton>
      </SearchContainer>

      {/* LD1: Render the FilterOptions component when filters are visible */}
      {showFilters && <FilterOptions />}

      {/* LD1: Render a loading indicator when data is being fetched */}
      {loading ? (
        <LoadingIndicator />
      ) : searchResults.length > 0 ? (
        // LD1: Render a FlatList of LoadCard components for search results
        <LoadList
          data={searchResults}
          keyExtractor={(item) => item.loadId}
          renderItem={({ item }) => (
            <LoadCard load={item} onPress={handleLoadPress} />
          )}
          ItemSeparatorComponent={() => <LoadItemSeparator />}
        />
      ) : (
        // LD1: Render an empty state message when no results are found
        <EmptyStateContainer>
          <EmptyStateText>No loads found matching your search criteria.</EmptyStateText>
        </EmptyStateContainer>
      )}
    </Container>
  );
};

export default LoadSearchScreen;