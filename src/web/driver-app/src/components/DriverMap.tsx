import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Fragment,
} from 'react'; //  ^18.2.0
import { Source, Layer } from 'react-map-gl'; //  ^7.1.0
import styled from 'styled-components'; //  ^5.3.10
import { useSelector, useDispatch } from 'react-redux'; //  ^8.0.5

import MapView from '../../shared/components/maps/MapView'; // Base map component for extending with driver-specific functionality
import TruckMarker from '../../shared/components/maps/TruckMarker'; // Specialized marker component for displaying trucks on the map
import LoadMarker from '../../shared/components/maps/LoadMarker'; // Specialized marker component for displaying loads on the map
import SmartHubMarker from '../../shared/components/maps/SmartHubMarker'; // Specialized marker component for displaying Smart Hubs on the map
import BonusZoneLayer from '../../shared/components/maps/BonusZoneLayer'; // Component for rendering bonus zones as polygon layers on the map
import useDriverLocation from '../hooks/useDriverLocation'; // Custom hook for accessing and updating the driver's location
import useLoadUpdates from '../hooks/useLoadUpdates'; // Custom hook for receiving real-time updates about the active load
import { calculateBoundingBox } from '../../../common/utils/geoUtils'; // Utility function to calculate a bounding box containing all provided points
import mapUtils from '../utils/mapUtils'; // Utility functions for map operations specific to the driver app
import { colors } from '../styles/colors'; // Color definitions for map elements
import { Load, LoadRecommendation } from '../../../common/interfaces/load.interface';
import { SmartHub } from '../../../../backend/common/interfaces/smartHub.interface';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { Position } from '../../../common/interfaces';

/**
 * Interface defining the props for the DriverMap component
 */
