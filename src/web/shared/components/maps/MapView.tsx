import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react'; //  ^18.2.0
import {
  Map,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
  ViewState,
  MapRef,
} from 'react-map-gl'; //  ^7.1.0
import styled from 'styled-components'; //  ^5.3.10

import Marker from './Marker'; // Reusable marker component for displaying points on the map
import RouteLine from './RouteLine'; // Component for rendering route lines on the map
import MapControls from './MapControls'; // Component providing navigation controls for the map
import MapLegend from './MapLegend'; // Component providing a legend for map symbols and colors
import { Position } from '../../../common/interfaces/tracking.interface'; // Interface for position data with latitude, longitude, and other properties
import useGeolocation from '../../../common/hooks/useGeolocation'; // Custom hook for accessing and monitoring geolocation
import { calculateBoundingBox } from '../../../common/utils/geoUtils'; // Utility function to calculate a bounding box containing all provided points
import { colors } from '../../styles/colors'; // Color definitions for map elements

// Global constants
declare const MAPBOX_ACCESS_TOKEN: string; // Environment variable for Mapbox API access token
const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';
const DEFAULT_ZOOM = 10;

/**
 * Interface for the map reference object exposed to parent components
 */
export interface MapViewRef {
  getMap: () => MapRef | null;
  fitBounds: (bounds: [[number, number], [number, number]], options?: object) => void;
  fitPoints: (points: Position[], options?: object) => void;
  flyTo: (options: object) => void;
}

/**
 * Props for the MapView component
 */
export interface MapViewProps {
  /**
   * Initial view state for the map (center, zoom, bearing, pitch)
   */
  initialViewState?: Partial<ViewState>;

  /**
   * Initial center position for the map
   */
  initialCenter?: Position;

  /**
   * Initial zoom level for the map
   */
  initialZoom?: number;

  /**
   * Initial bounds for the map to fit
   */
  initialBounds?: [[number, number], [number, number]];

  /**
   * Mapbox style URL or style object
   */
  mapStyle?: string;

  /**
   * Width of the map container
   */
  width?: string | number;

  /**
   * Height of the map container
   */
  height?: string | number;

  /**
   * Child components to render inside the map (markers, lines, etc.)
   */
  children?: React.ReactNode;

  /**
   * Callback function when the map is clicked
   */
  onClick?: (coordinates: { lng: number; lat: number }, event: any) => void;

  /**
   * Callback function when the map view changes
   */
  onMove?: (viewState: ViewState) => void;

  /**
   * Callback function when the map is loaded
   */
  onLoad?: (map: MapRef) => void;

  /**
   * Whether to show map navigation controls
   */
  showControls?: boolean;

  /**
   * Position of the map controls
   */
  controlsPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  /**
   * Whether to show the map legend
   */
  showLegend?: boolean;

  /**
   * Items to display in the legend
   */
  legendItems?: { label: string; color: string; }[];

  /**
   * Position of the legend
   */
  legendPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

  /**
   * Whether to use custom controls instead of Mapbox controls
   */
  useCustomControls?: boolean;

  /**
   * Whether the map is interactive (can be panned, zoomed)
   */
  interactive?: boolean;

  /**
   * Mapbox access token
   */
  mapboxAccessToken?: string;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Ref object to access map methods
   */
  ref?: React.Ref<MapViewRef>;
}

/**
 * Styled container for the map component
 */
const MapContainer = styled.div<{ width: string | number; height: string | number }>`
  position: relative;
  width: ${props => props.width};
  height: ${props => props.height};
  overflow: hidden;
  border-radius: 8px;
`;

/**
 * A reusable map component that serves as the foundation for all map visualizations across the platform.
 */
