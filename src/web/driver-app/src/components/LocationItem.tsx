import React from 'react'; // version: ^18.2.0
import styled from 'styled-components'; // version: ^5.3.6
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native'; // version: ^0.71.8
import { MaterialIcons } from '@expo/vector-icons'; // version: ^13.0.0

import {
  LoadLocation,
  LoadLocationType,
} from '../../../common/interfaces/load.interface';
import { formatDateTime } from '../../../common/utils/dateTimeUtils';
import { colors } from '../styles/colors';
import { openExternalNavigation } from '../services/navigationService';

/**
 * Interface defining the props for the LocationItem component
 */
interface LocationItemProps {
  location: LoadLocation;
  locationType: LoadLocationType;
  onNavigate?: (location: LoadLocation) => void;
  onCall?: (phoneNumber: string) => void;
  showActions?: boolean;
}

/**
 * Function to get a human-readable label for location types
 */
const getLocationTypeLabel = (type: LoadLocationType) => {
  switch (type) {
    case LoadLocationType.PICKUP:
      return 'Pickup';
    case LoadLocationType.DELIVERY:
      return 'Delivery';
    default:
      return 'Location';
  }
};

/**
 * Component that displays location details and provides action buttons
 */
export const LocationItem: React.FC<LocationItemProps> = ({
  location,
  locationType,
  onNavigate,
  onCall,
  showActions = true,
}) => {
  // Format the address string from address components
  const formattedAddress = formatAddress(location.address);

  // Format the time window string from earliest and latest times
  const timeWindow = formatTimeWindow(location.earliestTime, location.latestTime);

  /**
   * Handler for navigation button press
   */
  const handleNavigate = (location: LoadLocation, onNavigate?: (location: LoadLocation) => void) => {
    if (onNavigate) {
      onNavigate(location);
    } else {
      if (location.coordinates) {
        openExternalNavigation(
          location.coordinates.latitude,
          location.coordinates.longitude,
          location.facilityName
        ).catch((error) => {
          Alert.alert(
            'Navigation Error',
            'Could not open navigation app. Please try again later.',
            [{ text: 'OK' }]
          );
        });
      } else {
        Alert.alert(
          'Navigation Error',
          'Coordinates not available for this location.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  /**
   * Handler for call button press
   */
  const handleCall = (phoneNumber: string, onCall?: (phoneNumber: string) => void) => {
    if (onCall) {
      onCall(phoneNumber);
    } else {
      if (phoneNumber) {
        Linking.openURL(`tel:${phoneNumber}`).catch((error) => {
          Alert.alert(
            'Call Error',
            'Could not make the call. Please try again later.',
            [{ text: 'OK' }]
          );
        });
      } else {
        Alert.alert(
          'Call Error',
          'Phone number not available for this location.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Render the location container with appropriate styling
  return (
    <LocationContainer>
      {/* Display the location type (Pickup/Delivery) as a header */}
      <LocationTypeHeader locationType={locationType}>
        {getLocationTypeLabel(locationType)}
      </LocationTypeHeader>

      {/* Display the facility name */}
      <FacilityName>{location.facilityName}</FacilityName>

      {/* Display the formatted address */}
      <AddressText>{formattedAddress}</AddressText>

      {/* Display the time window */}
      <TimeWindowText>{timeWindow}</TimeWindowText>

      {/* Display contact information if available */}
      {location.contactName && location.contactPhone && (
        <ContactText>
          {location.contactName} - {location.contactPhone}
        </ContactText>
      )}

      {/* Display special instructions if available */}
      {location.specialInstructions && (
        <InstructionsText>{location.specialInstructions}</InstructionsText>
      )}

      {/* Render action buttons for navigation and calling the facility */}
      {showActions && (
        <ActionsContainer>
          <ActionButton onPress={() => handleNavigate(location, onNavigate)}>
            <MaterialIcons name="navigation" size={20} color={colors.text.inverse} />
            <ActionButtonText>Navigate</ActionButtonText>
          </ActionButton>
          <ActionButton onPress={() => handleCall(location.contactPhone, onCall)}>
            <MaterialIcons name="phone" size={20} color={colors.text.inverse} />
            <ActionButtonText>Call Facility</ActionButtonText>
          </ActionButton>
        </ActionsContainer>
      )}
    </LocationContainer>
  );
};

/**
 * Helper function to format address components into a readable string
 */
const formatAddress = (address: any): string => {
  if (!address) {
    return '';
  }
  return `${address.street1}, ${address.city}, ${address.state} ${address.zipCode}`;
};

/**
 * Helper function to format time window from earliest and latest times
 */
const formatTimeWindow = (earliestTime: string, latestTime: string): string => {
  const formattedEarliestTime = formatDateTime(earliestTime, 'h:mm a');
  const formattedLatestTime = formatDateTime(latestTime, 'h:mm a');
  return `${formattedEarliestTime} - ${formattedLatestTime}`;
};

// Styled Components for UI elements
const LocationContainer = styled(View)`
  padding: 16px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
  margin-bottom: 16px;
  elevation: 2;
  shadow-color: ${props => props.theme.colors.ui.shadow};
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`;

const LocationTypeHeader = styled(Text)<{ locationType: LoadLocationType }>`
  font-size: 16px;
  font-weight: bold;
  color: ${props =>
    props.locationType === LoadLocationType.PICKUP
      ? props.theme.colors.semantic.success
      : props.theme.colors.semantic.info};
  margin-bottom: 8px;
`;

const FacilityName = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const AddressText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const TimeWindowText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const ContactText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const InstructionsText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  font-style: italic;
  margin-bottom: 16px;
`;

const ActionsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
`;

const ActionButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 8px;
  background-color: ${props => props.theme.colors.ui.secondary};
  flex: 1;
  margin-horizontal: 4px;
`;

const ActionButtonText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.inverse};
  margin-left: 8px;
`;

const SectionLabel = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 4px;
`;