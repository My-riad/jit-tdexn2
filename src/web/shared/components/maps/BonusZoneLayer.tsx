import React, { useState, useEffect, useCallback } from 'react';
import { Layer, Source } from 'react-map-gl';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { isPointInPolygon } from '../../../common/utils/geoUtils';
import { colors } from '../../styles/colors';

/**
 * Props for the BonusZoneLayer component
 */
interface BonusZoneLayerProps {
  /** Array of bonus zones to render on the map */
  bonusZones: BonusZone[];
  
  /** Whether the bonus zones are visible */
  visible?: boolean;
  
  /** Opacity of the bonus zone polygons (0-1) */
  opacity?: number;
  
  /** Width of the bonus zone polygon outlines in pixels */
  outlineWidth?: number;
  
  /** ID of the layer before which this layer should be inserted */
  beforeId?: string;
  
  /** Callback function when a bonus zone is clicked */
  onClick?: (event: { lngLat: [number, number], features: any[], bonusZone: BonusZone }) => void;
  
  /** Callback function when a bonus zone is hovered */
  onHover?: (event: { lngLat: [number, number], features: any[], bonusZone: BonusZone }) => void;
  
  /** Unique identifier for the bonus zone layer */
  id?: string;
  
  /** Whether the bonus zones are interactive (clickable/hoverable) */
  interactive?: boolean;
}

/**
 * Converts an array of BonusZone objects into a GeoJSON format suitable for rendering as polygon layers
 */
const generateGeoJsonFromBonusZones = (bonusZones: BonusZone[]) => {
  if (!bonusZones || !bonusZones.length) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  const features = bonusZones
    .filter(zone => isZoneActive(zone))
    .map(zone => {
      // Convert boundary coordinates to GeoJSON format
      const coordinates = [zone.boundary.map(coord => [coord.longitude, coord.latitude])];
      
      // Ensure the polygon is closed (first and last point are the same)
      if (
        coordinates[0].length > 0 && (
          coordinates[0][0][0] !== coordinates[0][coordinates[0].length - 1][0] ||
          coordinates[0][0][1] !== coordinates[0][coordinates[0].length - 1][1]
        )
      ) {
        coordinates[0].push(coordinates[0][0]);
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates
        },
        properties: {
          id: zone.id,
          name: zone.name,
          multiplier: zone.multiplier,
          reason: zone.reason,
          startTime: zone.startTime,
          endTime: zone.endTime,
          color: getZoneColor(zone.multiplier)
        }
      };
    });

  return {
    type: 'FeatureCollection',
    features
  };
};

/**
 * Determines if a bonus zone is currently active based on its start and end times
 */
const isZoneActive = (bonusZone: BonusZone): boolean => {
  if (!bonusZone.isActive) {
    return false;
  }

  const now = new Date();
  const startTime = new Date(bonusZone.startTime);
  const endTime = new Date(bonusZone.endTime);

  return now >= startTime && now <= endTime;
};

/**
 * Determines the color for a bonus zone based on its multiplier value
 */
const getZoneColor = (multiplier: number): string => {
  if (multiplier >= 2.0) {
    return colors.semantic.error; // Strong red for high multipliers
  } else if (multiplier >= 1.5) {
    return colors.primary.orange; // Orange for medium multipliers
  } else {
    return colors.primary.orangeLight; // Yellow for low multipliers
  }
};

/**
 * A component that renders bonus zones as polygon layers on a map to visualize areas
 * where drivers can earn extra money based on network optimization needs.
 */
const BonusZoneLayer: React.FC<BonusZoneLayerProps> = (props) => {
  const {
    bonusZones,
    visible = true,
    opacity = 0.6,
    outlineWidth = 2,
    beforeId,
    onClick,
    onHover,
    id = 'bonus-zone-layer',
    interactive = true
  } = props;

  // State for GeoJSON data
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  // State for hovered zone ID
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Convert bonus zones to GeoJSON when data changes
  useEffect(() => {
    if (bonusZones && bonusZones.length > 0) {
      const geoJson = generateGeoJsonFromBonusZones(bonusZones);
      setGeoJsonData(geoJson);
    } else {
      setGeoJsonData(null);
    }
  }, [bonusZones]);

  // Paint properties for the fill layer
  const fillPaint = {
    'fill-color': ['get', 'color'],
    'fill-opacity': opacity,
    'fill-outline-color': ['get', 'color']
  };

  // Paint properties for the line layer
  const linePaint = {
    'line-color': ['get', 'color'],
    'line-width': outlineWidth,
    'line-opacity': opacity + 0.2 // Slightly more opaque than the fill
  };

  // Handle click events on bonus zones
  const handleClick = useCallback((event) => {
    if (!onClick || !event.features || event.features.length === 0) return;

    const feature = event.features[0];
    const zoneId = feature.properties.id;
    const bonusZone = bonusZones.find(zone => zone.id === zoneId);

    if (bonusZone) {
      onClick({
        lngLat: event.lngLat,
        features: event.features,
        bonusZone
      });
    }
  }, [bonusZones, onClick]);

  // Handle hover events on bonus zones
  const handleHover = useCallback((event) => {
    if (!event.features || event.features.length === 0) {
      // If not hovering over a feature, clear hover state
      if (hoveredZoneId) {
        setHoveredZoneId(null);
      }
      return;
    }

    const feature = event.features[0];
    const zoneId = feature.properties.id;

    // Update hover state
    if (zoneId !== hoveredZoneId) {
      setHoveredZoneId(zoneId);
    }

    // Call onHover callback if provided
    if (onHover) {
      const bonusZone = bonusZones.find(zone => zone.id === zoneId);
      if (bonusZone) {
        onHover({
          lngLat: event.lngLat,
          features: event.features,
          bonusZone
        });
      }
    }
  }, [bonusZones, hoveredZoneId, onHover]);

  // Handle mouse leave events
  const handleMouseLeave = useCallback(() => {
    setHoveredZoneId(null);
  }, []);

  // If the layer is not visible or there's no data, don't render anything
  if (!visible || !geoJsonData) return null;

  return (
    <>
      <Source id={`${id}-source`} type="geojson" data={geoJsonData}>
        {/* Fill layer for the bonus zone area */}
        <Layer
          id={`${id}-fill`}
          type="fill"
          paint={fillPaint}
          beforeId={beforeId}
        />
        {/* Line layer for the bonus zone outline */}
        <Layer
          id={`${id}-line`}
          type="line"
          paint={linePaint}
          beforeId={beforeId}
        />
      </Source>
    </>
  );
};

export default BonusZoneLayer;