const MapView: React.FC<MapViewProps> = forwardRef((
  {
    initialViewState,
    initialCenter,
    initialZoom = DEFAULT_ZOOM,
    initialBounds,
    mapStyle = DEFAULT_MAP_STYLE,
    width = '100%',
    height = '400px',
    children,
    onClick,
    onMove,
    onLoad,
    showControls = true,
    controlsPosition = 'top-right',
    showLegend = false,
    legendItems,
    legendPosition = 'bottom-left',
    useCustomControls = false,
    interactive = true,
    mapboxAccessToken = MAPBOX_ACCESS_TOKEN,
    className,
  }, ref) => {
  // State to store the map instance
  const [viewState, setViewState] = useState<Partial<ViewState>>({
    zoom: initialZoom,
    ...initialViewState,
  });

  // State to track fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State to track legend expansion
  const [legendExpanded, setLegendExpanded] = useState(true);

  // Ref to store the map instance
  const mapRef = useRef<MapRef>(null);

  // Access geolocation
  const { position: currentLocation, getCurrentPosition } = useGeolocation();

  // Handle map load event
  const handleMapLoad = useCallback((event: any) => {
    // Store the map instance
    mapRef.current = event.target;

    // Call the onLoad callback if provided
    if (onLoad) {
      onLoad(mapRef.current as MapRef);
    }

    // If initialBounds is provided, fit the map to those bounds
    if (initialBounds) {
      fitBounds(initialBounds);
    }

    // If initialCenter is provided and initialBounds is not, center the map on that position
    else if (initialCenter) {
      flyTo({ center: [initialCenter.longitude, initialCenter.latitude], zoom: initialZoom });
    }
  }, [initialBounds, initialCenter, initialZoom, onLoad]);

  // Handle map click events
  const handleMapClick = useCallback((event: any) => {
    // Extract the clicked coordinates from the event
    const coordinates = { lng: event.lngLat.lng, lat: event.lngLat.lat };

    // Call the onClick callback if provided
    if (onClick) {
      onClick(coordinates, event);
    }
  }, [onClick]);

  // Handle map movement events (pan, zoom, rotate)
  const handleMapMove = useCallback((viewState: ViewState) => {
    // Update the internal viewState with the new values
    setViewState(viewState);

    // Call the onMove callback if provided
    if (onMove) {
      onMove(viewState);
    }
  }, [onMove]);

  // Handle zoom in action
  const handleZoomIn = useCallback(() => {
    // Check if the map instance exists
    if (mapRef.current) {
      // Call the map's zoomIn method to increase zoom level
      mapRef.current.zoomIn();
    }
  }, []);

  // Handle zoom out action
  const handleZoomOut = useCallback(() => {
    // Check if the map instance exists
    if (mapRef.current) {
      // Call the map's zoomOut method to decrease zoom level
      mapRef.current.zoomOut();
    }
  }, []);

  // Handle toggling fullscreen mode
  const handleFullscreen = useCallback(() => {
    // Toggle the isFullscreen state
    setIsFullscreen(!isFullscreen);

    // If entering fullscreen, call the container's requestFullscreen method
    if (!isFullscreen && mapRef.current?.getContainer()) {
      const container = mapRef.current.getContainer() as any;
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) { /* Firefox */
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) { /* IE/Edge */
        container.msRequestFullscreen();
      }
    }
    // If exiting fullscreen, call document.exitFullscreen
    else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari and Opera */
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Handle centering on current location
  const handleCurrentLocation = useCallback(() => {
    // Get the current position from the useGeolocation hook
    if (currentLocation) {
      // If position is available, fly to that location
      flyTo({ center: [currentLocation.longitude, currentLocation.latitude], zoom: 12 });
    } else {
      // If not available, trigger the geolocation request
      getCurrentPosition();
    }
  }, [currentLocation, getCurrentPosition, flyTo]);

  // Handle toggling legend expansion
  const handleToggleLegend = useCallback(() => {
    setIsExpanded(!legendExpanded);
  }, [legendExpanded]);

  // Method to fit the map view to specified bounds
  const fitBounds = useCallback((bounds: [[number, number], [number, number]], options?: object) => {
    // Check if the map instance exists
    if (mapRef.current) {
      // Call the map's fitBounds method with the provided bounds and options
      mapRef.current.fitBounds(bounds, options);
    }
  }, []);

  // Method to fit the map view to contain all specified points
  const fitPoints = useCallback((points: Position[], options?: object) => {
    // Check if points array has at least one point
    if (points.length === 0) {
      return;
    }

    // Calculate the bounding box using the calculateBoundingBox utility
    const { minLat, maxLat, minLon, maxLon } = calculateBoundingBox(points);

    // Convert the bounding box to the format expected by fitBounds
    const bounds: [[number, number], [number, number]] = [
      [minLon, minLat],
      [maxLon, maxLat],
    ];

    // Call fitBounds with the calculated bounds and options
    fitBounds(bounds, options);
  }, [fitBounds]);

  // Method to animate the map to a new view state
  const flyTo = useCallback((options: any) => {
    // Check if the map instance exists
    if (mapRef.current) {
      // Call the map's flyTo method with the provided options
      mapRef.current.flyTo(options);
    }
  }, []);

  // Expose map methods to parent components via ref
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,
    fitBounds,
    fitPoints,
    flyTo,
  }), [fitBounds, fitPoints, flyTo]);

  return (
    <MapContainer width={width} height={height} className={className}>
      <Map
        mapboxAccessToken={mapboxAccessToken}
        mapStyle={mapStyle}
        initialViewState={viewState}
        onMove={handleMapMove}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        reuseMaps
        interactive={interactive}
      >
        {children}
        {showControls && !useCustomControls && (
          <>
            <NavigationControl position={controlsPosition} />
            <GeolocateControl
              position={controlsPosition}
              showUserLocation={true}
              trackUserLocation={false}
            />
            <FullscreenControl position={controlsPosition} />
            <ScaleControl position="bottom-right" />
          </>
        )}
        {showControls && useCustomControls && (
          <MapControls
            map={mapRef.current}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFullscreen={handleFullscreen}
            onCurrentLocation={handleCurrentLocation}
            isFullscreen={isFullscreen}
            position={controlsPosition}
          />
        )}
        {showLegend && legendItems && (
          <MapLegend
            items={legendItems}
            position={legendPosition}
            expanded={legendExpanded}
            onToggle={handleToggleLegend}
          />
        )}
      </Map>
    </MapContainer>
  );
});

MapView.displayName = 'MapView';

export default MapView;