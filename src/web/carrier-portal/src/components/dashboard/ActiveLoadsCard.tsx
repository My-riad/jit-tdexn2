import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import StatsCard from '../../../shared/components/cards/StatsCard';
import Card from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import { getCarrierLoads } from '../../services/loadService';
import { LoadStatus } from '../../../common/interfaces/load.interface';
import { theme } from '../../../shared/styles/theme';
import { TruckIcon, ArrowPathIcon, BuildingStorefrontIcon, ClockIcon } from '@heroicons/react/24/outline'; // version ^2.0.13

/**
 * Interface defining the props for the ActiveLoadsCard component
 */
interface ActiveLoadsCardProps {
  className?: string;
  carrierId: string;
  onViewLoads?: () => void;
}

/**
 * Interface defining the structure for active loads data
 */
interface ActiveLoadsData {
  inTransit: number;
  atPickup: number;
  atDelivery: number;
  pending: number;
  total: number;
}

/**
 * Styled wrapper for the active loads card
 */
const StyledActiveLoadsCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

/**
 * Styled component for the card title
 */
const CardTitle = styled.h2`
  font-size: ${theme.typography.size.lg};
  font-weight: ${theme.typography.weight.bold};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

/**
 * Grid container for the stats cards
 */
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

/**
 * Footer section of the card with action button
 */
const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
`;

/**
 * Component that displays a summary of the carrier's active loads
 */
const ActiveLoadsCard: React.FC<ActiveLoadsCardProps> = ({ className, carrierId, onViewLoads }) => {
  // Initialize state for active loads data with default values
  const [activeLoads, setActiveLoads] = useState<ActiveLoadsData>({
    inTransit: 0,
    atPickup: 0,
    atDelivery: 0,
    pending: 0,
    total: 0,
  });

  // Create a loading state to handle data fetching
  const [loading, setLoading] = useState(true);

  // Use useEffect to fetch active loads data when component mounts
  useEffect(() => {
    // Call getCarrierLoads service function with appropriate status filters
    const fetchData = async () => {
      try {
        const inTransitLoads = await getCarrierLoads(carrierId, { status: [LoadStatus.IN_TRANSIT] });
        const atPickupLoads = await getCarrierLoads(carrierId, { status: [LoadStatus.AT_PICKUP] });
        const atDeliveryLoads = await getCarrierLoads(carrierId, { status: [LoadStatus.AT_DROPOFF] });
        const pendingLoads = await getCarrierLoads(carrierId, { status: [LoadStatus.PENDING] });

        // Process the returned data to count loads by status
        const inTransitCount = inTransitLoads.total;
        const atPickupCount = atPickupLoads.total;
        const atDeliveryCount = atDeliveryLoads.total;
        const pendingCount = pendingLoads.total;
        const totalCount = inTransitCount + atPickupCount + atDeliveryCount + pendingCount;

        // Update state with the processed counts and set loading to false
        setActiveLoads({
          inTransit: inTransitCount,
          atPickup: atPickupCount,
          atDelivery: atDeliveryCount,
          pending: pendingCount,
          total: totalCount,
        });
      } catch (error) {
        // Handle any errors during data fetching
        console.error('Failed to fetch active loads', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carrierId]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <Card className={className}>
        <StyledActiveLoadsCard>
          <CardTitle>Active Loads</CardTitle>
          <div>Loading...</div>
        </StyledActiveLoadsCard>
      </Card>
    );
  }

  return (
    // Render a Card component containing the active loads information
    <Card className={className}>
      <StyledActiveLoadsCard>
        <CardTitle>Active Loads</CardTitle>
        <StatsContainer>
          {/* Display multiple StatsCard components for different load statuses */}
          {/* Include StatsCard for In Transit loads with count and appropriate icon */}
          <StatsCard
            title="In Transit"
            value={activeLoads.inTransit}
            icon={<ArrowPathIcon />}
            color="primary"
          />
          {/* Include StatsCard for At Pickup loads with count */}
          <StatsCard
            title="At Pickup"
            value={activeLoads.atPickup}
            icon={<BuildingStorefrontIcon />}
            color="success"
          />
          {/* Include StatsCard for At Delivery loads with count */}
          <StatsCard
            title="At Delivery"
            value={activeLoads.atDelivery}
            icon={<BuildingStorefrontIcon />}
            color="success"
          />
          {/* Include StatsCard for Pending loads with count */}
          <StatsCard
            title="Pending"
            value={activeLoads.pending}
            icon={<ClockIcon />}
            color="warning"
          />
        </StatsContainer>
        {/* Add a View Loads button that navigates to the loads management page */}
        <CardFooter>
          <Button variant="primary" onClick={onViewLoads}>
            View Loads
          </Button>
        </CardFooter>
      </StyledActiveLoadsCard>
    </Card>
  );
};

export default ActiveLoadsCard;
export type { ActiveLoadsCardProps };