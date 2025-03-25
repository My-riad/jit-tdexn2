import React, { useState, useEffect } from 'react'; //  ^18.2.0
import styled from 'styled-components'; //  ^5.3.10

import Card from '../../../shared/components/cards/Card'; // Base card component for consistent styling
import Heading from '../../../shared/components/typography/Heading'; // Typography component for section headings
import Text from '../../../shared/components/typography/Text'; // Typography component for regular text
import FlexBox from '../../../shared/components/layout/FlexBox'; // Flexible layout component for arranging content
import MapView from '../../../shared/components/maps/MapView'; // Map component for displaying load locations
import Button from '../../../shared/components/buttons/Button'; // Button component for actions
import LoadStatusTimeline from './LoadStatusTimeline'; // Component for displaying the load status history timeline
import { LoadWithDetails, LoadStatus, EquipmentType } from '../../../common/interfaces/load.interface'; // Type definition for load data with all related details
import loadService from '../../services/loadService'; // Service for load data operations

// Styled components for consistent styling
const StyledCard = styled(Card)`
  padding: 0;
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const CardSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MapContainer = styled.div`
  height: 300px;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
`;

interface StatusBadgeProps {
  status: LoadStatus;
}

const StatusBadge = styled.div<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background-color: ${({ status }) => getStatusColor(status)};
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
`;

const LocationItem = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

// Interface for the component properties
interface LoadDetailCardProps {
  loadId: string;
  load?: LoadWithDetails;
  onStatusUpdate?: (loadId: string, newStatus: LoadStatus) => void;
  className?: string;
}

// Interface for tracking information
interface TrackingInfo {
  position: { latitude: number; longitude: number; heading: number; speed: number; timestamp: string } | null;
  eta: { estimatedArrival: string; remainingDistance: number; remainingTime: number } | null;
}

/**
 * Formats a date string into a human-readable format
 * @param dateString 
 * @returns Formatted date string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formats a number as a currency string
 * @param amount 
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Returns the appropriate color for a load status
 * @param status 
 * @returns Color code or name
 */
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.CREATED:
    case LoadStatus.PENDING:
    case LoadStatus.OPTIMIZING:
    case LoadStatus.AVAILABLE:
      return '#1A73E8'; // Blue
    case LoadStatus.RESERVED:
    case LoadStatus.ASSIGNED:
      return '#FBBC04'; // Orange
    case LoadStatus.IN_TRANSIT:
    case LoadStatus.AT_PICKUP:
    case LoadStatus.LOADED:
    case LoadStatus.AT_DROPOFF:
      return '#34A853'; // Green
    case LoadStatus.DELIVERED:
    case LoadStatus.COMPLETED:
      return '#34A853'; // Green
    case LoadStatus.CANCELLED:
    case LoadStatus.EXPIRED:
      return '#EA4335'; // Red
    case LoadStatus.DELAYED:
    case LoadStatus.EXCEPTION:
      return '#FBBC04'; // Orange
    default:
      return '#5F6368'; // Gray
  }
};

/**
 * Returns a human-readable label for an equipment type
 * @param type 
 * @returns Human-readable equipment type label
 */
const getEquipmentTypeLabel = (type: EquipmentType): string => {
  switch (type) {
    case EquipmentType.DRY_VAN:
      return 'Dry Van';
    case EquipmentType.REFRIGERATED:
      return 'Refrigerated';
    case EquipmentType.FLATBED:
      return 'Flatbed';
    default:
      return 'Unknown Equipment Type';
  }
};

/**
 * Component that displays detailed information about a freight load
 * @param props 
 * @returns Rendered component
 */
export const LoadDetailCard: React.FC<LoadDetailCardProps> = ({ loadId, load, onStatusUpdate, className }) => {
  // Initialize state for load data, loading, error, and tracking information
  const [loadData, setLoadData] = useState<LoadWithDetails | null>(load || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo>({ position: null, eta: null });

  // Fetch load data when component mounts or loadId changes
  useEffect(() => {
    const fetchLoadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadService.getLoadById(loadId, true);
        setLoadData(data as LoadWithDetails);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoadData();
  }, [loadId]);

  // Fetch tracking data for the load if it's in transit
  useEffect(() => {
    const fetchTrackingData = async () => {
      if (loadData && loadData.status === LoadStatus.IN_TRANSIT) {
        try {
          const tracking = await loadService.getLoadTracking(loadId);
          setTrackingInfo({
            position: tracking?.position || null,
            eta: tracking?.eta || null,
          });
        } catch (e: any) {
          console.error('Error fetching tracking data:', e);
        }
      }
    };

    fetchTrackingData();
  }, [loadData, loadId]);

  // Render loading state if data is being fetched
  if (loading) {
    return <StyledCard className={className}>Loading...</StyledCard>;
  }

  // Render error state if there was an error fetching data
  if (error) {
    return <StyledCard className={className}>Error: {error}</StyledCard>;
  }

  // Render the load details card with sections for general info, locations, status, and actions
  return (
    <StyledCard className={className}>
      <CardHeader>
        <Heading level={2}>Load {loadData?.referenceNumber}</Heading>
      </CardHeader>
      <CardBody>
        <CardSection>
          <Heading level={4}>General Information</Heading>
          <Text>Description: {loadData?.description}</Text>
          <Text>Commodity: {loadData?.commodity}</Text>
          <Text>Equipment Type: {getEquipmentTypeLabel(loadData?.equipmentType)}</Text>
          <Text>Weight: {loadData?.weight} lbs</Text>
        </CardSection>

        <CardSection>
          <Heading level={4}>Locations</Heading>
          {loadData?.locations.map((location, index) => (
            <LocationItem key={index}>
              <Text variant="label">
                {location.locationType}: {location.facilityName}
              </Text>
              <Text>{location.address.street1}</Text>
              <Text>
                {location.address.city}, {location.address.state} {location.address.zipCode}
              </Text>
            </LocationItem>
          ))}
        </CardSection>

        <CardSection>
          <Heading level={4}>Status</Heading>
          <StatusBadge status={loadData?.status}>{loadData?.status}</StatusBadge>
          <LoadStatusTimeline statusHistory={loadData?.statusHistory || []} currentStatus={loadData?.status} />
        </CardSection>

        {/* Include a map showing the load's route */}
        <CardSection>
          <Heading level={4}>Map View</Heading>
          <MapContainer>
            <MapView
              initialCenter={loadData?.locations[0].coordinates}
            />
          </MapContainer>
        </CardSection>

        {/* Include action buttons appropriate to the load's current status */}
        <ActionButtons>
          <Button variant="primary" onClick={() => onStatusUpdate?.(loadId, LoadStatus.IN_TRANSIT)}>
            Mark as In Transit
          </Button>
          <Button variant="secondary">Contact Carrier</Button>
        </ActionButtons>
      </CardBody>
    </StyledCard>
  );
};