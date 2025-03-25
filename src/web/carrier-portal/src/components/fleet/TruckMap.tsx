import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'; //  ^18.2.0
import styled from 'styled-components'; //  ^5.3.10
import { debounce } from 'lodash'; //  ^4.17.21
import MapView, { MapViewRef } from '../../../shared/components/maps/MapView'; // Base map component for displaying interactive maps
import TruckMarker from '../../../shared/components/maps/TruckMarker'; // Specialized marker component for displaying trucks on the map
import {
  Vehicle,
  VehicleStatus,
} from '../../../common/interfaces/vehicle.interface'; // Interface for vehicle data including status, type, and other properties
import { Position } from '../../../common/interfaces/tracking.interface'; // Interface for position data with latitude, longitude, and other properties
import { calculateBoundingBox } from '../../../common/utils/geoUtils'; // Utility function to calculate a bounding box containing all provided points
import { getAllVehicles } from '../../services/fleetService'; // Service function to fetch all vehicles with optional filtering

/**
 * Interface defining the props for the TruckMap component.
 * It includes properties for carrier ID, vehicle data, selection, filtering, and callbacks.
 */
interface TruckMapProps {
  /**
   * ID of the carrier whose fleet to display
   */
  carrierId: string;
  /**
   * Array of vehicles to display on the map
   */
  vehicles?: Vehicle[];
  /**
   * Currently selected truck
   */
  selectedTruck?: Vehicle | null;
  /**
   * Array of vehicle statuses to filter by
   */
  statusFilter?: VehicleStatus[];
  /**
   * Array of vehicle types to filter by
   */
  typeFilter?: string[];
  /**
   * Search query to filter vehicles
   */
  searchQuery?: string;
  /**
   * Height of the map container
   * @default 400
   */
  height?: string | number;
  /**
   * Width of the map container
   * @default 100%
   */
  width?: string | number;
  /**
   * Callback function when a truck is selected or deselected
   */
  onTruckSelect?: (vehicle: Vehicle | null) => void;
  /**
   * Callback function when the map is loaded
   */
  onLoad?: (map: MapViewRef) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Whether to show map controls
   * @default true
   */
  showControls?: boolean;
  /**
   * Whether to automatically fit the map to show all vehicles
   * @default true
   */
  autoFit?: boolean;
  /**
   * Interval in milliseconds to refresh vehicle data
   * @default 30000
   */
  refreshInterval?: number;
}

/**
 * Styled component for the map container.
 * It sets the position, width, height, border-radius, overflow, and box-shadow.
 */
const MapContainer = styled.div`
  position: relative;
  width: ${(props: { width?: string | number }) =>
    typeof props.width === 'number' ? `${props.width}px` : props.width};
  height: ${(props: { height?: string | number }) =>
    typeof props.height === 'number' ? `${props.height}px` : props.height};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

/**
 * Styled component for the loading indicator overlay.
 * It covers the entire map area and displays a loading spinner.
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
 * Styled component for displaying error messages.
 * It appears at the bottom of the map with a red background and white text.
 */
const ErrorMessage = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  z-index: 10;
`;

/**
 * A specialized map component for displaying and interacting with fleet trucks in the carrier portal.
 * It fetches vehicle data, filters it based on props, and renders truck markers on the map.
 */
