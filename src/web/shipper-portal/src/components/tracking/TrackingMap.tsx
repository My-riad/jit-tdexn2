# src/web/shipper-portal/src/components/tracking/TrackingMap.tsx
```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react'; //  ^18.2.0
import styled from 'styled-components'; //  ^5.3.10
import MapView, { MapViewRef } from '../../../shared/components/maps/MapView';
import TruckMarker from '../../../shared/components/maps/TruckMarker';
import LoadMarker from '../../../shared/components/maps/LoadMarker';
import RouteLine from '../../../shared/components/maps/RouteLine';
import {
  Position,
  EntityPosition,
  EntityType,
  TrajectoryResponse,
} from '../../../common/interfaces/tracking.interface';
import { Load } from '../../../common/interfaces/load.interface';
import { Vehicle } from '../../../common/interfaces/vehicle.interface';
import trackingService from '../../services/trackingService';
import { colors } from '../../../shared/styles/colors';

/**
 * Interface defining the props for the TrackingMap component.
 */
interface TrackingMapProps {
  /**
   * ID of the load to track. This is a required property.
   */
  loadId: string;
  /**
   * Width of the map container. Defaults to '100%'.
   */
  width?: string | number;
  /**
   * Height of the map container. Defaults to '400px'.
   */
  height?: string | number;
  /**
   * Whether to show map navigation controls. Defaults to true.
   */
  showControls?: boolean;
  /**
   * Whether to show load details in tooltips. Defaults to true.
   */
  showLoadDetails?: boolean;
  /**
   * Callback function when a vehicle marker is clicked.
   */
  onVehicleClick?: (vehicle: Vehicle) => void;
  /**
   * Additional CSS class name for styling purposes.
   */
  className?: string;
  /**
   * Interval in milliseconds to refresh tracking data if real-time updates fail. Defaults to 30000 (30 seconds).
   */
  refreshInterval?: number;
}

/**
 * Internal interface for tracking data state.
 */
interface TrackingData {
  load: Load | null;
  vehicle: Vehicle | null;
  currentPosition: EntityPosition | null;
  route: TrajectoryResponse | null;
  eta: { estimatedArrivalTime: string; remainingDistance: number; } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Styled component for the map container.
 */
const MapContainer = styled.div`
  position: relative;
  width: ${(props: { width?: string | number }) => props.width || '100%'};
  height: ${(props: { height?: string | number }) => props.height || '400px'};
  border-radius: 8px;
  overflow: hidden;
`;

/**
 * Styled component for the loading indicator overlay.
 */
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

/**
 * Styled component for the animated loading spinner.
 */
const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #1A73E8;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Styled component for the error message overlay.
 */
const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  padding: 20px;
`;

/**
 * Styled component for the error message text.
 */
const ErrorMessage = styled.div`
  color: #EA4335;
  text-align: center;
  font-weight: 500;
`;

/**
 * A specialized map component for displaying real-time tracking information for shipments.
 */
const TrackingMap: React.FC<TrackingMapProps> = ({
  loadId,
  width = '100%',
  height = '400px',
  showControls = true,
  showLoadDetails = true,
  onVehicleClick,
  className,
  refreshInterval = 30000,
}) => {
  // LD1: Initialize state for tracking data
  const [trackingData, setTrackingData] = useState<TrackingData>({
    load: null,
    vehicle: null,
    currentPosition: null,
    route: null,
    eta: null,
    isLoading: false,
    error: null,
  });

  // LD2: Initialize state for subscription status
  const [isSubscribed, setIsSubscribed] = useState(false);

  // LD3: Create a ref for the MapView component
  const mapRef = useRef<MapViewRef>(null);

  // LD4: Fetch initial tracking data when component mounts or loadId changes
  useEffect(() => {
    const fetchTrackingData = async () => {
      setTrackingData(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const trackingInfo = await trackingService.getLoadTracking(loadId);
        setTrackingData(prev => ({
          ...prev,
          load: trackingInfo.position?.entityType === EntityType.LOAD ? trackingInfo.position.metadata?.load : null,
          vehicle: trackingInfo.position?.entityType === EntityType.VEHICLE ? trackingInfo.position.metadata?.vehicle : null,
          currentPosition: trackingInfo.position || null,
          route: trackingInfo.route || null,
          eta: trackingInfo.eta || null,
        }));
      } catch (error: any) {
        setTrackingData(prev => ({ ...prev, error: error.message }));
      } finally {
        setTrackingData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchTrackingData();
  }, [loadId]);

  // LD5: Subscribe to real-time position updates for the load
  useEffect(() => {
    if (!trackingData.load || !trackingData.vehicle) return;

    const subscribeToUpdates = () => {
      return trackingService.subscribeToLoadUpdates(
        loadId,
        (position: EntityPosition) => {
          setTrackingData(prev => ({ ...prev, currentPosition: position }));
        },
        (status: string, details: any) => {
          // Handle status updates if needed
        },
        (error: Error) => {
          console.error('Error subscribing to load updates', error);
        }
      );
    };

    const unsubscribe = subscribeToUpdates();
    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [loadId, trackingData.load, trackingData.vehicle]);

  // LD6: Set up fallback polling interval if real-time updates aren't available
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (!isSubscribed && loadId) {
      intervalId = setInterval(() => {
        // Fetch tracking data periodically if not subscribed
        trackingService.getLoadTracking(loadId)
          .then(trackingInfo => {
            setTrackingData(prev => ({
              ...prev,
              load: trackingInfo.position?.entityType === EntityType.LOAD ? trackingInfo.position.metadata?.load : null,
              vehicle: trackingInfo.position?.entityType === EntityType.VEHICLE ? trackingInfo.position.metadata?.vehicle : null,
              currentPosition: trackingInfo.position || null,
              route: trackingInfo.route || null,
              eta: trackingInfo.eta || null,
            }));
          })
          .catch(error => {
            console.error('Error fetching tracking data', error);
          });
      }, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loadId, isSubscribed, refreshInterval]);

  // LD7: Clean up subscriptions when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup logic here if needed
    };
  }, []);

  // LD8: Define route coordinates based on tracking data
  const routeCoordinates = trackingData.route?.trajectory?.coordinates as [number, number][] || [];

  // LD9: Handler for vehicle marker clicks
  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    if (onVehicleClick) {
      onVehicleClick(vehicle);
    }
  }, [onVehicleClick]);

  return (
    <MapContainer width={width} height={height} className={className}>
      <MapView
        ref={mapRef}
        width="100%"
        height="100%"
        showControls={showControls}
      >
        {trackingData.load && trackingData.load.locations && trackingData.load.locations.length > 0 && (
          <LoadMarker
            load={trackingData.load}
            showTooltip={showLoadDetails}
          />
        )}
        {trackingData.load && trackingData.load.locations && trackingData.load.locations.length > 1 && (
          <LoadMarker
            load={trackingData.load}
            showTooltip={showLoadDetails}
          />
        )}
        {trackingData.route && trackingData.route.trajectory && (
          <RouteLine
            coordinates={routeCoordinates}
            color={colors.mapColors.routeLine}
            width={3}
          />
        )}
        {trackingData.vehicle && trackingData.currentPosition && (
          <TruckMarker
            vehicle={trackingData.vehicle}
            position={trackingData.currentPosition?.position}
            onClick={handleVehicleClick}
          />
        )}
      </MapView>
      {trackingData.isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
      {trackingData.error && (
        <ErrorOverlay>
          <ErrorMessage>{trackingData.error}</ErrorMessage>
        </ErrorOverlay>
      )}
    </MapContainer>
  );
};

export default TrackingMap;