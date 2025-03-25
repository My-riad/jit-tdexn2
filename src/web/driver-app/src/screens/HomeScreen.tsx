import React, { useEffect, useState, useCallback } from 'react'; //  ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; //  ^8.1.1
import styled from 'styled-components/native'; //  ^5.3.10
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'; //  ^0.70.6

import StatusBar from '../components/StatusBar'; // src/web/driver-app/src/components/StatusBar.tsx
import EfficiencyScore from '../components/EfficiencyScore'; // src/web/driver-app/src/components/EfficiencyScore.tsx
import LoadCard from '../components/LoadCard'; // src/web/driver-app/src/components/LoadCard.tsx
import EarningsSummary from '../components/EarningsSummary'; // src/web/driver-app/src/components/EarningsSummary.tsx
import HoursDisplay from '../components/HoursDisplay'; // src/web/driver-app/src/components/HoursDisplay.tsx
import DriverMap from '../components/DriverMap'; // src/web/driver-app/src/components/DriverMap.tsx
import useDriverLocation from '../hooks/useDriverLocation'; // src/web/driver-app/src/hooks/useDriverLocation.ts
import useLoadUpdates from '../hooks/useLoadUpdates'; // src/web/driver-app/src/hooks/useLoadUpdates.ts
import useAuth from '../../../common/hooks/useAuth'; // src/web/common/hooks/useAuth.ts
import { fetchRecommendedLoads, fetchActiveLoad } from '../store/actions/loadActions'; // src/web/driver-app/src/store/actions/loadActions.ts
import { fetchDriverProfile } from '../store/actions/profileActions'; // src/web/driver-app/src/store/actions/profileActions.ts
import theme from '../styles/theme'; // src/web/driver-app/src/styles/theme.ts
import { LoadRecommendation, Load } from '../../../common/interfaces/load.interface';
import { SmartHub } from '../../../../backend/common/interfaces/smartHub.interface';
import { BonusZone } from '../../../common/interfaces/gamification.interface';

// Define a constant for the maximum number of recommended loads to display
const MAX_RECOMMENDED_LOADS = 3;

// Define styled components for the HomeScreen
const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background.main};
  padding: ${theme.spacing.md};
`;

const Section = styled.View`
  margin-bottom: ${theme.spacing.lg};
`;

const SectionHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const ViewAllButton = styled.TouchableOpacity`
  padding: ${theme.spacing.xs};
`;

const ViewAllText = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.primary.main};
`;

const LoadsList = styled.View`
  margin-top: ${theme.spacing.sm};
`;

const LoadItem = styled.View`
  margin-bottom: ${theme.spacing.sm};
`;

const QuickAccessContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.md};
`;

const QuickAccessButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background.card};
  padding: ${theme.spacing.md};
  border-radius: ${theme.spacing.sm};
  margin-horizontal: ${theme.spacing.xs};
`;

const QuickAccessText = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.primary};
  margin-top: ${theme.spacing.xs};
`;

const MapPreviewContainer = styled.View`
  height: 200px;
  border-radius: ${theme.spacing.sm};
  overflow: hidden;
  margin-top: ${theme.spacing.md};
`;

const EmptyStateContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  background-color: ${theme.colors.background.card};
  border-radius: ${theme.spacing.sm};
`;

const EmptyStateText = styled(Text)`
  font-size: 16px;
  color: ${theme.colors.text.secondary};
  text-align: center;
`;

const LoadingContainer = styled.View`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
`;

const ErrorContainer = styled.View`
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.semantic.error};
  border-radius: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

const ErrorText = styled(Text)`
  color: ${theme.colors.semantic.error};
  font-size: 14px;
