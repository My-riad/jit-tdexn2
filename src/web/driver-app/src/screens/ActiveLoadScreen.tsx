import React, { useState, useEffect, useCallback } from 'react'; //  ^18.2.0
import { useSelector, useDispatch } from 'react-redux'; //  ^8.0.5
import { useNavigation, useRoute } from '@react-navigation/native'; //  ^6.1.6
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'; //  ^0.71.8
import styled from 'styled-components'; //  ^5.3.6

import StatusBar from '../components/StatusBar'; // Component to display driver status and HOS information
import LoadDetailHeader from '../components/LoadDetailHeader'; // Component to display load header information
import LoadDetailActions from '../components/LoadDetailActions'; // Component to display action buttons for the load
import DriverMap from '../components/DriverMap'; // Map component to display load route and current location
import LoadStepsProgress from '../components/LoadStepsProgress'; // Component to display load status progress steps
import LocationItem from '../components/LocationItem'; // Component to display pickup and delivery location details
import {
  LoadWithDetails,
  LoadStatus,
  LoadLocationType,
} from '../../../common/interfaces/load.interface'; // Interface for detailed load data
import { getActiveLoad } from '../store/actions/loadActions'; // Redux action to fetch the active load
import { updateLoadStatus } from '../store/actions/loadActions'; // Redux action to update load status
import useDriverLocation from '../hooks/useDriverLocation'; // Hook to access driver location data
import useLoadUpdates from '../hooks/useLoadUpdates'; // Hook to receive real-time updates about the active load

/**
 * Styled components for UI elements
 */
const Container = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.colors.background.main};
  padding: 16px;
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

const Section = styled(View)`
  margin-bottom: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const MapContainer = styled(View)`
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
`;

const ETAContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  padding: 12px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ETALabel = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ETAValue = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
`;

const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ErrorText = styled(Text)`
  font-size: 16px;
  color: ${props => props.theme.colors.semantic.error};
  text-align: center;
  margin-bottom: 16px;
`;

const NoLoadContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const NoLoadText = styled(Text)`
  font-size: 16px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin-bottom: 16px;
`;

/**
 * Main component for the active load screen
 */
export const ActiveLoadScreen: React.FC = () => {
  // Get the navigation object using useNavigation hook
  const navigation = useNavigation();

  // Get the route params using useRoute hook
  const route = useRoute();

  // Get the Redux dispatch function using useDispatch
  const dispatch = useDispatch();

  // Get the current user/driver from Redux state using useSelector
  const user = useSelector((state: any) => state.auth.user);

  // Get the active load from Redux state using useSelector
  const activeLoad = useSelector((state: any) => state.load.activeLoad) as LoadWithDetails | null;

  // Set up loading state for the screen
  const [loading, setLoading] = useState<boolean>(false);

  // Set up refreshing state for pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Set up error state for error handling
  const [error, setError] = useState<string | null>(null);

  // Use the useDriverLocation hook to get the driver's current location
  const { position: driverPosition } = useDriverLocation(user?.id || '', '');

  // Use the useLoadUpdates hook to receive real-time updates about the active load
  const { refreshLoad } = useLoadUpdates(activeLoad?.id || '');

  /**
   * Function to handle refreshing the active load data
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(getActiveLoad(user?.id));
    setRefreshing(false);
  }, [dispatch, user?.id]);

  /**
   * Function to handle updating the load status
   */
  const handleStatusUpdate = useCallback((newStatus: LoadStatus) => {
    Alert.alert(
      'Update Status',
      `Are you sure you want to update the status to ${newStatus}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async () => {
            setLoading(true);
            setError(null);
            try {
              await dispatch(updateLoadStatus(activeLoad?.id, { status: newStatus, updatedBy: user?.id }));
              Alert.alert('Status Updated', `Load status updated to ${newStatus}`);
            } catch (err: any) {
              setError(err.message || 'Failed to update load status');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [dispatch, activeLoad?.id, user?.id]);

  /**
   * Function to handle navigation to pickup/delivery locations
   */
  const handleNavigate = useCallback((locationType: LoadLocationType) => {
    // Implement navigation logic here
    console.log(`Navigate to ${locationType}`);
  }, []);

  /**
   * Function to handle calling pickup/delivery facilities
   */
  const handleCall = useCallback((phoneNumber: string) => {
    // Implement calling logic here
    console.log(`Call ${phoneNumber}`);
  }, []);

  // Use useEffect to fetch the active load when the component mounts
  useEffect(() => {
    setLoading(true);
    setError(null);
    dispatch(getActiveLoad(user?.id))
      .catch((err: any) => {
        setError(err.message || 'Failed to fetch active load');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, user?.id]);

  // Extract pickup and delivery locations from the active load
  const { pickup, delivery } = extractLocationsByType(activeLoad);

  // Calculate ETA and distance remaining based on current location
  const { eta, distanceRemaining } = calculateETA(driverPosition, activeLoad);

  // Render loading indicator while data is being fetched
  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#0000ff" />
      </LoadingContainer>
    );
  }

  // Render error message if there's an error fetching data
  if (error) {
    return (
      <ErrorContainer>
        <ErrorText>{error}</ErrorText>
      </ErrorContainer>
    );
  }

  // Render message if there's no active load
  if (!activeLoad) {
    return (
      <NoLoadContainer>
        <NoLoadText>No active load found.</NoLoadText>
      </NoLoadContainer>
    );
  }

  // Render the active load details with StatusBar, LoadDetailHeader, DriverMap, LoadStepsProgress, LocationItem components
  return (
    <Container>
      <StatusBar driverId={user?.id} />
      <ScrollContainer
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <LoadDetailHeader load={activeLoad} />
        <MapContainer>
          <DriverMap />
        </MapContainer>
        <Section>
          <SectionTitle>Progress</SectionTitle>
          <LoadStepsProgress currentStatus={activeLoad.status} />
        </Section>
        <Section>
          <SectionTitle>ETA</SectionTitle>
          <ETAContainer>
            <ETALabel>Estimated Arrival Time:</ETALabel>
            <ETAValue>{eta}</ETAValue>
          </ETAContainer>
        </Section>
        <Section>
          <SectionTitle>Pickup</SectionTitle>
          {pickup && (
            <LocationItem
              location={pickup}
              locationType={LoadLocationType.PICKUP}
              onNavigate={handleNavigate}
              onCall={handleCall}
            />
          )}
        </Section>
        <Section>
          <SectionTitle>Delivery</SectionTitle>
          {delivery && (
            <LocationItem
              location={delivery}
              locationType={LoadLocationType.DELIVERY}
              onNavigate={handleNavigate}
              onCall={handleCall}
            />
          )}
        </Section>
        <LoadDetailActions
          load={activeLoad}
          driverId={user?.id}
          onStatusUpdate={handleStatusUpdate}
        />
      </ScrollContainer>
    </Container>
  );
};

/**
 * Helper function to extract pickup and delivery locations from load data
 */
const extractLocationsByType = (load: LoadWithDetails) => {
  const pickup = load?.locations?.find(loc => loc.locationType === LoadLocationType.PICKUP);
  const delivery = load?.locations?.find(loc => loc.locationType === LoadLocationType.DELIVERY);
  return { pickup, delivery };
};

/**
 * Helper function to calculate ETA and distance remaining
 */
const calculateETA = (driverPosition: any, activeLoad: any) => {
  return {
    eta: 'N/A',
    distanceRemaining: 'N/A',
  };
};

export default ActiveLoadScreen;