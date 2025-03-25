import React, { useState, useCallback } from 'react'; // React core library for UI components
import { View, TouchableOpacity, Text, Alert, Linking, ActivityIndicator } from 'react-native'; // React Native components for mobile UI
import { useSelector, useDispatch } from 'react-redux'; // React Redux hooks for state management
import styled from 'styled-components'; // CSS-in-JS styling library
import { Ionicons } from '@expo/vector-icons'; // ^13.0.0 - Icon library for UI elements

import { LoadWithDetails, LoadStatus, LoadLocationType } from '../../../common/interfaces/load.interface'; // Interface for detailed load data
import { acceptLoad, declineLoad, updateLoadStatus } from '../../../common/api/loadApi'; // API functions for load operations
import { openExternalNavigation } from '../services/navigationService'; // Function to open device's native navigation app
import { colors } from '../styles/colors'; // Color constants for styling

interface LoadDetailActionsProps {
  load: LoadWithDetails;
  driverId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onStatusUpdate?: (status: LoadStatus) => void;
  onNavigate?: (locationType: LoadLocationType) => void;
}

/**
 * Container for the action buttons
 */
const ActionsContainer = styled(View)`
  margin-top: 16px;
  margin-bottom: 16px;
  padding: 16px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
  elevation: 2;
  shadow-color: ${props => props.theme.colors.ui.shadow};
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.1;
  shadow-radius: 4;
`;

/**
 * Row container for action buttons
 */
const ActionRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 12px;
`;

/**
 * Styled button for actions
 */
const ActionButton = styled(TouchableOpacity)<{ primary?: boolean; danger?: boolean; success?: boolean; fullWidth?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: ${props =>
    props.primary
      ? props.theme.colors.primary.main
      : props.danger
      ? props.theme.colors.error.main
      : props.success
      ? props.theme.colors.success.main
      : props.theme.colors.ui.secondary};
  flex: ${props => (props.fullWidth ? 1 : 'auto')};
  margin-horizontal: 4px;
`;

/**
 * Text for action buttons
 */
const ActionButtonText = styled(Text)`
  color: ${props => props.theme.colors.text.inverse};
  font-size: 16px;
  font-weight: 500;
  margin-left: 8px;
`;

/**
 * Container for loading indicator
 */
const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

/**
 * Array of possible reasons for declining a load
 */
const DECLINE_REASONS = [
  { label: 'Rate too low', value: 'RATE_TOO_LOW' },
  { label: 'Schedule conflict', value: 'SCHEDULE_CONFLICT' },
  { label: 'Location too far', value: 'LOCATION_TOO_FAR' },
  { label: 'Equipment mismatch', value: 'EQUIPMENT_MISMATCH' },
  { label: 'Other', value: 'OTHER' },
];

interface StatusUpdateButton {
  nextStatus: LoadStatus | null;
  buttonText: string;
}

/**
 * Component that renders action buttons for the load detail screen
 */
