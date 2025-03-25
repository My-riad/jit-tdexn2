# src/web/shipper-portal/src/components/dashboard/ShipmentMap.tsx
```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react'; //  ^18.2.0
import { styled } from 'styled-components'; //  ^5.3.11
import { debounce } from 'lodash'; //  ^4.17.21

import MapView, { MapViewRef } from '../../../../shared/components/maps/MapView';
import LoadMarker from '../../../../shared/components/maps/LoadMarker';
import RouteLine from '../../../../shared/components/maps/RouteLine';
import Card from '../../../../shared/components/cards/Card';
import Button from '../../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../../shared/components/feedback/LoadingIndicator';
import { EntityType, Position } from '../../../../common/interfaces/tracking.interface';
import { Load, LoadStatus, LoadSummary } from '../../../../common/interfaces/load.interface';
import { getLoads } from '../../services/loadService';
import { getLoadTracking } from '../../services/loadService';
import { getRouteVisualization } from '../../services/trackingService';

/**
 * Interface for extended load data with position information
 */
interface LoadWithPosition {
  load: LoadSummary;
  position: Position | null;
}

/**
 * Interface for route data used in map visualization
 */
interface RouteData {
  loadId: string;
  route: any;
  origin: Position;
  destination: Position;
  currentPosition: Position | null;
}

/**
 * Interface defining the properties for the ShipmentMap component
 */
interface ShipmentMapProps {
  height?: string | number;
  width?: string | number;
  title?: string;
  showFilters?: boolean;
  showRefresh?: boolean;
  initialFilters?: { [key: string]: boolean };
  onLoadSelect?: (load: Load) => void;
  selectedLoadId?: string;
  className?: string;
  refreshInterval?: number;
}

/**
 * Styled component for the map container
 */
const MapContainer = styled.div`
  position: relative;
  width: ${props => props.width};
  height: ${props => props.height};
  border-radius: 8px;
  overflow: hidden;
`;

/**
 * Styled component for the card header
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

/**
 * Styled component for the card title
 */
const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
`;

/**
 * Styled component for the filter controls
 */
const FilterControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

/**
 * Styled component for a filter option
 */
const FilterOption = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
`;

/**
 * Styled component for displaying error messages
 */
const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 0, 0, 0.1);
  color: red;
  padding: 16px;
  border-radius: 8px;
  z-index: 10;
`;

/**
 * A map component for the shipper portal dashboard that displays active shipments with their current locations, routes, and status.
 */
