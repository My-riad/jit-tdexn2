import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react'; //  ^18.2.0
import styled from 'styled-components'; //  ^5.3.10

import MapView, { MapViewRef } from '../../../../shared/components/maps/MapView';
import LoadMarker from '../../../../shared/components/maps/LoadMarker';
import RouteLine from '../../../../shared/components/maps/RouteLine';
import { Load, LoadStatus } from '../../../../common/interfaces/load.interface';
import { calculateBoundingBox } from '../../../../common/utils/geoUtils';
import { getCarrierLoads } from '../../../services/loadService';

/**
 * Interface defining the props for the LoadMap component.
 */
interface LoadMapProps {
  /**
   * Array of loads to display on the map.
   */
  loads?: Load[];
  /**
   * ID of the carrier to fetch loads for if loads are not provided.
   */
  carrierId?: string;
  /**
   * Callback function when a load marker is clicked.
   */
  onLoadClick?: (load: Load) => void;
  /**
   * ID of the currently selected load.
   */
  selectedLoadId?: string;
  /**
   * Height of the map container.
   * @default '400px'
   */
  height?: string | number;
  /**
   * Width of the map container.
   * @default '100%'
   */
  width?: string | number;
  /**
   * Whether to show route lines between load origins and destinations.
   * @default true
   */
  showRoutes?: boolean;
  /**
   * Array of load statuses to filter by.
   */
  statusFilter?: LoadStatus[];
    /**
   * Whether to show map navigation controls.
   * @default true
   */
  showControls?: boolean;
    /**
   * Whether the map is interactive (can be panned, zoomed).
   * @default true
   */
  interactive?: boolean;
  /**
   * Additional CSS class name.
   */
  className?: string;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/**
 * A specialized map component for displaying loads on a map with their routes and status indicators.
 */
const LoadMap: React.FC<LoadMapProps> = ({
  loads,
  carrierId,
  onLoadClick,
  selectedLoadId,
  height = '400px',
  width = '100%',
  showRoutes = true,
  statusFilter,
  showControls = true,
  interactive = true,
  className,
}) => {
  // LD1: Destructure props including loads, carrierId, onLoadClick, selectedLoadId, height, width, showRoutes, statusFilter, and other props
  // LD2: Create state for filtered loads, selected load, and loading state
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // LD3: Create a ref for the MapView component to access its methods
  const mapRef = useRef<MapViewRef>(null);

  // LD4: Use useEffect to fetch loads if not provided and carrierId is available
  useEffect(() => {
    if (!loads && carrierId) {
      const fetchLoads = async () => {
        setLoading(true);
        try {
          const carrierLoads = await getCarrierLoads(carrierId);
          setFilteredLoads(carrierLoads.loads as Load[]);
        } catch (error) {
          console.error('Failed to fetch loads:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchLoads();
    }
  }, [carrierId, loads]);

  // LD5: Use useEffect to filter loads based on statusFilter prop
  useEffect(() => {
    if (loads) {
      const filtered = statusFilter
        ? loads.filter((load) => statusFilter.includes(load.status))
        : loads;
      setFilteredLoads(filtered);
    }
  }, [loads, statusFilter]);

  // LD6: Use useEffect to find and set the selected load when selectedLoadId changes
  useEffect(() => {
    if (selectedLoadId && filteredLoads) {
      const selected = filteredLoads.find((load) => load.id === selectedLoadId) || null;
      setSelectedLoad(selected);
    } else {
      setSelectedLoad(null);
    }
  }, [selectedLoadId, filteredLoads]);

  // LD7: Use useEffect to fit the map to show all load locations when loads change
  useEffect(() => {
    if (filteredLoads && mapRef.current) {
      const loadLocations = filteredLoads.flatMap(load =>
        load.locations ? load.locations.map(loc => loc.coordinates) : []
      ).filter(Boolean);
      if (loadLocations.length > 0) {
        mapRef.current.fitPoints(loadLocations);
      }
    }
  }, [filteredLoads, mapRef.current]);

  // LD8: Use useMemo to prepare load locations for map fitting
  const loadLocations = useMemo(() => {
    return filteredLoads.flatMap(load =>
      load.locations ? load.locations.map(loc => loc.coordinates) : []
    ).filter(Boolean);
  }, [filteredLoads]);

  // LD9: Use useMemo to prepare route data for each load if showRoutes is true
  const routeData = useMemo(() => {
    if (!showRoutes) return [];
    return filteredLoads.map(load => {
      const origin = load.locations?.find(loc => loc.locationType === 'pickup')?.coordinates;
      const destination = load.locations?.find(loc => loc.locationType === 'delivery')?.coordinates;
      return { loadId: load.id, origin, destination };
    });
  }, [filteredLoads, showRoutes]);

  // LD10: Handle load marker click to call onLoadClick callback and select the load
  const handleLoadClick = useCallback((load: Load) => {
    onLoadClick?.(load);
  }, [onLoadClick]);

  const getRouteColor = (status: LoadStatus): string => {
    switch (status) {
      case LoadStatus.AVAILABLE:
        return colors.mapColors.routeLine;
      case LoadStatus.ASSIGNED:
      case LoadStatus.IN_TRANSIT:
      case LoadStatus.LOADED:
        return colors.semantic.info;
      case LoadStatus.AT_PICKUP:
      case LoadStatus.AT_DROPOFF:
        return colors.semantic.warning;
      case LoadStatus.DELIVERED:
      case LoadStatus.COMPLETED:
        return colors.semantic.success;
      case LoadStatus.CANCELLED:
      case LoadStatus.EXPIRED:
      case LoadStatus.EXCEPTION:
        return colors.semantic.error;
      default:
        return colors.mapColors.routeLine;
    }
  };

  // LD11: Render the MapView component with appropriate props
  return (
    <MapContainer width={width} height={height} className={className}>
      <MapView ref={mapRef} height="100%" width="100%" showControls={showControls} interactive={interactive}>
        {/* LD12: Render LoadMarker components for each filtered load */}
        {filteredLoads.map((load) => (
          <LoadMarker
            key={load.id}
            load={load}
            onClick={handleLoadClick}
            selected={load.id === selectedLoad?.id}
          />
        ))}
        {/* LD13: Render RouteLine components for each load if showRoutes is true */}
        {showRoutes &&
          filteredLoads.map((load) => {
            const origin = load.locations?.find(loc => loc.locationType === 'pickup')?.coordinates;
            const destination = load.locations?.find(loc => loc.locationType === 'delivery')?.coordinates;
            if (!origin || !destination) return null;
            return (
              <RouteLine
                key={`route-${load.id}`}
                coordinates={[origin, destination]}
                color={getRouteColor(load.status)}
              />
            );
          })}
      </MapView>
      {/* LD14: Show loading indicator when loads are being fetched */}
      {loading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </MapContainer>
  );
};

export default LoadMap;