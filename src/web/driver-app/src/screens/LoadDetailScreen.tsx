import React, { useEffect, useState, useCallback } from 'react'; // version: ^18.2.0
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native'; // version: ^0.71.8
import { useSelector, useDispatch } from 'react-redux'; // version: ^8.0.5
import { useRoute, useNavigation } from '@react-navigation/native'; // version: ^6.1.6
import styled from 'styled-components'; // version: ^5.3.6
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; // version: ^13.0.0

import LoadDetailHeader from '../components/LoadDetailHeader';
import LoadDetailActions from '../components/LoadDetailActions';
import LocationItem from '../components/LocationItem';
import LoadStepsProgress from '../components/LoadStepsProgress';
import {
  LoadWithDetails,
  LoadStatus,
  LoadLocationType,
  LoadRecommendation,
  EquipmentType,
} from '../../../common/interfaces/load.interface';
import {
  fetchLoadDetails,
  acceptLoadAction,
  declineLoadAction,
  updateLoadStatusAction,
} from '../store/actions/loadActions';
import { colors } from '../styles/colors'; // version: Specified in the file JSON specification

// Styled Components for UI elements
const Container = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.colors.ui.background};
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
  padding: 16px;
`;

const Section = styled(View)`
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

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 12px;
`;

const LoadInfoRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const LoadInfoLabel = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const LoadInfoValue = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const PaymentInfoRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const PaymentInfoLabel = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

interface PaymentInfoValueProps {
  highlight?: boolean;
}

const PaymentInfoValue = styled(Text)<PaymentInfoValueProps>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.highlight ? props.theme.colors.semantic.success : props.theme.colors.text.primary};
`;

const TotalPaymentRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top-width: 1px;
  border-top-color: ${props => props.theme.colors.ui.border};
`;

const TotalPaymentLabel = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
`;

const TotalPaymentValue = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  color: ${props => props.theme.colors.semantic.success};
`;

const SpecialInstructions = styled(View)`
  margin-top: 12px;
  padding: 12px;
  background-color: ${props => props.theme.colors.ui.background};
  border-radius: 8px;
`;

const SpecialInstructionsText = styled(Text)`
  font-size: 14px;
  font-style: italic;
  color: ${props => props.theme.colors.text.secondary};
`;

const ActionBar = styled(View)`
  flex-direction: row;
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
`;

const ActionButton = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${props => props.theme.colors.ui.card};
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  elevation: 2;
  shadow-color: ${props => props.theme.colors.ui.shadow};
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.1;
  shadow-radius: 4;
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
  margin-bottom: 20px;
`;

// Constants
const formatCurrency = (amount: number) => `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
const formatWeight = (weight: number) => `${weight.toLocaleString()} lbs`;
const formatDimensions = (dimensions: { length: number; width: number; height: number }) => `${dimensions.length}' × ${dimensions.width}' × ${dimensions.height}'`;
const getEquipmentTypeLabel = (equipmentType: EquipmentType) => {
  switch(equipmentType) {
    case EquipmentType.DRY_VAN:
      return 'Dry Van';
    case EquipmentType.REFRIGERATED:
      return 'Reefer';
    case EquipmentType.FLATBED:
      return 'Flatbed';
    default:
      return equipmentType;
  }
};

/**
 * Screen component that displays detailed information about a load
 */
