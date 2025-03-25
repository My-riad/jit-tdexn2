import React, { useState, useCallback } from 'react';
import { Marker as MapGLMarker } from 'react-map-gl';
import styled from 'styled-components';
import { Position } from '../../../common/interfaces/tracking.interface';
import { colors } from '../../styles/colors';
import Tooltip from '../feedback/Tooltip';

/**
 * Props for the Marker component
 */
interface MarkerProps {
  /**
   * Longitude coordinate for the marker position
   */
  longitude: number;
  
  /**
   * Latitude coordinate for the marker position
   */
  latitude: number;
  
  /**
   * Color of the marker
   * @default colors.mapColors.currentLocation
   */
  color?: string;
  
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
   * Callback function when marker is clicked
   */
  onClick?: (data?: any, event?: React.MouseEvent) => void;
  
  /**
   * Content to render inside the marker
   */
  children?: React.ReactNode;
  
  /**
   * Content to display in the tooltip
   */
  tooltip?: React.ReactNode;
  
  /**
   * Position of the tooltip relative to the marker
   * @default 'top'
   */
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Data to pass to the onClick handler
   */
  data?: any;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Whether the marker can be dragged
   * @default false
   */
  draggable?: boolean;
  
  /**
   * Callback function when marker drag starts
   */
  onDragStart?: (event: React.MouseEvent) => void;
  
  /**
   * Callback function during marker drag
   */
  onDrag?: (lngLat: {lng: number, lat: number}) => void;
  
  /**
   * Callback function when marker drag ends
   */
  onDragEnd?: (lngLat: {lng: number, lat: number}) => void;
}

/**
 * Styled container for the marker content
 */
const MarkerContainer = styled.div<{ size?: number; color?: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease-in-out;
  z-index: ${props => props.zIndex || 0};
  
  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

/**
 * Default marker icon when no children are provided
 */
const DefaultMarker = styled.div<{ color?: string }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

/**
 * A reusable map marker component that serves as the foundation for all map markers 
 * in the freight optimization platform. It provides a consistent interface for displaying 
 * points of interest on maps with customizable appearance, behavior, and interactive features.
 */
const Marker: React.FC<MarkerProps> = ({
  longitude,
  latitude,
  color = colors.mapColors.currentLocation,
  size = 24,
  zIndex = 0,
  onClick,
  children,
  tooltip,
  tooltipPosition = 'top',
  data,
  className,
  draggable = false,
  onDragStart,
  onDrag,
  onDragEnd
}) => {
  // State to track tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Event handlers
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Prevent the click event from propagating to the map
    event.stopPropagation();
    
    // Call the onClick handler if provided
    if (onClick) {
      onClick(data, event);
    }
  }, [onClick, data]);
  
  const handleMouseEnter = useCallback(() => {
    if (tooltip) {
      setShowTooltip(true);
    }
  }, [tooltip]);
  
  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);
  
  // Render the marker
  return (
    <MapGLMarker
      longitude={longitude}
      latitude={latitude}
      offsetLeft={0}
      offsetTop={0}
      draggable={draggable}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    >
      {tooltip ? (
        <Tooltip
          content={tooltip}
          position={tooltipPosition}
          disabled={!showTooltip}
        >
          <MarkerContainer
            size={size}
            color={color}
            className={className}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            zIndex={zIndex}
          >
            {children || <DefaultMarker color={color} />}
          </MarkerContainer>
        </Tooltip>
      ) : (
        <MarkerContainer
          size={size}
          color={color}
          className={className}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          zIndex={zIndex}
        >
          {children || <DefaultMarker color={color} />}
        </MarkerContainer>
      )}
    </MapGLMarker>
  );
};

export default Marker;