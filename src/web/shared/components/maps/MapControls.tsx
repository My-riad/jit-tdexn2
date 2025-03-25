import React from 'react';
import styled from 'styled-components';
import { MapRef } from 'react-map-gl';
import { FaPlus, FaMinus, FaExpand, FaCompress, FaLocationArrow, FaRedo } from 'react-icons/fa';
import { mapColors, neutral } from '../../styles/colors';
import { spacing, borders } from '../../styles/theme';

interface MapControlsProps {
  map: MapRef | null;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFullscreen?: () => void;
  onCurrentLocation?: () => void;
  onResetView?: () => void;
  isFullscreen?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showZoom?: boolean;
  showFullscreen?: boolean;
  showCurrentLocation?: boolean;
  showResetView?: boolean;
  className?: string;
}

const ControlsContainer = styled.div<{ position: string }>`
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  margin: ${spacing.sm};
  top: ${props => props.position.includes('top') ? '0' : 'auto'};
  bottom: ${props => props.position.includes('bottom') ? '0' : 'auto'};
  left: ${props => props.position.includes('left') ? '0' : 'auto'};
  right: ${props => props.position.includes('right') ? '0' : 'auto'};
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: ${neutral.white};
  border: 1px solid ${neutral.lightGray};
  border-radius: ${borders.radius.sm};
  box-shadow: 0 2px 4px ${neutral.dark20};
  cursor: pointer;
  color: ${neutral.darkGray};
  font-size: 16px;
  padding: 0;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${neutral.gray100};
  }

  &:active {
    background-color: ${neutral.gray200};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${mapColors.currentLocation};
  }
`;

const MapControls: React.FC<MapControlsProps> = ({
  map,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onCurrentLocation,
  onResetView,
  isFullscreen = false,
  position = 'top-right',
  showZoom = true,
  showFullscreen = true,
  showCurrentLocation = true,
  showResetView = false,
  className,
}) => {
  const handleZoomIn = () => {
    if (onZoomIn) {
      onZoomIn();
    } else if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (onZoomOut) {
      onZoomOut();
    } else if (map) {
      map.zoomOut();
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
  };

  const handleCurrentLocation = () => {
    if (onCurrentLocation) {
      onCurrentLocation();
    }
  };

  const handleResetView = () => {
    if (onResetView) {
      onResetView();
    }
  };

  return (
    <ControlsContainer position={position} className={className}>
      {showZoom && (
        <>
          <ControlButton onClick={handleZoomIn} aria-label="Zoom in">
            <FaPlus />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} aria-label="Zoom out">
            <FaMinus />
          </ControlButton>
        </>
      )}
      
      {showFullscreen && (
        <ControlButton onClick={handleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </ControlButton>
      )}
      
      {showCurrentLocation && (
        <ControlButton onClick={handleCurrentLocation} aria-label="Go to current location">
          <FaLocationArrow />
        </ControlButton>
      )}
      
      {showResetView && (
        <ControlButton onClick={handleResetView} aria-label="Reset view">
          <FaRedo />
        </ControlButton>
      )}
    </ControlsContainer>
  );
};

export default MapControls;