import React from 'react';
import styled from 'styled-components';
import Marker from './Marker';
import { SmartHub } from '../../../../backend/common/interfaces/smartHub.interface';
import { colors } from '../../styles/colors';
import Tooltip from '../feedback/Tooltip';

/**
 * Props for the SmartHubMarker component
 */
interface SmartHubMarkerProps {
  /**
   * Smart Hub data to display on the map
   */
  smartHub: SmartHub;
  
  /**
   * Callback function when marker is clicked
   */
  onClick?: (smartHub: SmartHub, event?: React.MouseEvent) => void;
  
  /**
   * Size of the marker in pixels
   * @default 32
   */
  size?: number;
  
  /**
   * Whether the Smart Hub is currently selected
   * @default false
   */
  selected?: boolean;
  
  /**
   * Z-index for controlling marker stacking order
   * @default 1
   */
  zIndex?: number;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Styled component for the Smart Hub icon
 */
const HubIcon = styled.div<{ size: number; selected: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background-color: ${colors.mapColors.smartHub};
  border: 3px solid ${props => props.selected ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transform: ${props => props.selected ? 'scale(1.1)' : 'scale(1)'};
  transition: transform 0.2s ease-in-out, border 0.2s ease-in-out;
`;

/**
 * Styled component for the inner part of the Smart Hub icon
 */
const HubIconInner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: bold;
  color: ${colors.mapColors.smartHub};
`;

/**
 * Styled component for the Smart Hub tooltip content
 */
const TooltipContent = styled.div`
  padding: 8px;
  max-width: 250px;
`;

/**
 * Styled component for the Smart Hub tooltip title
 */
const TooltipTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: bold;
`;

/**
 * Styled component for the Smart Hub tooltip details
 */
const TooltipDetail = styled.div`
  margin-bottom: 4px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
`;

/**
 * Styled component for the Smart Hub tooltip labels
 */
const TooltipLabel = styled.span`
  font-weight: 500;
  margin-right: 8px;
`;

/**
 * Styled component for the Smart Hub tooltip values
 */
const TooltipValue = styled.span`
  font-weight: normal;
`;

/**
 * Styled component for the Smart Hub amenities list
 */
const AmenitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

/**
 * Styled component for individual amenity tags
 */
const AmenityTag = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: rgba(251, 188, 4, 0.2);
  color: #5F6368;
`;

/**
 * Formats the Smart Hub data into a readable tooltip content
 * @param smartHub Smart Hub data to format
 * @returns Formatted tooltip content with Smart Hub details
 */
const formatTooltipContent = (smartHub: SmartHub): JSX.Element => {
  // Helper function to format enum values to readable text
  const formatEnumValue = (value: string): string => {
    return value.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <TooltipContent>
      <TooltipTitle>{smartHub.name}</TooltipTitle>
      
      <TooltipDetail>
        <TooltipLabel>Type:</TooltipLabel>
        <TooltipValue>{formatEnumValue(smartHub.hub_type)}</TooltipValue>
      </TooltipDetail>
      
      <TooltipDetail>
        <TooltipLabel>Efficiency Score:</TooltipLabel>
        <TooltipValue>{smartHub.efficiency_score}</TooltipValue>
      </TooltipDetail>
      
      {smartHub.amenities && smartHub.amenities.length > 0 && (
        <>
          <TooltipDetail>
            <TooltipLabel>Amenities:</TooltipLabel>
          </TooltipDetail>
          <AmenitiesList>
            {smartHub.amenities.map((amenity) => (
              <AmenityTag key={amenity}>
                {formatEnumValue(amenity)}
              </AmenityTag>
            ))}
          </AmenitiesList>
        </>
      )}
      
      {smartHub.operating_hours && (
        <TooltipDetail>
          <TooltipLabel>Hours:</TooltipLabel>
          <TooltipValue>
            {smartHub.operating_hours.open} - {smartHub.operating_hours.close}
          </TooltipValue>
        </TooltipDetail>
      )}
      
      <TooltipDetail>
        <TooltipLabel>Capacity:</TooltipLabel>
        <TooltipValue>{smartHub.capacity} trucks</TooltipValue>
      </TooltipDetail>
    </TooltipContent>
  );
};

/**
 * A specialized marker component for displaying Smart Hubs on maps with tooltips 
 * showing hub details.
 */
const SmartHubMarker: React.FC<SmartHubMarkerProps> = ({
  smartHub,
  onClick,
  size = 32,
  selected = false,
  zIndex = 1,
  className,
}) => {
  // Handle click events
  const handleClick = (data: any, event?: React.MouseEvent) => {
    if (onClick) {
      onClick(smartHub, event);
    }
  };

  // Create tooltip content
  const tooltipContent = formatTooltipContent(smartHub);

  return (
    <Marker
      longitude={smartHub.longitude}
      latitude={smartHub.latitude}
      color={colors.mapColors.smartHub}
      size={size}
      zIndex={zIndex}
      onClick={handleClick}
      tooltip={tooltipContent}
      data={smartHub}
      className={className}
    >
      <HubIcon size={size} selected={selected}>
        <HubIconInner>H</HubIconInner>
      </HubIcon>
    </Marker>
  );
};

export default SmartHubMarker;