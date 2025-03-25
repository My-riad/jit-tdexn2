import React, { useState, useEffect, useCallback } from 'react'; //  ^18.2.0
import { useNavigation, useRoute } from '@react-navigation/native'; //  ^6.1.6
import styled from 'styled-components/native'; //  ^5.3.10
import { useDispatch, useSelector } from 'react-redux'; //  ^8.0.5
import { Ionicons } from '@expo/vector-icons'; //  ^13.0.0
import { ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native'; //  ^0.71.8

import DriverMap from '../components/DriverMap'; // Map component for displaying the Smart Hub location
import LoadCard from '../components/LoadCard'; // Component for displaying load information
import {
  SmartHub,
  SmartHubType,
  SmartHubAmenity,
} from '../../../backend/common/interfaces/smartHub.interface'; // Interface defining a Smart Hub location
import { LoadWithDetails } from '../../../common/interfaces/load.interface'; // Interface for load details
import { LoadRouteProp, LoadNavigationProp } from '../navigation/types'; // Type for the route prop
import colors from '../styles/colors'; // Color definitions for styling
import Text from '../../shared/components/typography/Text'; // Typography component for text
import Heading from '../../shared/components/typography/Heading'; // Typography component for headings
import Button from '../../shared/components/buttons/Button'; // Button component for actions

/**
 * @description Interface defining the props for the SmartHubScreen component
 */
interface SmartHubScreenProps {
  /**
   * @description Navigation prop for screen navigation
   */
  navigation: LoadNavigationProp<'SmartHub'>;
  /**
   * @description Route prop containing parameters
   */
  route: LoadRouteProp<'SmartHub'>;
}

/**
 * @description Screen component that displays detailed information about a Smart Hub and facilitates load exchanges
 */
const SmartHubScreen: React.FC<SmartHubScreenProps> = ({ navigation, route }) => {
  // Access the navigation object
  const { hubId } = route.params;

  // Access the Redux dispatch function
  const dispatch = useDispatch();

  // Access Redux state for active load
  const activeLoad = useSelector((state: any) => state.load.activeLoad) as LoadWithDetails | null;

  // State variables for managing Smart Hub data, loading state, and errors
  const [smartHub, setSmartHub] = useState<SmartHub | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeLoads, setExchangeLoads] = useState<LoadWithDetails[]>([]);

  /**
   * @description Fetches detailed information about a Smart Hub from the API
   * @param hubId
   * @returns {Promise<SmartHub>} Promise resolving to Smart Hub details
   */
  const fetchSmartHubDetails = useCallback(async (hubId: string): Promise<SmartHub> => {
    // Dispatch a loading action to indicate data fetching
    setLoading(true);
    try {
      // Make an API call to fetch Smart Hub details by ID
      // const smartHubData = await api.getSmartHubDetails(hubId);
      const smartHubData: SmartHub = {
        hub_id: hubId,
        name: 'Test Smart Hub',
        hub_type: SmartHubType.TRUCK_STOP,
        latitude: 34.0522,
        longitude: -118.2437,
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        amenities: [SmartHubAmenity.PARKING, SmartHubAmenity.RESTROOMS],
        capacity: 50,
        operating_hours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5] },
        efficiency_score: 85,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // If successful, return the Smart Hub data
      setSmartHub(smartHubData);
      return smartHubData;
    } catch (err: any) {
      // If there's an error, dispatch an error action and throw the error
      setError(err.message || 'Failed to fetch Smart Hub details');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  /**
   * @description Fetches loads available for exchange at this Smart Hub
   * @param hubId
   * @returns {Promise<LoadWithDetails[]>} Promise resolving to array of available loads
   */
  const fetchExchangeLoads = useCallback(async (hubId: string): Promise<LoadWithDetails[]> => {
    try {
      // Make an API call to fetch loads available for exchange at this hub
      // const loadsData = await api.getExchangeLoads(hubId);
      const loadsData: LoadWithDetails[] = [];

      // If successful, return the loads data
      setExchangeLoads(loadsData);
      return loadsData;
    } catch (err: any) {
      // If there's an error, dispatch an error action and throw the error
      setError(err.message || 'Failed to fetch exchange loads');
      throw err;
    }
  }, [dispatch]);

  /**
   * @description Handles selection of a load for viewing details
   * @param load
   * @returns {void} No return value
   */
  const handleLoadSelect = useCallback((load: LoadWithDetails) => {
    // Navigate to the LoadDetail screen with the selected load ID
    navigation.navigate('LoadDetail', { loadId: load.id });
  }, [navigation]);

  /**
   * @description Handles the action to exchange the current load for a new one at this Smart Hub
   * @param newLoad
   * @returns {void} No return value
   */
  const handleExchangeLoad = useCallback((newLoad: LoadWithDetails) => {
    // Dispatch an action to initiate the load exchange process
    // Show a confirmation dialog to the driver
    // If confirmed, complete the exchange and navigate to the new active load
    // If there's an error, show an error message
    console.log('Exchanging load for:', newLoad);
  }, [dispatch]);

  /**
   * @description Retry fetching data if there was an error
   * @returns {void}
   */
  const handleRetry = useCallback(() => {
    // Reset error state
    setError(null);
    // Set loading state to true
    setLoading(true);
    // Fetch Smart Hub details and exchange loads again
    fetchSmartHubDetails(hubId);
    fetchExchangeLoads(hubId);
  }, [hubId, fetchSmartHubDetails, fetchExchangeLoads]);

  /**
   * @description Open navigation to the Smart Hub location
   * @returns {void}
   */
  const handleNavigate = useCallback(() => {
    // Use the device's map application to navigate to the Smart Hub coordinates
    console.log('Navigating to Smart Hub');
  }, []);

  /**
   * @description Format the operating hours into a readable string
   * @param hours
   * @returns {string}
   */
  const formatOperatingHours = (hours: { open: string; close: string; days: number[] }): string => {
    // Format the days of the week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = hours.days.map(day => daysOfWeek[day]).join('-');

    // Format the open and close times
    const openTime = hours.open;
    const closeTime = hours.close;

    // Return a formatted string like 'Mon-Fri: 8:00 AM - 8:00 PM'
    return `${days}: ${openTime} - ${closeTime}`;
  };

  /**
   * @description Format amenity enum value to a readable name
   * @param amenity
   * @returns {string}
   */
  const formatAmenityName = (amenity: SmartHubAmenity): string => {
    // Convert the enum value to a readable string
    const name = String(amenity);

    // Replace underscores with spaces and capitalize words
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  /**
   * @description Get the appropriate icon name for an amenity
   * @param amenity
   * @returns {string}
   */
  const getAmenityIcon = (amenity: SmartHubAmenity): string => {
    // Map each amenity type to an appropriate Ionicons icon name
    switch (amenity) {
      case SmartHubAmenity.PARKING:
        return 'car';
      case SmartHubAmenity.RESTROOMS:
        return 'toilet';
      case SmartHubAmenity.FOOD:
        return 'restaurant';
      case SmartHubAmenity.FUEL:
        return 'fuel';
      case SmartHubAmenity.MAINTENANCE:
        return 'build';
      case SmartHubAmenity.SHOWER:
        return 'shower';
      case SmartHubAmenity.LODGING:
        return 'bed';
      case SmartHubAmenity.SECURITY:
        return 'shield';
      case SmartHubAmenity.LOADING_DOCK:
        return 'cube';
      case SmartHubAmenity.SCALE:
        return 'barbell';
      default:
        return 'help-circle';
    }
  };

  return (
    <Container>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary.blue} />
      ) : error ? (
        <ErrorView>
          <Text color="error">{error}</Text>
          <Button onPress={handleRetry} variant="secondary">
            Retry
          </Button>
        </ErrorView>
      ) : (
        smartHub && (
          <ScrollView>
            <MapSection>
              <DriverMap
                height={200}
                showSmartHubs
                smartHubs={[smartHub]}
                showRecommendedLoads={false}
                showActiveLoad={activeLoad !== null}
                initialViewMode="SMART_HUBS"
              />
            </MapSection>

            <HubDetailsSection>
              <Heading level={2}>{smartHub.name}</Heading>
              <HubTypeTag>{smartHub.hub_type}</HubTypeTag>
              <AddressText>
                {smartHub.address}, {smartHub.city}, {smartHub.state} {smartHub.zip}
              </AddressText>

              <EfficiencyScoreSection>
                <Text>Efficiency Score:</Text>
                <ScoreValue>{smartHub.efficiency_score}</ScoreValue>
              </EfficiencyScoreSection>

              <DetailsRow>
                <DetailLabel>Capacity:</DetailLabel>
                <DetailValue>{smartHub.capacity} trucks</DetailValue>
              </DetailsRow>

              <DetailsRow>
                <DetailLabel>Hours:</DetailLabel>
                <DetailValue>{formatOperatingHours(smartHub.operating_hours)}</DetailValue>
              </DetailsRow>
            </HubDetailsSection>

            <AmenitiesSection>
              <SectionHeading level={3}>Amenities</SectionHeading>
              <AmenitiesList>
                {smartHub.amenities.map(amenity => (
                  <AmenityItem key={amenity}>
                    <Ionicons name={getAmenityIcon(amenity)} size={16} color={colors.primary.blue} />
                    <Text>{formatAmenityName(amenity)}</Text>
                  </AmenityItem>
                ))}
              </AmenitiesList>
            </AmenitiesSection>

            {activeLoad !== null && (
              <ExchangeLoadsSection>
                <SectionHeading level={3}>Available Exchange Loads</SectionHeading>
                {exchangeLoads.length === 0 ? (
                  <Text>No loads available for exchange at this time.</Text>
                ) : (
                  <LoadsList>
                    {exchangeLoads.map(load => (
                      <LoadCard
                        key={load.id}
                        load={load}
                        onPress={() => handleLoadSelect(load)}
                        showExchangeButton
                        onExchange={() => handleExchangeLoad(load)}
                      />
                    ))}
                  </LoadsList>
                )}
              </ExchangeLoadsSection>
            )}

            <ActionSection>
              <Button onPress={handleNavigate} variant="primary" fullWidth>
                <Ionicons name="navigate" size={16} color="white" />
                <Text>Navigate to Hub</Text>
              </Button>
              <Button onPress={() => navigation.goBack()} variant="secondary" fullWidth marginTop={10}>
                Back
              </Button>
            </ActionSection>
          </ScrollView>
        )
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: ${colors.background.main};
  padding: 16px;
`;

const ErrorView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const MapSection = styled.View`
  height: 220px;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
`;

const HubDetailsSection = styled.View`
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const HubTypeTag = styled.Text`
  background-color: ${colors.primary.blue};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  align-self: flex-start;
  margin-bottom: 8px;
`;

const AddressText = styled.Text`
  font-size: 14px;
  color: ${colors.text.secondary};
  margin-bottom: 12px;
`;

const EfficiencyScoreSection = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const ScoreValue = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.primary.blue};
  margin-left: 8px;
`;

const DetailsRow = styled.View`
  flex-direction: row;
  margin-bottom: 8px;
`;

const DetailLabel = styled.Text`
  font-size: 14px;
  font-weight: 500;
  width: 80px;
`;

const DetailValue = styled.Text`
  font-size: 14px;
  flex: 1;
`;

const SectionHeading = styled(Heading)`
  font-size: 18px;
  margin-bottom: 12px;
`;

const AmenitiesSection = styled.View`
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const AmenitiesList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;

const AmenityItem = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${colors.background.light};
  padding: 6px 12px;
  border-radius: 16px;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const ExchangeLoadsSection = styled.View`
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const LoadsList = styled.View`
  margin-top: 12px;
`;

const ActionSection = styled.View`
  padding: 16px;
  margin-bottom: 16px;
`;

export default SmartHubScreen;