const TruckMap: React.FC<TruckMapProps> = ({
  carrierId,
  vehicles,
  selectedTruck,
  statusFilter,
  typeFilter,
  searchQuery,
  height = 400,
  width = '100%',
  onTruckSelect,
  onLoad,
  className,
  showControls = true,
  autoFit = true,
  refreshInterval = 30000,
}) => {
  // LD1: Create a ref to store the map component instance for imperative actions
  const mapRef = useRef<React.RefObject<MapViewRef>>(null);

  // LD2: Manage component state for vehicles, selection, loading, and errors
  const [internalVehicles, setInternalVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setInternalSelectedVehicle] =
    useState<Vehicle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // LD3: Memoize callback functions for event handlers to prevent unnecessary re-renders
  const handleMapLoad = useCallback(
    (map: MapViewRef) => {
      // Store the map reference
      mapRef.current = map;

      // If vehicles are available, fit the map to their positions
      if (vehicles && vehicles.length > 0) {
        mapRef.current?.fitPoints(vehicles);
      } else if (internalVehicles.length > 0) {
        mapRef.current?.fitPoints(internalVehicles);
      }

      // Call onLoad callback if provided
      if (onLoad) {
        onLoad(map);
      }
    },
    [vehicles, internalVehicles, onLoad]
  );

  const handleTruckClick = useCallback(
    (vehicle: Vehicle, event: React.MouseEvent) => {
      // Set the selected truck to the clicked vehicle
      setInternalSelectedVehicle(vehicle);

      // Call onTruckSelect callback if provided, passing the vehicle
      if (onTruckSelect) {
        onTruckSelect(vehicle);
      }
    },
    [onTruckSelect]
  );

  const handleMapClick = useCallback(
    (coordinates: { lng: number; lat: number }, event: any) => {
      // Clear the selected truck by setting it to null
      setInternalSelectedVehicle(null);

      // Call onTruckSelect callback if provided, passing null
      if (onTruckSelect) {
        onTruckSelect(null);
      }
    },
    [onTruckSelect]
  );

  // LD4: Fetch vehicles from the API with optional filtering
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const { vehicles: fetchedVehicles } = await getAllVehicles({
        carrierId,
      });
      setInternalVehicles(fetchedVehicles);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [carrierId]);

  // LD5: Adjust the map view to fit all visible vehicles
  const fitToVehicles = useCallback(() => {
    if (mapRef.current && (vehicles || internalVehicles)) {
      const points = (vehicles || internalVehicles).map((vehicle) => ({
        latitude: vehicle.current_location.latitude,
        longitude: vehicle.current_location.longitude,
      }));
      if (points.length > 0) {
        mapRef.current.fitPoints(points);
      }
    }
  }, [vehicles, internalVehicles]);

  // LD6: Filter vehicles based on status and other criteria
  const filterVehicles = useCallback(
    (vehicles: Vehicle[]): Vehicle[] => {
      let filtered = vehicles;

      if (statusFilter && statusFilter.length > 0) {
        filtered = filtered.filter((vehicle) =>
          statusFilter.includes(vehicle.status)
        );
      }

      if (typeFilter && typeFilter.length > 0) {
        filtered = filtered.filter((vehicle) => typeFilter.includes(vehicle.type));
      }

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((vehicle) => {
          return (
            vehicle.vehicle_id.toLowerCase().includes(lowerQuery) ||
            vehicle.make.toLowerCase().includes(lowerQuery) ||
            vehicle.model.toLowerCase().includes(lowerQuery)
          );
        });
      }

      return filtered;
    },
    [statusFilter, typeFilter, searchQuery]
  );

  // LD7: Memoize computed values like filtered vehicles to prevent unnecessary re-renders
  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles || internalVehicles),
    [vehicles, internalVehicles, statusFilter, typeFilter, searchQuery, filterVehicles]
  );

  // LD8: Handle side effects like data fetching and refresh intervals
  useEffect(() => {
    fetchVehicles();
  }, [carrierId, fetchVehicles]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchVehicles();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchVehicles]);

  useEffect(() => {
    if (selectedTruck) {
      setInternalSelectedVehicle(selectedTruck);
    }
  }, [selectedTruck]);

  useEffect(() => {
    if (autoFit) {
      fitToVehicles();
    }
  }, [filteredVehicles, autoFit, fitToVehicles]);

  return (
    <MapContainer width={width} height={height} className={className}>
      <MapView
        ref={mapRef}
        height={height}
        width={width}
        showControls={showControls}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
      >
        {filteredVehicles.map((vehicle) => (
          <TruckMarker
            key={vehicle.vehicle_id}
            vehicle={vehicle}
            selected={selectedVehicle?.vehicle_id === vehicle.vehicle_id}
            onClick={handleTruckClick}
          />
        ))}
        {loading && <LoadingOverlay>Loading...</LoadingOverlay>}
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
      </MapView>
    </MapContainer>
  );
};

export default TruckMap;