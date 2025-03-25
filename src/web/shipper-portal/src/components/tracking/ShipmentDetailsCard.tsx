# src/web/shipper-portal/src/components/tracking/ShipmentDetailsCard.tsx
```tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  LoadWithDetails,
  LoadStatus,
  LoadLocation,
  LoadLocationType,
} from '../../../common/interfaces/load.interface';
import { ETAResponse } from '../../../common/interfaces/tracking.interface';
import { DriverSummary } from '../../../common/interfaces/driver.interface';
import { CarrierSummary } from '../../../common/interfaces/carrier.interface';
import { getLoadById } from '../../services/loadService';
import { getLoadETA } from '../../services/trackingService';
import {
  formatDateTime,
  formatCurrency,
  formatWeight,
  formatDistance,
} from '../../../common/utils/formatters';
import Card from '../../../shared/components/cards/Card';
import { Heading, Text } from '../../../shared/components/typography';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Badge from '../../../shared/components/feedback/Badge';
import { Button, IconButton } from '../../../shared/components/buttons';
import { FlexBox, Grid } from '../../../shared/components/layout';
import notificationService from '../../../common/services/notificationService';
import {
  phone as phoneIcon,
  location as locationIcon,
  truck as truckIcon,
  calendar as calendarIcon,
  clock as clockIcon,
} from '@fortawesome/free-solid-svg-icons'; // version ^6.4.0
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // version ^0.2.0

/**
 * Interface defining the props for the ShipmentDetailsCard component
 */
interface ShipmentDetailsCardProps {
  loadId: string;
  className?: string;
  refreshInterval?: number;
  onViewDocuments?: () => void;
}

/**
 * Styled card component for the shipment details
 */
const StyledCard = styled(Card)`
  width: 100%;
  margin-bottom: 20px;
`;

/**
 * Header section with title and refresh button
 */
const CardHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #DADCE0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Main content area for the shipment details
 */
const CardContent = styled.div`
  padding: 20px;
  min-height: 200px;
  position: relative;
`;

/**
 * Empty state message when no shipment details are available
 */
const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #5F6368;
  font-style: italic;
`;

/**
 * Container for shipment details content
 */
const ShipmentContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

/**
 * Section for status and ETA information
 */
const StatusSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

/**
 * Container for ETA information
 */
const ETAInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Section for origin and destination information
 */
const LocationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Section for carrier and driver information
 */
const CarrierSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Section for load details
 */
const LoadSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/**
 * Container for action buttons
 */
const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

/**
 * Container for individual info items
 */
const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

/**
 * Title for each section
 */
const SectionTitle = styled(Text)`
  font-weight: 600;
  margin-bottom: 12px;
  color: #202124;
`;

/**
 * A card component that displays detailed information about a shipment in the shipper portal.
 */