interface DriverMapProps {
  /** Height of the map container */
  height?: string | number;
  /** Width of the map container */
  width?: string | number;
  /** Whether to show recommended loads on the map */
  showRecommendedLoads?: boolean;
  /** Whether to show the active load on the map */
  showActiveLoad?: boolean;
  /** Whether to show Smart Hubs on the map */
  showSmartHubs?: boolean;
  /** Whether to show bonus zones on the map */
  showBonusZones?: boolean;
  /** Array of bonus zones to display on the map */
  bonusZones?: BonusZone[];
  /** Array of Smart Hubs to display on the map */
  smartHubs?: SmartHub[];
  /** Initial view mode for the map */
  initialViewMode?: ViewMode;
  /** Callback function when a load is selected */
  onLoadSelect?: (load: Load) => void;
  /** Callback function when a Smart Hub is selected */
  onSmartHubSelect?: (smartHub: SmartHub) => void;
  /** Callback function when a bonus zone is selected */
  onBonusZoneSelect?: (bonusZone: BonusZone) => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Enum for different map view modes
 */
interface ViewMode {
  ALL: string;
  ACTIVE_LOAD: string;
  RECOMMENDED_LOADS: string;
  SMART_HUBS: string;
  BONUS_ZONES: string;
}

/**
 * Styled container for the map component
 */
const MapContainer = styled.div<{ width: string | number; height: string | number }>`
  position: relative;
  width: ${(props) => props.width};
  height: ${(props) => props.height};
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

/**
 * Styled container for the view mode controls
 */
const ViewModeControls = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

/**
 * Styled button for each view mode option
 */
const ViewModeButton = styled.button<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  background-color: ${(props) => (props.active ? colors.primary.blue : 'white')};
  color: ${(props) => (props.active ? 'white' : colors.neutral.darkGray)};
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background-color: ${(props) => (props.active ? colors.primary.blue : colors.secondary.lightBlue)};
  }
`;

/**
 * A specialized map component for the driver mobile application that displays the driver's current location, active load, recommended loads, Smart Hubs, and bonus zones.
 */
const DriverMap: React.FC<DriverMapProps> = ({
  height = '100%',
  width = '100%',
  showRecommendedLoads = true,
  showActiveLoad = true,
  showSmartHubs = true,
  showBonusZones = true,
  bonusZones = [],
  smartHubs = [],
  initialViewMode = 'ALL',
  onLoadSelect,
  onSmartHubSelect,
  onBonusZoneSelect,
  className,
}) => {
  // Access Redux store state
  const recommendedLoads = useSelector((state: any) => state.load.recommendations) as LoadRecommendation[];
  const vehicle = useSelector((state: any) => state.vehicle.currentVehicle);

  // Access and update the driver's location
  const { position: driverPosition } = useDriverLocation(vehicle?.driver_id || '', vehicle?.vehicle_id || '');

  // Receive real-time updates about the active load
  const { activeLoad } = useLoadUpdates(vehicle?.current_load_id || '');

  // Manage component state
  const [viewMode, setViewMode] = useState<string>(initialViewMode);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedSmartHubId, setSelectedSmartHubId] = useState<string | null>(null);
  const [selectedBonusZoneId, setSelectedBonusZoneId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Store reference to the MapView component
  const mapRef = useRef<any>(null);

  // Memoize callback functions
  const handleMapLoad = useCallback((map: any) => {
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  const handleLoadClick = useCallback((load: Load, event: React.MouseEvent) => {
    setSelectedLoadId(load.id);
    onLoadSelect?.(load);
  }, [onLoadSelect]);

  const handleSmartHubClick = useCallback((smartHub: SmartHub, event: React.MouseEvent) => {
    setSelectedSmartHubId(smartHub.hub_id);
    onSmartHubSelect?.(smartHub);
  }, [onSmartHubSelect]);

  const handleBonusZoneClick = useCallback((event: any) => {
    const bonusZone = event.features[0].properties;
    setSelectedBonusZoneId(bonusZone.id);
    onBonusZoneSelect?.(bonusZone);
  }, [onBonusZoneSelect]);

  const fitMapToCurrentView = useCallback(() => {
    let points: Position[] = [];

    if (driverPosition) {
      points.push(driverPosition);
    }
    if (activeLoad && showActiveLoad && activeLoad.locations && activeLoad.locations.length > 0) {
      points.push(activeLoad.locations[0].coordinates);
    }
    if (recommendedLoads && showRecommendedLoads && (viewMode === 'ALL' || viewMode === 'RECOMMENDED_LOADS')) {
      recommendedLoads.forEach(load => {
        // Assuming load has a location property
        points.push({latitude: 0, longitude: 0, speed: 0, heading: 0, accuracy: 0, timestamp: '', source: 'MANUAL'});
      });
    }
    if (smartHubs && showSmartHubs && (viewMode === 'ALL' || viewMode === 'SMART_HUBS')) {
      smartHubs.forEach(hub => {
        points.push({latitude: hub.latitude, longitude: hub.longitude, speed: 0, heading: 0, accuracy: 0, timestamp: '', source: 'MANUAL'});
      });
    }
    if (bonusZones && showBonusZones && (viewMode === 'ALL' || viewMode === 'BONUS_ZONES')) {
      bonusZones.forEach(zone => {
        zone.boundary.forEach(point => {
          points.push({latitude: point.latitude, longitude: point.longitude, speed: 0, heading: 0, accuracy: 0, timestamp: '', source: 'MANUAL'});
        });
      });
    }

    if (points.length > 0 && mapRef.current) {
      const { minLat, maxLat, minLon, maxLon } = calculateBoundingBox(points);
      mapRef.current.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
        padding: 50,
        duration: 1000
      });
    }
  }, [driverPosition, activeLoad, recommendedLoads, smartHubs, bonusZones, viewMode, showActiveLoad, showRecommendedLoads, showSmartHubs, showBonusZones]);

  const toggleViewMode = useCallback((mode: string) => {
    setViewMode(mode);
  }, []);

  useEffect(() => {
    fitMapToCurrentView();
  }, [driverPosition, activeLoad, recommendedLoads, smartHubs, bonusZones, viewMode, isMapReady]);

  useEffect(() => {
    setSelectedLoadId(null);
    setSelectedSmartHubId(null);
    setSelectedBonusZoneId(null);
  }, [viewMode]);

  const activeRouteData = useMemo(() => {
    if (!activeLoad || !activeLoad.locations || activeLoad.locations.length < 2) {
      return null;
    }
    return mapUtils.getRoutePoints(activeLoad.locations[0].coordinates, activeLoad.locations[1].coordinates);
  }, [activeLoad]);

  const activeRoutePaint = {
    'line-color': colors.mapColors.routeLine,
    'line-width': 4,
    'line-opacity': 0.7
  };

  return (
    <MapContainer width={width} height={height} className={className}>
      <MapView
        ref={mapRef}
        width="100%"
        height="100%"
        onLoad={handleMapLoad}
        showControls
        useCustomControls
      >
        {driverPosition && vehicle && (
          <TruckMarker vehicle={vehicle} position={driverPosition} size={32} />
        )}
        {showActiveLoad && activeLoad && (
          <Fragment>
            <LoadMarker
              load={activeLoad}
              size={28}
              selected={selectedLoadId === activeLoad.id}
              onClick={handleLoadClick}
              zIndex={2}
            />
            {activeLoad.locations && activeLoad.locations[1] && (
              <LoadMarker
                load={activeLoad}
                position={activeLoad.locations[1].coordinates}
                size={28}
                selected={selectedLoadId === activeLoad.id}
                onClick={handleLoadClick}
                zIndex={2}
              />
            )}
            <Source id="active-route-source" type="geojson" data={activeRouteData}>
              <Layer id="active-route-line" type="line" paint={activeRoutePaint} />
            </Source>
          </Fragment>
        )}
        {showRecommendedLoads && recommendedLoads.length > 0 && (viewMode === 'ALL' || viewMode === 'RECOMMENDED_LOADS') &&
          recommendedLoads.map(load => (
            <LoadMarker
              key={load.loadId}
              load={load}
              size={24}
              selected={selectedLoadId === load.loadId}
              onClick={handleLoadClick}
              zIndex={1}
            />
          ))}
        {showSmartHubs && smartHubs.length > 0 && (viewMode === 'ALL' || viewMode === 'SMART_HUBS') &&
          smartHubs.map(hub => (
            <SmartHubMarker
              key={hub.hub_id}
              smartHub={hub}
              size={32}
              selected={selectedSmartHubId === hub.hub_id}
              onClick={handleSmartHubClick}
              zIndex={1}
            />
          ))}
        <BonusZoneLayer
          bonusZones={bonusZones}
          visible={showBonusZones && (viewMode === 'ALL' || viewMode === 'BONUS_ZONES')}
          opacity={0.5}
          onClick={handleBonusZoneClick}
          id="driver-bonus-zones"
        />
      </MapView>
    </MapContainer>
  );
};

export default DriverMap;