export const LoadDetailActions: React.FC<LoadDetailActionsProps> = ({ load, driverId, onAccept, onDecline, onStatusUpdate, onNavigate }) => {
  // Destructure props to get load data, driver ID, and callback functions
  const { id: loadId, status: currentStatus } = load;

  // Get the current user from Redux state using useSelector
  const user = useSelector((state: any) => state.auth.user);

  // Set up loading state for button actions
  const [loading, setLoading] = useState(false);

  // Extract pickup and delivery locations from load data
  const { pickup, delivery } = extractLocationsByType(load);

  // Create a function to handle accepting the load
  const handleAcceptLoad = useCallback(async () => {
    setLoading(true);
    try {
      await acceptLoad(loadId, driverId);
      Alert.alert('Load Accepted', 'You have successfully accepted this load.');
      onAccept?.();
    } catch (error: any) {
      Alert.alert('Error Accepting Load', error.message || 'Failed to accept load. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadId, driverId, onAccept]);

  // Create a function to handle declining the load
  const handleDeclineLoad = useCallback(async () => {
    Alert.alert(
      'Decline Load',
      'Are you sure you want to decline this load?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          onPress: async () => {
            setLoading(true);
            try {
              await declineLoad(loadId, driverId, { reason: 'other' });
              Alert.alert('Load Declined', 'You have successfully declined this load.');
              onDecline?.();
            } catch (error: any) {
              Alert.alert('Error Declining Load', error.message || 'Failed to decline load. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [loadId, driverId, onDecline]);

  // Create a function to handle updating the load status
  const handleUpdateStatus = useCallback(async (nextStatus: LoadStatus) => {
    setLoading(true);
    try {
      await updateLoadStatus(loadId, { status: nextStatus, updatedBy: driverId });
      Alert.alert('Status Updated', `Load status updated to ${nextStatus}`);
      onStatusUpdate?.(nextStatus);
    } catch (error: any) {
      Alert.alert('Error Updating Status', error.message || 'Failed to update load status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loadId, driverId, onStatusUpdate]);

  // Create a function to handle navigation to pickup/delivery locations
  const handleNavigate = useCallback((locationType: LoadLocationType) => {
    if (!pickup || !delivery) {
      Alert.alert('Navigation Error', 'Pickup or delivery location not found.');
      return;
    }

    const location = locationType === LoadLocationType.PICKUP ? pickup : delivery;
    if (!location) {
      Alert.alert('Navigation Error', `${locationType} location not found.`);
      return;
    }

    openExternalNavigation(
      location.coordinates.latitude,
      location.coordinates.longitude,
      location.facilityName
    );
    onNavigate?.(locationType);
  }, [pickup, delivery, onNavigate]);

  // Create a function to handle calling pickup/delivery facilities
  const handleCallFacility = useCallback((locationType: LoadLocationType) => {
    if (!pickup || !delivery) {
      Alert.alert('Call Error', 'Pickup or delivery location not found.');
      return;
    }

    const location = locationType === LoadLocationType.PICKUP ? pickup : delivery;
    if (!location) {
      Alert.alert('Call Error', `${locationType} location not found.`);
      return;
    }

    Linking.openURL(`tel:${location.contactPhone}`);
  }, [pickup, delivery]);

  // Determine which action buttons to show based on the current load status
  const statusUpdateButton = getStatusUpdateButton(currentStatus);

  // Render the container with appropriate action buttons based on load status
  return (
    <ActionsContainer>
      {loading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={colors.primary.blue} />
        </LoadingContainer>
      ) : (
        <>
          {currentStatus === LoadStatus.AVAILABLE && (
            // For AVAILABLE loads, show Accept and Decline buttons
            <ActionRow>
              <ActionButton primary onPress={handleAcceptLoad} fullWidth>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Accept Load</ActionButtonText>
              </ActionButton>
              <ActionButton danger onPress={handleDeclineLoad} fullWidth>
                <Ionicons name="close-circle-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Decline Load</ActionButtonText>
              </ActionButton>
            </ActionRow>
          )}

          {currentStatus === LoadStatus.ASSIGNED && pickup && (
            // For ASSIGNED loads, show Navigate to Pickup and Call Pickup buttons
            <ActionRow>
              <ActionButton primary onPress={() => handleNavigate(LoadLocationType.PICKUP)} fullWidth>
                <Ionicons name="navigate-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Navigate to Pickup</ActionButtonText>
              </ActionButton>
              <ActionButton onPress={() => handleCallFacility(LoadLocationType.PICKUP)} fullWidth>
                <Ionicons name="call-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Call Pickup</ActionButtonText>
              </ActionButton>
            </ActionRow>
          )}

          {currentStatus === LoadStatus.AT_PICKUP && statusUpdateButton && (
            // For AT_PICKUP loads, show Loaded button to update status
            <ActionRow>
              <ActionButton success onPress={() => handleUpdateStatus(statusUpdateButton.nextStatus!)} fullWidth>
                <Ionicons name="cube-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>{statusUpdateButton.buttonText}</ActionButtonText>
              </ActionButton>
            </ActionRow>
          )}

          {currentStatus === LoadStatus.LOADED && delivery && (
            // For LOADED loads, show Navigate to Delivery and Call Delivery buttons
            <ActionRow>
              <ActionButton primary onPress={() => handleNavigate(LoadLocationType.DELIVERY)} fullWidth>
                <Ionicons name="navigate-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Navigate to Delivery</ActionButtonText>
              </ActionButton>
              <ActionButton onPress={() => handleCallFacility(LoadLocationType.DELIVERY)} fullWidth>
                <Ionicons name="call-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>Call Delivery</ActionButtonText>
              </ActionButton>
            </ActionRow>
          )}

          {currentStatus === LoadStatus.AT_DROPOFF && statusUpdateButton && (
            // For AT_DROPOFF loads, show Delivered button to update status
            <ActionRow>
              <ActionButton success onPress={() => handleUpdateStatus(statusUpdateButton.nextStatus!)} fullWidth>
                <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.text.inverse} />
                <ActionButtonText>{statusUpdateButton.buttonText}</ActionButtonText>
              </ActionButton>
            </ActionRow>
          )}
        </>
      )}
    </ActionsContainer>
  );
};

/**
 * Helper function to extract pickup and delivery locations from load data
 */
const extractLocationsByType = (load: LoadWithDetails) => {
  // Filter load locations array to find pickup location
  const pickup = load.locations.find(loc => loc.locationType === LoadLocationType.PICKUP);

  // Filter load locations array to find delivery location
  const delivery = load.locations.find(loc => loc.locationType === LoadLocationType.DELIVERY);

  // Return object with pickup and delivery locations
  return { pickup, delivery };
};

/**
 * Helper function to determine the appropriate status update button based on current status
 */
const getStatusUpdateButton = (currentStatus: LoadStatus): StatusUpdateButton | null => {
  // Check the current status of the load
  if (currentStatus === LoadStatus.AT_PICKUP) {
    // For AT_PICKUP status, return LOADED as next status with 'Loaded' button text
    return { nextStatus: LoadStatus.LOADED, buttonText: 'Loaded' };
  } else if (currentStatus === LoadStatus.LOADED) {
    // For LOADED status, return IN_TRANSIT as next status with 'Start Delivery' button text
    return { nextStatus: LoadStatus.IN_TRANSIT, buttonText: 'Start Delivery' };
  } else if (currentStatus === LoadStatus.AT_DROPOFF) {
    // For AT_DROPOFF status, return DELIVERED as next status with 'Delivered' button text
    return { nextStatus: LoadStatus.DELIVERED, buttonText: 'Delivered' };
  }

  // For other statuses, return null
  return null;
};