import React, { useMemo } from 'react';
import styled from 'styled-components';
import Marker from './Marker';
import { Load, LoadStatus } from '../../../common/interfaces/load.interface';
import { colors } from '../../styles/colors';
import Tooltip from '../feedback/Tooltip';

/**
 * Props for the LoadMarker component
 */
interface LoadMarkerProps {
  /**
   * Load data to display on the map
   */
  load: Load;
  
  /**
   * Callback function when marker is clicked
   */
  onClick?: (load: Load, event: React.MouseEvent) => void;
  
  /**
   * Whether to show a tooltip with load details on hover
   * @default true
   */
  showTooltip?: boolean;
  
  /**
   * Custom content to display in the tooltip
   */
  tooltipContent?: React.ReactNode;
  
  /**
   * Size of the marker in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Z-index for controlling marker stacking order
   * @default 0
   */
  zIndex?: number;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Whether the load marker is currently selected
   * @default false
   */
  selected?: boolean;
  
  /**
   * Whether to show a text label with the load ID
   * @default false
   */
  showLabel?: boolean;
  
  /**
   * Custom marker content
   */
  children?: React.ReactNode;
}

/**
 * Styled icon for the load marker
 */
const LoadMarkerIcon = styled.div<{ status: LoadStatus; selected?: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${props => getMarkerColorByStatus(props.status)};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transform: ${props => props.selected ? 'scale(1.2)' : 'scale(1)'};
  transition: transform 0.2s ease-in-out;
`;

/**
 * Text label for the load marker
 */
const LoadMarkerLabel = styled.div<{ selected?: boolean }>`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 10px;
  font-weight: bold;
  background-color: white;
  padding: 2px 4px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
`;

/**
 * Determines the appropriate marker color based on load status
 * 
 * @param status - The load status
 * @returns The color code for the marker
 */
const getMarkerColorByStatus = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.AVAILABLE:
      return colors.mapColors.loadMarker;
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
      return colors.mapColors.loadMarker;
  }
};

/**
 * A specialized map marker component for displaying loads on maps across the freight optimization platform.
 * It extends the base Marker component with load-specific styling, behavior, and information display.
 */
const LoadMarker: React.FC<LoadMarkerProps> = ({
  load,
  onClick,
  showTooltip = true,
  tooltipContent,
  size = 24,
  zIndex = 0,
  className,
  selected = false,
  showLabel = false,
  children
}) => {
  // Determine the marker color based on load status
  const markerColor = useMemo(() => {
    return getMarkerColorByStatus(load.status);
  }, [load.status]);
  
  // Create formatted tooltip content if showTooltip is true and no custom tooltipContent is provided
  const formattedTooltip = useMemo(() => {
    if (!showTooltip || tooltipContent) return null;
    
    // Extract origin and destination from load locations
    const originLocation = load.locations?.find(loc => loc.locationType === 'pickup');
    const destinationLocation = load.locations?.find(loc => loc.locationType === 'delivery');
    
    const origin = originLocation ? 
      `${originLocation.address.city}, ${originLocation.address.state}` : 'Unknown';
    
    const destination = destinationLocation ? 
      `${destinationLocation.address.city}, ${destinationLocation.address.state}` : 'Unknown';
    
    return (
      <div>
        <div><strong>Load:</strong> {load.referenceNumber || load.id}</div>
        <div><strong>Route:</strong> {origin} → {destination}</div>
        <div><strong>Equipment:</strong> {load.equipmentType}</div>
        <div><strong>Weight:</strong> {load.weight.toLocaleString()} lbs</div>
        <div><strong>Status:</strong> {load.status}</div>
      </div>
    );
  }, [load, showTooltip, tooltipContent]);
  
  // If no locations are available, we can't place the marker
  if (!load.locations || load.locations.length === 0) {
    console.warn(`LoadMarker: Load ${load.id} has no locations for marker placement`);
    return null;
  }
  
  return (
    <Marker
      longitude={load.locations[0].coordinates.longitude}
      latitude={load.locations[0].coordinates.latitude}
      color={markerColor}
      size={size}
      zIndex={zIndex}
      onClick={onClick}
      data={load}
      tooltip={showTooltip ? tooltipContent || formattedTooltip : undefined}
      className={className}
    >
      {children || <LoadMarkerIcon status={load.status} selected={selected} />}
      {showLabel && (
        <LoadMarkerLabel selected={selected}>
          {load.referenceNumber || load.id}
        </LoadMarkerLabel>
      )}
    </Marker>
  );
};

export default LoadMarker;