export const LoadDetailScreen: React.FC = () => {
  // Get the route parameters to extract the loadId
  const { params } = useRoute<any>();
  const { loadId } = params;

  // Get the navigation object for screen navigation
  const navigation = useNavigation();

  // Use useSelector to get the current user/driver from Redux state
  const driver = useSelector((state: any) => state.auth.user);

  // Use useSelector to get the load details and loading state from Redux state
  const load = useSelector((state: any) => state.load.activeLoad) as LoadWithDetails;
  const loading = useSelector((state: any) => state.load.loading);

  // Set up local state for favorite status and loading states
  const [isFavorite, setIsFavorite] = useState(false);

  // Use useDispatch to dispatch Redux actions
  const dispatch = useDispatch();

  // Use useEffect to fetch load details when the component mounts
  useEffect(() => {
    if (loadId) {
      dispatch(fetchLoadDetails(loadId));
    }
  }, [loadId, dispatch]);

  // Create a function to handle accepting the load
  const handleAcceptLoad = useCallback(() => {
    if (loadId && driver?.id) {
      dispatch(acceptLoadAction(loadId, driver.id))
        .then(() => {
          Alert.alert('Success', 'Load accepted successfully!');
          navigation.goBack();
        })
        .catch((error) => {
          Alert.alert('Error', `Failed to accept load: ${error.message}`);
        });
    }
  }, [dispatch, loadId, driver, navigation]);

  // Create a function to handle declining the load
  const handleDeclineLoad = useCallback(() => {
    if (loadId && driver?.id) {
      dispatch(declineLoadAction(loadId, driver.id))
        .then(() => {
          Alert.alert('Success', 'Load declined successfully!');
          navigation.goBack();
        })
        .catch((error) => {
          Alert.alert('Error', `Failed to decline load: ${error.message}`);
        });
    }
  }, [dispatch, loadId, driver, navigation]);

  // Create a function to handle updating the load status
  const handleUpdateStatus = useCallback((status: LoadStatus) => {
    if (loadId) {
      dispatch(updateLoadStatusAction(loadId, { status, updatedBy: driver.id }))
        .then(() => {
          Alert.alert('Success', `Load status updated to ${status}`);
          dispatch(fetchLoadDetails(loadId));
        })
        .catch((error) => {
          Alert.alert('Error', `Failed to update load status: ${error.message}`);
        });
    }
  }, [dispatch, loadId, driver]);

  // Create a function to handle navigation to pickup/delivery locations
  const handleNavigate = useCallback((locationType: LoadLocationType) => {
    // Placeholder for navigation logic
    Alert.alert('Navigation', `Navigating to ${locationType}`);
  }, []);

  // Create a function to handle sharing the load details
  const handleShare = useCallback(() => {
    Share.share({
      message: `Check out this load: ${load?.referenceNumber}`,
      title: 'Load Details',
    });
  }, [load]);

  // Create a function to handle toggling the favorite status
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  // Extract pickup and delivery locations from load data
  const pickupLocation = load?.locations?.find(loc => loc.locationType === LoadLocationType.PICKUP);
  const deliveryLocation = load?.locations?.find(loc => loc.locationType === LoadLocationType.DELIVERY);

  // Render a loading indicator while fetching load details
  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color={colors.primary.blue} />
      </LoadingContainer>
    );
  }

  // Handle the case when load details are not found
  if (!load) {
    return (
      <ErrorContainer>
        <ErrorText>Load details not found.</ErrorText>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </ErrorContainer>
    );
  }

  // Render the screen content when load details are available
  return (
    <Container>
      <ActionBar>
        <ActionButton onPress={handleShare}>
          <MaterialIcons name="share" size={24} color={colors.text.primary} />
        </ActionButton>
        <ActionButton onPress={handleToggleFavorite}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={colors.text.primary} />
        </ActionButton>
      </ActionBar>
      <ScrollContainer>
        {/* Include LoadDetailHeader component with load summary information */}
        <LoadDetailHeader
          load={load}
          showEfficiencyScore={true}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Include LoadStepsProgress component to visualize load status */}
        <Section>
          <SectionTitle>Load Progress</SectionTitle>
          <LoadStepsProgress currentStatus={load.status} />
        </Section>

        {/* Include LocationItem components for pickup and delivery locations */}
        {pickupLocation && (
          <LocationItem
            location={pickupLocation}
            locationType={LoadLocationType.PICKUP}
            onNavigate={handleNavigate}
          />
        )}
        {deliveryLocation && (
          <LocationItem
            location={deliveryLocation}
            locationType={LoadLocationType.DELIVERY}
            onNavigate={handleNavigate}
          />
        )}

        {/* Render load specifications section with weight, dimensions, etc. */}
        <Section>
          <SectionTitle>Load Specifications</SectionTitle>
          <LoadInfoRow>
            <LoadInfoLabel>Weight:</LoadInfoLabel>
            <LoadInfoValue>{formatWeight(load.weight)}</LoadInfoValue>
          </LoadInfoRow>
          <LoadInfoRow>
            <LoadInfoLabel>Dimensions:</LoadInfoLabel>
            <LoadInfoValue>{formatDimensions(load.dimensions)}</LoadInfoValue>
          </LoadInfoRow>
          <LoadInfoRow>
            <LoadInfoLabel>Equipment:</LoadInfoLabel>
            <LoadInfoValue>{getEquipmentTypeLabel(load.equipmentType)}</LoadInfoValue>
          </LoadInfoRow>
        </Section>

        {/* Render payment information section with rate details */}
        <Section>
          <SectionTitle>Payment Information</SectionTitle>
          <PaymentInfoRow>
            <PaymentInfoLabel>Base Rate:</PaymentInfoLabel>
            <PaymentInfoValue>{formatCurrency(load.offeredRate)}</PaymentInfoValue>
          </PaymentInfoRow>
          <PaymentInfoRow>
            <PaymentInfoLabel>Bonus:</PaymentInfoLabel>
            <PaymentInfoValue highlight={true}>+ {formatCurrency(100)}</PaymentInfoValue>
          </PaymentInfoRow>
          <TotalPaymentRow>
            <TotalPaymentLabel>Total:</TotalPaymentLabel>
            <TotalPaymentValue>{formatCurrency(load.offeredRate + 100)}</TotalPaymentValue>
          </TotalPaymentRow>
        </Section>

        {/* Render special instructions section */}
        <Section>
          <SectionTitle>Special Instructions</SectionTitle>
          <SpecialInstructions>
            <SpecialInstructionsText>
              {load.specialInstructions || 'No special instructions.'}
            </SpecialInstructionsText>
          </SpecialInstructions>
        </Section>

        {/* Include LoadDetailActions component with appropriate action buttons */}
        <LoadDetailActions
          load={load}
          driverId={driver?.id}
          onAccept={handleAcceptLoad}
          onDecline={handleDeclineLoad}
          onStatusUpdate={handleUpdateStatus}
          onNavigate={handleNavigate}
        />
      </ScrollContainer>
    </Container>
  );
};

export default LoadDetailScreen;