const ShipmentMap: React.FC<ShipmentMapProps> = ({
  height = '400px',
  width = '100%',
  title = 'Shipment Map',
  showFilters = true,
  showRefresh = true,
  initialFilters = { showInTransit: true, showAtPickup: true, showAtDropoff: true, showRoutes: true },
  onLoadSelect,
  selectedLoadId,
  className,
  refreshInterval = 60000,
}) => {
  // LD1: useRef hook to create a reference to the MapView component
  const mapRef = useRef<MapViewRef>(null);

  // LD2: useState hook to manage the activeLoads state
  const [activeLoads, setActiveLoads] = useState<LoadWithPosition[]>([]);

  // LD3: useState hook to manage the routes state
  const [routes, setRoutes] = useState<RouteData[]>([]);

  // LD4: useState hook to manage the loading state
  const [loading, setLoading] = useState<boolean>(false);

  // LD5: useState hook to manage the error state
  const [error, setError] = useState<string | null>(null);

  // LD6: useState hook to manage the selectedLoad state
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

  // LD7: useState hook to manage the filters state
  const [filters, setFilters] = useState<{ [key: string]: boolean }>(initialFilters);

  /**
   * LD8: useEffect hook to update selectedLoad when selectedLoadId prop changes
   */
  useEffect(() => {
    if (selectedLoadId && activeLoads.length > 0) {
      const selected = activeLoads.find(load => load.load.id === selectedLoadId)?.load || null;
      setSelectedLoad(selected);
    }
  }, [selectedLoadId, activeLoads]);

  /**
   * LD9: useEffect hook to fetch active loads and routes on component mount
   */
  useEffect(() => {
    fetchActiveLoads();
    fetchLoadRoutes();
  }, []);

  /**
   * LD10: useEffect hook to set up real-time subscriptions for load updates
   */
  useEffect(() => {
    return setupSubscriptions();
  }, [activeLoads]);

  /**
   * LD11: useEffect hook to fit map to loads when loads or routes change
   */
  useEffect(() => {
    fitMapToLoads();
  }, [activeLoads, routes]);

  /**
   * LD12: useEffect hook to set up auto-refresh interval
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleRefresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  /**
   * Fetches active loads for the shipper
   */
  const fetchActiveLoads = async () => {
    setLoading(true);
    try {
      const loadsData = await getLoads({ status: [LoadStatus.IN_TRANSIT, LoadStatus.ASSIGNED, LoadStatus.AT_PICKUP, LoadStatus.LOADED, LoadStatus.AT_DROPOFF] });
      const loadsWithPositions = await Promise.all(
        loadsData.loads.map(async (load) => {
          const tracking = await getLoadTracking(load.id);
          return { load, position: tracking?.position || null };
        })
      );
      setActiveLoads(loadsWithPositions);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches route visualization data for all active loads
   */
  const fetchLoadRoutes = async () => {
    setLoading(true);
    try {
      const routesData = await Promise.all(
        activeLoads.map(async (load) => {
          const routeVisualization = await getRouteVisualization(load.load.id);
          if (routeVisualization) {
            return {
              loadId: load.load.id,
              route: routeVisualization.route,
              origin: routeVisualization.markers[0].position,
              destination: routeVisualization.markers[1].position,
              currentPosition: load.position
            };
          }
          return null;
        })
      );
      setRoutes(routesData.filter(route => route !== null) as RouteData[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles click events on load markers
   */
  const handleLoadClick = (load: Load, event: React.MouseEvent) => {
    setSelectedLoad(load);
    if (onLoadSelect) {
      onLoadSelect(load);
    }
  };

  /**
   * Handles changes to the map filter options
   */
  const handleFilterChange = (filterType: string, value: boolean) => {
    setFilters(prevFilters => ({ ...prevFilters, [filterType]: value }));
  };

  /**
   * Refreshes the map data
   */
  const handleRefresh = () => {
    fetchActiveLoads();
    fetchLoadRoutes();
  };

  /**
   * Adjusts the map view to fit all visible loads
   */
  const fitMapToLoads = () => {
    const visibleLoads = activeLoads.filter(load => {
      if (filters.showInTransit && load.load.status === LoadStatus.IN_TRANSIT) return true;
      if (filters.showAtPickup && load.load.status === LoadStatus.AT_PICKUP) return true;
      if (filters.showAtDropoff && load.load.status === LoadStatus.AT_DROPOFF) return true;
      return false;
    });

    const positions = visibleLoads.map(load => load.position).filter(pos => pos !== null) as Position[];

    if (mapRef.current && positions.length > 0) {
      mapRef.current.fitPoints(positions, { padding: 50 });
    }
  };

  /**
   * Sets up real-time subscriptions for load updates
   */
  const setupSubscriptions = () => {
    const unsubscribeFunctions: Function[] = [];

    activeLoads.forEach(load => {
      const unsubscribe = subscribeToLoadUpdates(
        load.load.id,
        (position) => {
          setActiveLoads(prevLoads =>
            prevLoads.map(prevLoad =>
              prevLoad.load.id === load.load.id ? { ...prevLoad, position } : prevLoad
            )
          );
        },
        (status, details) => {
          fetchActiveLoads();
        }
      );
      unsubscribeFunctions.push(unsubscribe);
    });

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  };

  /**
   * Determines the color for a route based on load ID and selection state
   */
  const getRouteColor = (loadId: string) => {
    return selectedLoad?.id === loadId ? 'red' : 'blue';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {showFilters && (
          <FilterControls>
            <FilterOption>
              <input
                type="checkbox"
                id="showInTransit"
                checked={filters.showInTransit}
                onChange={(e) => handleFilterChange('showInTransit', e.target.checked)}
              />
              <label htmlFor="showInTransit">In Transit</label>
            </FilterOption>
            <FilterOption>
              <input
                type="checkbox"
                id="showAtPickup"
                checked={filters.showAtPickup}
                onChange={(e) => handleFilterChange('showAtPickup', e.target.checked)}
              />
              <label htmlFor="showAtPickup">At Pickup</label>
            </FilterOption>
            <FilterOption>
              <input
                type="checkbox"
                id="showAtDropoff"
                checked={filters.showAtDropoff}
                onChange={(e) => handleFilterChange('showAtDropoff', e.target.checked)}
              />
              <label htmlFor="showAtDropoff">At Dropoff</label>
            </FilterOption>
            <FilterOption>
              <input
                type="checkbox"
                id="showRoutes"
                checked={filters.showRoutes}
                onChange={(e) => handleFilterChange('showRoutes', e.target.checked)}
              />
              <label htmlFor="showRoutes">Routes</label>
            </FilterOption>
          </FilterControls>
        )}
        {showRefresh && (
          <Button onClick={handleRefresh} variant="secondary" size="small">
            Refresh
          </Button>
        )}
      </CardHeader>
      <MapContainer height={height} width={width}>
        {loading && <LoadingIndicator />}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <MapView
          height={height}
          width={width}
          ref={mapRef}
          showControls={true}
          showLegend={true}
          legendItems={[
            { label: 'In Transit', color: 'blue' },
            { label: 'At Pickup', color: 'orange' },
            { label: 'At Dropoff', color: 'green' },
          ]}
        >
          {activeLoads
            .filter(load => {
              if (filters.showInTransit && load.load.status === LoadStatus.IN_TRANSIT) return true;
              if (filters.showAtPickup && load.load.status === LoadStatus.AT_PICKUP) return true;
              if (filters.showAtDropoff && load.load.status === LoadStatus.AT_DROPOFF) return true;
              return false;
            })
            .map(load => (
              <LoadMarker
                key={load.load.id}
                load={load.load}
                onClick={handleLoadClick}
                selected={selectedLoad?.id === load.load.id}
                position={load.position}
              />
            ))}
          {routes
            .filter(route => filters.showRoutes)
            .map(route => (
              <RouteLine
                key={route.loadId}
                path={route.route}
                color={getRouteColor(route.loadId)}
                width={3}
                dashArray={selectedLoad?.id === route.loadId ? [0] : [3, 3]}
              />
            ))}
        </MapView>
      </MapContainer>
    </Card>
  );
};

export default ShipmentMap;