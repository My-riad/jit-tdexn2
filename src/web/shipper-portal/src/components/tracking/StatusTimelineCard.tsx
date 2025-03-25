import React, { useState, useEffect } from 'react'; // React library for building the component. Version: ^17.0.0
import styled from 'styled-components'; // Styled-components library for component styling. Version: ^5.3.0
import { Card } from '../../../shared/components/cards/Card'; // Base card component for consistent styling
import { LoadStatusTimeline } from '../loads/LoadStatusTimeline'; // Component for rendering the status timeline
import { LoadStatus, LoadStatusHistory, LoadWithDetails } from '../../../common/interfaces/load.interface'; // Enum of possible load statuses for the timeline, Interface defining the structure of load status history records, Interface for load data with detailed information including status history
import trackingService from '../../services/trackingService'; // Service for tracking functionality and real-time updates

/**
 * Interface defining the props for the StatusTimelineCard component.
 */
interface StatusTimelineCardProps {
  /**
   * Load data with status history. This is a required property.
   */
  load: LoadWithDetails;
  /**
   * Optional CSS class name for styling.
   */
  className?: string;
  /**
   * Whether to display a more compact version of the timeline. Defaults to false.
   */
  compact?: boolean;
  /**
   * Interval in milliseconds to refresh status data. Defaults to 30000 (30 seconds).
   */
  refreshInterval?: number;
  /**
   * Whether to show a manual refresh button. Defaults to true.
   */
  showRefreshButton?: boolean;
}

/**
 * Styled Card component with custom styling for the status timeline.
 */
const StyledCard = styled(Card)`
  width: 100%;
  height: 100%;
  overflow: auto;
`;

/**
 * Header section of the card.
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

/**
 * Title of the card.
 */
const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: #202124;
  margin: 0;
`;

/**
 * Button to manually refresh status data.
 */
const RefreshButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #1A73E8;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(26, 115, 232, 0.1);
  }

  &:disabled {
    color: #9AA0A6;
    cursor: not-allowed;
  }
`;

/**
 * Refresh icon for the refresh button.
 */
const RefreshIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  animation: isRefreshing ? 'spin 1s linear infinite' : 'none';

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * A card component that displays a timeline of status updates for a shipment in the shipper portal.
 * It shows the chronological progression of a load's status changes with timestamps, locations,
 * and visual indicators for each status point.
 */
const StatusTimelineCard: React.FC<StatusTimelineCardProps> = ({
  load,
  className,
  compact = false,
  refreshInterval = 30000,
  showRefreshButton = true,
}) => {
  // State to store the status history of the load
  const [statusHistory, setStatusHistory] = useState<LoadStatusHistory[]>(load.statusHistory);
  // State to store the current status of the load
  const [currentStatus, setCurrentStatus] = useState<LoadStatus>(load.status);
  // State to track whether the component is currently refreshing data
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  /**
   * useEffect hook to initialize status history and current status from load data.
   * This effect runs whenever the 'load' prop changes.
   */
  useEffect(() => {
    setStatusHistory(load.statusHistory);
    setCurrentStatus(load.status);
  }, [load]);

  /**
   * useEffect hook to set up a subscription to real-time status updates for the load.
   * This effect runs when the component mounts and whenever the 'load.id' or 'refreshInterval' props change.
   * It also sets up a cleanup function to unsubscribe from the updates when the component unmounts.
   */
  useEffect(() => {
    // Function to handle real-time status updates
    const handleStatusUpdate = (status: string, details: any) => {
      setCurrentStatus(status as LoadStatus);
      setStatusHistory(prevHistory => [
        {
          id: `new-${Date.now()}`, // Generate a unique ID for the new status
          loadId: load.id,
          status: status as LoadStatus,
          statusDetails: details,
          coordinates: null, // Coordinates are not provided in the real-time update
          updatedBy: 'system', // Indicate that the update is from the system
          timestamp: new Date().toISOString(),
        },
        ...prevHistory, // Add the new status to the beginning of the history
      ]);
    };

    // Subscribe to real-time status updates using the tracking service
    const unsubscribe = trackingService.subscribeToLoadUpdates(
      load.id,
      () => { /* Position updates are not handled in this component */ },
      handleStatusUpdate,
      (error: Error) => {
        console.error('Error subscribing to load updates', error);
      }
    );

    // Set up an interval to periodically refresh the status data
    const intervalId = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    // Clean up function to unsubscribe and clear the interval when the component unmounts
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [load.id, refreshInterval]);

  /**
   * Function to manually refresh status data.
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    trackingService.getLoadTracking(load.id)
      .then(trackingData => {
        if (trackingData && trackingData.position) {
          // Update statusHistory and currentStatus based on the fetched data
          setStatusHistory(load.statusHistory);
          setCurrentStatus(load.status);
        }
      })
      .catch(error => {
        console.error('Error refreshing load status', error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  return (
    <StyledCard className={className} elevation="low" padding={compact ? 'sm' : 'md'}>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
        {showRefreshButton && (
          <RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshIcon style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
              {/* You can replace this with an actual refresh icon component */}
              🔄
            </RefreshIcon>
            Refresh
          </RefreshButton>
        )}
      </CardHeader>
      <LoadStatusTimeline statusHistory={statusHistory} currentStatus={currentStatus} compact={compact} />
    </StyledCard>
  );
};

export default StatusTimelineCard;