const ShipmentDetailsCard: React.FC<ShipmentDetailsCardProps> = ({
  loadId,
  className,
  refreshInterval = 60000,
  onViewDocuments,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [shipmentDetails, setShipmentDetails] = useState<LoadWithDetails | null>(null);
  const [etaInfo, setEtaInfo] = useState<ETAResponse | null>(null);

  /**
   * Fetches the shipment details for a given load ID
   */
  const fetchShipmentDetails = async () => {
    setLoading(true);
    try {
      const load = await getLoadById(loadId, true) as LoadWithDetails;
      setShipmentDetails(load);

      if (load.status === LoadStatus.IN_TRANSIT) {
        await fetchETA();
      }
    } catch (error) {
      notificationService.showErrorNotification(`Failed to fetch shipment details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches the estimated time of arrival for a load in transit
   */
  const fetchETA = async () => {
    try {
      const eta = await getLoadETA(loadId);
      setEtaInfo(eta);
    } catch (error) {
      notificationService.showErrorNotification(`Failed to fetch ETA: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchShipmentDetails();
  }, [loadId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchShipmentDetails();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [loadId, refreshInterval, fetchShipmentDetails]);

  /**
   * Determines the badge variant based on load status
   * @param status LoadStatus
   * @returns string
   */
  const getStatusBadgeVariant = (status: LoadStatus): string => {
    switch (status) {
      case LoadStatus.DELIVERED:
      case LoadStatus.COMPLETED:
        return 'success';
      case LoadStatus.IN_TRANSIT:
        return 'info';
      case LoadStatus.DELAYED:
        return 'warning';
      case LoadStatus.EXCEPTION:
        return 'error';
      default:
        return 'primary';
    }
  };

  /**
   * Filters locations to find a specific location type
   * @param locations LoadLocation[]
   * @param locationType LoadLocationType
   * @returns LoadLocation | undefined
   */
  const getLocationByType = (locations: LoadLocation[], locationType: LoadLocationType): LoadLocation | undefined => {
    return locations.find((loc) => loc.locationType === locationType);
  };

  /**
   * Manually refreshes the shipment details
   */
  const handleRefresh = () => {
    fetchShipmentDetails();
  };

  /**
   * Handles the action to contact the driver
   */
  const handleContactDriver = () => {
    if (shipmentDetails?.assignments && shipmentDetails.assignments.length > 0) {
      const driverPhoneNumber = shipmentDetails.assignments[0].driverId; // Replace with actual driver phone number
      if (driverPhoneNumber) {
        window.location.href = `tel:${driverPhoneNumber}`;
      } else {
        notificationService.showErrorNotification('Driver contact information not available.');
      }
    } else {
      notificationService.showErrorNotification('Driver information not available.');
    }
  };

  /**
   * Handles the action to contact the carrier
   */
  const handleContactCarrier = () => {
    if (shipmentDetails?.shipper) {
      const carrierPhoneNumber = shipmentDetails.shipper.contactInfo.phone; // Replace with actual carrier phone number
      if (carrierPhoneNumber) {
        window.location.href = `tel:${carrierPhoneNumber}`;
      } else {
        notificationService.showErrorNotification('Carrier contact information not available.');
      }
    } else {
      notificationService.showErrorNotification('Carrier information not available.');
    }
  };

  return (
    <StyledCard className={className}>
      <CardHeader>
        <Heading level={4}>Shipment Details</Heading>
        <IconButton variant="ghost" ariaLabel="Refresh" onClick={handleRefresh} icon={<FontAwesomeIcon icon={clockIcon} />} />
      </CardHeader>
      <CardContent>
        {loading && <LoadingIndicator label="Loading shipment details..." />}
        {!loading && !shipmentDetails && <EmptyState>No shipment details available.</EmptyState>}
        {!loading && shipmentDetails && (
          <ShipmentContent>
            <StatusSection>
              <Badge variant={getStatusBadgeVariant(shipmentDetails.status)} content={shipmentDetails.status} />
              {etaInfo && shipmentDetails.status === LoadStatus.IN_TRANSIT && (
                <ETAInfo>
                  <FontAwesomeIcon icon={clockIcon} />
                  <Text>{formatDateTime(etaInfo.estimatedArrivalTime)}</Text>
                </ETAInfo>
              )}
            </StatusSection>
            <Grid columns={{ xs: 1, md: 2 }} gap="md">
              <LocationSection>
                <SectionTitle>Pickup</SectionTitle>
                {shipmentDetails.locations && getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP) && (
                  <>
                    <InfoItem>
                      <FontAwesomeIcon icon={locationIcon} />
                      <Text>{getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.facilityName}</Text>
                    </InfoItem>
                    <InfoItem>
                      <Text>{getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.address.street1}, {getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.address.city}, {getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.address.state} {getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.address.zipCode}</Text>
                    </InfoItem>
                    <InfoItem>
                      <FontAwesomeIcon icon={calendarIcon} />
                      <Text>{formatDateTime(getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.earliestTime)} - {formatDateTime(getLocationByType(shipmentDetails.locations, LoadLocationType.PICKUP)?.latestTime)}</Text>
                    </InfoItem>
                  </>
                )}
              </LocationSection>
              <LocationSection>
                <SectionTitle>Delivery</SectionTitle>
                {shipmentDetails.locations && getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY) && (
                  <>
                    <InfoItem>
                      <FontAwesomeIcon icon={locationIcon} />
                      <Text>{getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.facilityName}</Text>
                    </InfoItem>
                    <InfoItem>
                      <Text>{getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.address.street1}, {getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.address.city}, {getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.address.state} {getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.address.zipCode}</Text>
                    </InfoItem>
                    <InfoItem>
                      <FontAwesomeIcon icon={calendarIcon} />
                      <Text>{formatDateTime(getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.earliestTime)} - {formatDateTime(getLocationByType(shipmentDetails.locations, LoadLocationType.DELIVERY)?.latestTime)}</Text>
                    </InfoItem>
                  </>
                )}
              </LocationSection>
              <CarrierSection>
                <SectionTitle>Carrier</SectionTitle>
                <InfoItem>
                  <FontAwesomeIcon icon={truckIcon} />
                  <Text>{shipmentDetails.shipper.name}</Text>
                </InfoItem>
                {shipmentDetails.assignments && shipmentDetails.assignments.length > 0 && (
                  <>
                    <SectionTitle>Driver</SectionTitle>
                    <InfoItem>
                      <FontAwesomeIcon icon={driverIcon} />
                      <Text>{shipmentDetails.assignments[0].driverId}</Text>
                    </InfoItem>
                  </>
                )}
              </CarrierSection>
              <LoadSection>
                <SectionTitle>Load Details</SectionTitle>
                <InfoItem>
                  <Text>Weight: {formatWeight(shipmentDetails.weight)}</Text>
                </InfoItem>
                <InfoItem>
                  <Text>Equipment: {shipmentDetails.equipmentType}</Text>
                </InfoItem>
              </LoadSection>
            </Grid>
            <ActionButtons>
              <Button variant="secondary" onClick={handleContactDriver} startIcon={<FontAwesomeIcon icon={phoneIcon} />}>
                Contact Driver
              </Button>
              <Button variant="secondary" onClick={handleContactCarrier} startIcon={<FontAwesomeIcon icon={phoneIcon} />}>
                Contact Carrier
              </Button>
              {onViewDocuments && (
                <Button variant="secondary" onClick={onViewDocuments} startIcon={<FontAwesomeIcon icon={document} />}>
                  View Documents
                </Button>
              )}
            </ActionButtons>
          </ShipmentContent>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default ShipmentDetailsCard;