`;

interface HomeScreenProps {
  navigation: any;
  bonusZones: BonusZone[];
  smartHubs: SmartHub[];
}

/**
 * The main home screen component for the driver mobile application
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, bonusZones, smartHubs }) => {
  // LD1: Extract navigation from props
  // LD1: Get the current authenticated user from useAuth hook
  const { authState } = useAuth();
  const driver = authState.user;

  // LD1: Get the driver's current location using useDriverLocation hook
  const { position: driverPosition } = useDriverLocation(driver?.id || '', '');

  // LD1: Initialize Redux dispatch function
  const dispatch = useDispatch();

  // LD1: Access driver profile, recommended loads, and active load from Redux store
  const recommendedLoads = useSelector((state: any) => state.load.recommendations) as LoadRecommendation[];
  const activeLoad = useSelector((state: any) => state.load.activeLoad) as Load;
  const loading = useSelector((state: any) => state.load.loading);
  const error = useSelector((state: any) => state.load.error);

  // LD1: Set up refreshing state for pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);

  // LD1: Create a function to handle navigation to the load details screen
  const handleLoadPress = useCallback((load: Load) => {
    navigation.navigate('LoadDetails', { loadId: load.id });
  }, [navigation]);

  // LD1: Create a function to handle navigation to the active load screen
  const handleActiveLoadPress = useCallback(() => {
    if (activeLoad) {
      navigation.navigate('LoadDetails', { loadId: activeLoad.id });
    }
  }, [navigation, activeLoad]);

  // LD1: Create a function to handle navigation to the map screen
  const handleMapPress = useCallback(() => {
    navigation.navigate('Map');
  }, [navigation]);

  // LD1: Create a function to handle navigation to the earnings screen
  const handleEarningsPress = useCallback(() => {
    navigation.navigate('Earnings');
  }, [navigation]);

  // LD1: Create a function to handle status updates
  const handleStatusUpdate = useCallback(() => {
    // Implement status update logic here
    console.log('Status update pressed');
  }, []);

  // LD1: Create a function to refresh all data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchDriverProfile(driver?.id || '')),
      dispatch(fetchRecommendedLoads(driver?.id || '', { count: MAX_RECOMMENDED_LOADS })),
      dispatch(fetchActiveLoad(driver?.id || ''))
    ]).finally(() => setRefreshing(false));
  }, [dispatch, driver]);

  // LD1: Set up effect to fetch initial data when the component mounts
  useEffect(() => {
    if (driver) {
      dispatch(fetchDriverProfile(driver.id));
      dispatch(fetchRecommendedLoads(driver.id, { count: MAX_RECOMMENDED_LOADS }));
      dispatch(fetchActiveLoad(driver.id));
    }
  }, [dispatch, driver]);

  // LD1: Render the screen with StatusBar, EfficiencyScore, recommended loads section, active load section, and quick access buttons
  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <StatusBar driverId={driver?.id || ''} onStatusPress={handleStatusUpdate} />

        <Section>
          <SectionHeader>
            <SectionTitle>Efficiency</SectionTitle>
          </SectionHeader>
          <EfficiencyScore score={driver?.efficiencyScore || 0} />
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Recommended Loads</SectionTitle>
            <ViewAllButton onPress={() => navigation.navigate('LoadList')}>
              <ViewAllText>View All</ViewAllText>
            </ViewAllButton>
          </SectionHeader>
          {loading ? (
            <LoadingContainer>
              <Text>Loading recommended loads...</Text>
            </LoadingContainer>
          ) : error ? (
            <ErrorContainer>
              <ErrorText>{error}</ErrorText>
            </ErrorContainer>
          ) : recommendedLoads.length > 0 ? (
            <LoadsList>
              {recommendedLoads.slice(0, MAX_RECOMMENDED_LOADS).map(load => (
                <LoadItem key={load.loadId}>
                  <LoadCard load={load} onPress={handleLoadPress} />
                </LoadItem>
              ))}
            </LoadsList>
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No recommended loads available at this time.</EmptyStateText>
            </EmptyStateContainer>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Active Load</SectionTitle>
          </SectionHeader>
          {activeLoad ? (
            <LoadCard load={activeLoad} onPress={handleActiveLoadPress} />
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No active load assigned.</EmptyStateText>
            </EmptyStateContainer>
          )}
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Map Preview</SectionTitle>
          </SectionHeader>
          <MapPreviewContainer>
            <DriverMap
              bonusZones={bonusZones}
              smartHubs={smartHubs}
              height={200}
              width="100%"
            />
          </MapPreviewContainer>
        </Section>

        <QuickAccessContainer>
          <QuickAccessButton onPress={handleMapPress}>
            {/* <MapIcon /> */}
            <QuickAccessText>Map</QuickAccessText>
          </QuickAccessButton>
          <QuickAccessButton onPress={handleEarningsPress}>
            {/* <EarningsIcon /> */}
            <QuickAccessText>Earnings</QuickAccessText>
          </QuickAccessButton>
        </QuickAccessContainer>
      </ScrollView>
    </Container>
  );
};

export default HomeScreen;