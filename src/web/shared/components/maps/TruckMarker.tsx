import React, { useMemo } from 'react';
import styled from 'styled-components';
import Marker from './Marker';
import { Position } from '../../../common/interfaces/tracking.interface';
import { Vehicle, VehicleStatus } from '../../../common/interfaces/vehicle.interface';
import { colors } from '../../styles/colors';
import { TruckIcon } from '../../assets/icons/truck.svg';

/**
 * Props for the TruckMarker component
 */
interface TruckMarkerProps {
  /**
   * Vehicle data to display on the map
   */
  vehicle: Vehicle;
  
  /**
   * Position coordinates for the marker
   */
  position?: Position;
  
  /**
   * Callback function when marker is clicked
   */
  onClick?: (vehicle: Vehicle, event?: React.MouseEvent) => void;
  
  /**
   * Size of the marker in pixels
   * @default 32
   */
  size?: number;
  
  /**
   * Whether the truck is currently selected
   * @default false
   */
  selected?: boolean;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Styled container for the truck icon with status-based styling
 */
const TruckIconContainer = styled.div<{
  status: VehicleStatus;
  selected?: boolean;
  size?: number;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid ${props => getStatusColor(props.status)};
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transform: ${props => props.selected ? 'scale(1.2)' : 'scale(1)'};
  transition: transform 0.2s ease-in-out;
  
  svg {
    fill: ${props => getStatusColor(props.status)};
  }
`;

/**
 * Get the appropriate color for the truck marker based on vehicle status
 */
const getStatusColor = (status: VehicleStatus): string => {
  switch (status) {
    case VehicleStatus.ACTIVE:
      return colors.mapColors.truckMarker;
    case VehicleStatus.AVAILABLE:
      return colors.semantic.success;
    case VehicleStatus.MAINTENANCE:
      return colors.semantic.warning;
    case VehicleStatus.OUT_OF_SERVICE:
      return colors.semantic.error;
    default:
      return colors.mapColors.truckMarker;
  }
};

/**
 * A specialized map marker component for displaying trucks on interactive maps
 * with status-based styling and behavior.
 */
const TruckMarker: React.FC<TruckMarkerProps> = ({
  vehicle,
  position,
  onClick,
  size = 32,
  selected = false,
  className
}) => {
  // Determine the marker color based on vehicle status
  const markerColor = useMemo(() => getStatusColor(vehicle.status), [vehicle.status]);
  
  // Create tooltip content with vehicle information
  const tooltipContent = `${vehicle.make} ${vehicle.model} (${vehicle.year})
Status: ${vehicle.status}
${vehicle.current_driver_id ? `Driver: ${vehicle.current_driver_id}` : 'No driver assigned'}
${vehicle.current_load_id ? `Load: ${vehicle.current_load_id}` : 'No active load'}`;
  
  // Handle click events
  const handleClick = (data: any, event?: React.MouseEvent) => {
    if (onClick) {
      onClick(vehicle, event);
    }
  };
  
  return (
    <Marker
      longitude={position?.longitude || vehicle.current_location.longitude}
      latitude={position?.latitude || vehicle.current_location.latitude}
      color={markerColor}
      size={size}
      onClick={handleClick}
      data={vehicle}
      tooltip={tooltipContent}
      className={className}
    >
      <TruckIconContainer
        status={vehicle.status}
        selected={selected}
        size={size}
      >
        <TruckIcon width="100%" height="100%" />
      </TruckIconContainer>
    </Marker>
  );
};

export default TruckMarker;