import React, { useState, useEffect, useRef, useCallback } from 'react'; //  ^18.2.0
import styled from 'styled-components'; //  ^5.3.10
import { useSelector, useDispatch } from 'react-redux'; //  ^8.0.5

import MapView from '../../../../shared/components/maps/MapView';
import TruckMarker from '../../../../shared/components/maps/TruckMarker';
import Card from '../../../../shared/components/cards/Card';
import Button from '../../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../../shared/components/feedback/LoadingIndicator';
import { Vehicle, VehicleStatus } from '../../../../common/interfaces/vehicle.interface';
import { Position } from '../../../../common/interfaces/tracking.interface';
import { fetchVehicles } from '../../store/actions/fleetActions';
import { RootState } from '../../store/reducers/rootReducer';

/**
 * Interface defining the props for the FleetMap component
 */
interface FleetMapProps {
  /** ID of the carrier whose fleet to display */
  carrierId: string;
  /** Height of the map container */
  height?: string | number;
  /** Width of the map container */
  width?: string | number;
  /** Whether to show status filter buttons */
  showFilters?: boolean;
  /** Whether to show Smart Hubs on the map */
  showSmartHubs?: boolean;
  /** Initial filter to apply to vehicles */
  initialFilter?: VehicleStatus | 'ALL';
  /** Callback function when a vehicle is selected or deselected */
  onVehicleSelect?: (vehicle: Vehicle | null) => void;
  /** ID of the vehicle to highlight as selected */
  selectedVehicleId?: string;
  /** Additional CSS class name */
  className?: string;
  /** Title for the map card */
  title?: string;
  /** Interval in milliseconds to refresh vehicle data */
  refreshInterval?: number;
}

/**
 * Styled component for the map container
 */
const MapContainer = styled.div`
  position: relative;
  width: ${(props: { width?: string | number }) => props.width || '100%'};
  height: ${(props: { height?: string | number }) => props.height || '400px'};
  border-radius: 8px;
  overflow: hidden;
`;

/**
 * Styled component for the filter buttons container
 */
const FilterContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  display: flex;
  gap: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

/**
 * Interactive map component for displaying and managing fleet vehicles
 */
const FleetMap: React.FC<FleetMapProps> = ({
  carrierId,
  height = '400px',
  width = '100%',
  showFilters = true,
  showSmartHubs = false,
  initialFilter = 'ALL',
  onVehicleSelect,
  selectedVehicleId,
  className,
  title = 'Fleet Map',
  refreshInterval = 30000,
}) => {
  // LD1: Define state variables for selected vehicle and active filter
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeFilter, setActiveFilter] = useState<VehicleStatus | 'ALL'>(initialFilter);

  // LD1: Get vehicles and loading state from Redux store using useSelector
  const vehicles = useSelector((state: RootState) => state.fleet.vehicles);
  const loading = useSelector((state: RootState) => state.fleet.loading.vehicles);

  // LD1: Get dispatch function from Redux store using useDispatch
  const dispatch = useDispatch();

  // LD1: Create a ref for the MapView component
  const mapRef = useRef<any>(null);

  // LD1: Fetch vehicles data when the component mounts and when carrierId changes
  useEffect(() => {
    dispatch(fetchVehicles(carrierId));

    // LD1: Set up an interval to refresh the vehicle data periodically
    const intervalId = setInterval(() => {
      dispatch(fetchVehicles(carrierId));
    }, refreshInterval);

    // LD1: Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [dispatch, carrierId, refreshInterval]);

  // LD1: Update selectedVehicle state when selectedVehicleId prop changes
  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find((v: Vehicle) => v.vehicle_id === selectedVehicleId) || null;
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles]);

  // LD1: Adjust the map view to fit all vehicles when the vehicles data changes
  useEffect(() => {
    if (mapRef.current) {
      const positions: Position[] = vehicles.map((vehicle: Vehicle) => ({
        latitude: vehicle.current_location.latitude,
        longitude: vehicle.current_location.longitude,
        timestamp: new Date().toISOString(),
        accuracy: 10,
        heading: 0,
        speed: 0,
        source: 'carrier-portal',
      }));
      mapRef.current.fitPoints(positions, { padding: 50 });
    }
  }, [vehicles, mapRef.current]);

  // LD1: Set initial filter when initialFilter prop changes
  useEffect(() => {
    setActiveFilter(initialFilter);
  }, [initialFilter]);

  // LD1: Handle click events on vehicle markers
  const handleVehicleClick = useCallback((vehicle: Vehicle, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  }, [onVehicleSelect]);

  // LD1: Handle click events on the map background
  const handleMapClick = useCallback((coordinates: any, event: any) => {
    setSelectedVehicle(null);
    if (onVehicleSelect) {
      onVehicleSelect(null);
    }
  }, [onVehicleSelect]);

  // LD1: Handle changes to the vehicle status filter
  const handleFilterChange = useCallback((status: VehicleStatus | 'ALL') => {
    setActiveFilter(status);
  }, []);

  // LD1: Filter vehicles based on the active status filter
  const getFilteredVehicles = useCallback(() => {
    if (activeFilter === 'ALL') {
      return vehicles;
    }
    return vehicles.filter((vehicle: Vehicle) => vehicle.status === activeFilter);
  }, [vehicles, activeFilter]);

  // LD1: Adjusts the map view to fit all visible vehicles
  const fitMapToVehicles = useCallback(() => {
    const filteredVehicles = getFilteredVehicles();
    const positions: Position[] = filteredVehicles.map((vehicle: Vehicle) => ({
      latitude: vehicle.current_location.latitude,
      longitude: vehicle.current_location.longitude,
      timestamp: new Date().toISOString(),
      accuracy: 10,
      heading: 0,
      speed: 0,
      source: 'carrier-portal',
    }));

    if (mapRef.current && positions.length > 0) {
      mapRef.current.fitPoints(positions, { padding: 50 });
    }
  }, [getFilteredVehicles]);

  return (
    <Card className={className} title={title}>
      <MapContainer height={height} width={width}>
        {loading ? (
          <LoadingIndicator />
        ) : (
          <>
            {showFilters && (
              <FilterContainer>
                <Button onClick={() => handleFilterChange('ALL')} variant={activeFilter === 'ALL' ? 'primary' : 'secondary'}>All</Button>
                <Button onClick={() => handleFilterChange(VehicleStatus.ACTIVE)} variant={activeFilter === VehicleStatus.ACTIVE ? 'primary' : 'secondary'}>Active</Button>
                <Button onClick={() => handleFilterChange(VehicleStatus.AVAILABLE)} variant={activeFilter === VehicleStatus.AVAILABLE ? 'primary' : 'secondary'}>Available</Button>
                <Button onClick={() => handleFilterChange(VehicleStatus.MAINTENANCE)} variant={activeFilter === VehicleStatus.MAINTENANCE ? 'primary' : 'secondary'}>Maintenance</Button>
              </FilterContainer>
            )}
            <MapView
              ref={mapRef}
              height="100%"
              width="100%"
              onClick={handleMapClick}
              showControls={true}
              showLegend={true}
            >
              {getFilteredVehicles().map((vehicle: Vehicle) => (
                <TruckMarker
                  key={vehicle.vehicle_id}
                  vehicle={vehicle}
                  onClick={handleVehicleClick}
                  selected={selectedVehicle?.vehicle_id === vehicle.vehicle_id}
                />
              ))}
            </MapView>
          </>
        )}
      </MapContainer>
    </Card>
  );
};

export default FleetMap;