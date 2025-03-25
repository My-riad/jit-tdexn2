import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import StatsCard from '../../../shared/components/cards/StatsCard';
import Card from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import { getFleetSummary } from '../../services/fleetService';
import { VehicleStatus } from '../../../common/interfaces/vehicle.interface';
import { theme } from '../../../shared/styles/theme';
import { TruckIcon, CheckCircleIcon, WrenchIcon } from '@heroicons/react/24/outline'; // version ^2.0.13

/**
 * Interface defining the props for the FleetSummaryCard component.
 */
interface FleetSummaryCardProps {
  /**
   * Optional CSS class name for styling.
   */
  className?: string;
  /**
   * ID of the carrier to fetch fleet data for.
   */
  carrierId: string;
  /**
   * Callback function when View Fleet button is clicked.
   */
  onViewFleet?: () => void;
}

/**
 * Interface defining the structure of the fleet summary data.
 */
interface FleetSummaryData {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  fleetUtilizationPercentage: number;
}

/**
 * Styled wrapper for the fleet summary card.
 */
const StyledFleetSummaryCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

/**
 * Styled component for the card title.
 */
const CardTitle = styled.h2`
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.bold};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

/**
 * Grid container for the stats cards.
 */
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};

  /* Media query for larger screens */
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

/**
 * Footer section of the card with action button.
 */
const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.md};
`;

/**
 * Component that displays a summary of the carrier's fleet.
 * @param {FleetSummaryCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered FleetSummaryCard component.
 */
const FleetSummaryCard: React.FC<FleetSummaryCardProps> = ({ className, carrierId, onViewFleet }) => {
  // Initialize state for fleet summary data with default values
  const [fleetSummary, setFleetSummary] = useState<FleetSummaryData>({
    totalVehicles: 0,
    activeVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    fleetUtilizationPercentage: 0,
  });

  // Create a loading state to handle data fetching
  const [loading, setLoading] = useState(true);

  // Use useEffect to fetch fleet summary data when component mounts
  useEffect(() => {
    // Define an async function to fetch the data
    const fetchFleetSummary = async () => {
      try {
        // Call getFleetSummary service function to retrieve data from API
        const data = await getFleetSummary(carrierId);

        // Update state with fetched data and set loading to false
        setFleetSummary({
          totalVehicles: data.totalVehicles,
          activeVehicles: data.activeVehicles,
          availableVehicles: data.availableVehicles,
          maintenanceVehicles: data.maintenanceVehicles,
          fleetUtilizationPercentage: data.fleetUtilizationPercentage,
        });
      } catch (error) {
        // Handle any errors during data fetching
        console.error('Failed to fetch fleet summary:', error);
      } finally {
        // Set loading to false regardless of success or failure
        setLoading(false);
      }
    };

    // Call the fetchFleetSummary function
    fetchFleetSummary();
  }, [carrierId]); // Dependency array ensures useEffect runs only when carrierId changes

  // Render a Card component containing the fleet summary information
  return (
    <Card className={className}>
      <StyledFleetSummaryCard>
        <CardTitle>Fleet Summary</CardTitle>

        {loading ? (
          <div>Loading fleet summary...</div>
        ) : (
          <>
            {/* Display multiple StatsCard components for different fleet metrics */}
            <StatsContainer>
              {/* Include StatsCard for total trucks with appropriate icon */}
              <StatsCard
                title="Total Trucks"
                value={fleetSummary.totalVehicles}
                icon={<TruckIcon />}
              />

              {/* Include StatsCard for active trucks with count */}
              <StatsCard
                title="Active Trucks"
                value={fleetSummary.activeVehicles}
                color="success"
                icon={<CheckCircleIcon />}
              />

              {/* Include StatsCard for available trucks with count */}
              <StatsCard
                title="Available Trucks"
                value={fleetSummary.availableVehicles}
                color="primary"
                icon={<CheckCircleIcon />}
              />

              {/* Include StatsCard for trucks in maintenance with count */}
              <StatsCard
                title="In Maintenance"
                value={fleetSummary.maintenanceVehicles}
                color="warning"
                icon={<WrenchIcon />}
              />
            </StatsContainer>

            {/* Add a View Fleet button that navigates to the fleet management page */}
            <CardFooter>
              <Button variant="secondary" onClick={onViewFleet}>
                View Fleet
              </Button>
            </CardFooter>
          </>
        )}
      </StyledFleetSummaryCard>
    </Card>
  );
};

export default FleetSummaryCard;
export type { FleetSummaryCardProps };