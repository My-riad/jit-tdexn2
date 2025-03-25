import React, { useState, useEffect, useCallback } from 'react';
import { Layer, Source } from 'react-map-gl'; // v7.1.0
import styled from 'styled-components'; // v5.3.10

import { Position } from '../../../common/interfaces/tracking.interface';
import { Hotspot } from '../../../common/interfaces/market.interface';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { calculateBoundingBox } from '../../../common/utils/geoUtils';
import { colors, mapColors, semantic } from '../../styles/colors';

/**
 * Interface for a data point in the heatmap
 */
interface HeatMapDataPoint {
  latitude: number;
  longitude: number;
  intensity?: number;
}

/**
 * Props for the HeatMap component
 */
interface HeatMapProps {
  /** Array of data points to visualize in the heatmap */
  dataPoints?: Array<HeatMapDataPoint>;
  /** Array of market hotspots to visualize in the heatmap */
  hotspots?: Hotspot[];
  /** Array of bonus zones to visualize in the heatmap */
  bonusZones?: BonusZone[];
  /** Whether the heatmap is visible */
  visible?: boolean;
  /** Opacity of the heatmap (0-1) */
  opacity?: number;
  /** Radius of influence for each data point in pixels */
  radius?: number;
  /** Multiplier for the intensity of the heatmap */
  intensity?: number;
  /** Color scheme for the heatmap gradient */
  colorScheme?: 'demand' | 'supply' | 'rate' | 'bonus' | string[];
  /** ID of the layer before which this layer should be inserted */
  beforeId?: string;
  /** Callback function when the heatmap is clicked */
  onClick?: (event: { lngLat: [number, number], features: any[] }) => void;
  /** Callback function when the heatmap is hovered */
  onHover?: (event: { lngLat: [number, number], features: any[] }) => void;
  /** Unique identifier for the heatmap layer */
  id?: string;
}

/**
 * Converts an array of data points into a GeoJSON format suitable for rendering as a heatmap
 * 
 * @param dataPoints Array of data points with latitude, longitude, and optional intensity
 * @returns GeoJSON FeatureCollection with point features
 */
const generateHeatmapData = (dataPoints: Array<{latitude: number, longitude: number, intensity?: number}>) => {
  if (!dataPoints || dataPoints.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: dataPoints.map(point => ({
      type: 'Feature',
      properties: {
        intensity: point.intensity || 1
      },
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude]
      }
    }))
  };
};

/**
 * Converts an array of Hotspot objects into a GeoJSON format suitable for rendering as a heatmap
 * 
 * @param hotspots Array of market hotspots
 * @returns GeoJSON FeatureCollection with point features
 */
const generateHeatmapFromHotspots = (hotspots: Hotspot[]) => {
  if (!hotspots || hotspots.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: hotspots.map(hotspot => {
      // Calculate intensity based on severity and confidence
      const severityFactor = 
        hotspot.severity === 'critical' ? 1.0 :
        hotspot.severity === 'high' ? 0.75 :
        hotspot.severity === 'medium' ? 0.5 : 0.25;
      
      const intensity = hotspot.confidence_score / 100 * severityFactor;

      return {
        type: 'Feature',
        properties: {
          id: hotspot.hotspot_id,
          type: hotspot.type,
          severity: hotspot.severity,
          confidence: hotspot.confidence_score,
          intensity: intensity
        },
        geometry: {
          type: 'Point',
          coordinates: [hotspot.center.longitude, hotspot.center.latitude]
        }
      };
    })
  };
};

/**
 * Converts an array of BonusZone objects into a GeoJSON format suitable for rendering as a heatmap
 * 
 * @param bonusZones Array of bonus zones
 * @returns GeoJSON FeatureCollection with point features
 */
const generateHeatmapFromBonusZones = (bonusZones: BonusZone[]) => {
  if (!bonusZones || bonusZones.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return {
    type: 'FeatureCollection',
    features: bonusZones.map(zone => {
      // Calculate centroid of the boundary polygon for the heatmap center
      const coordSum = zone.boundary.reduce(
        (sum, coord) => ({
          latitude: sum.latitude + coord.latitude / zone.boundary.length,
          longitude: sum.longitude + coord.longitude / zone.boundary.length
        }),
        { latitude: 0, longitude: 0 }
      );

      return {
        type: 'Feature',
        properties: {
          id: zone.id,
          name: zone.name,
          multiplier: zone.multiplier,
          startTime: zone.startTime,
          endTime: zone.endTime,
          intensity: zone.multiplier / 2 // Scale multiplier as intensity
        },
        geometry: {
          type: 'Point',
          coordinates: [coordSum.longitude, coordSum.latitude]
        }
      };
    })
  };
};

/**
 * Generates a color ramp array for the heatmap based on the specified color scheme
 * 
 * @param colorScheme The color scheme to use for the heatmap
 * @returns Array of color values for the heatmap gradient
 */
const getColorRamp = (colorScheme: string): string[] => {
  switch (colorScheme) {
    case 'demand':
      return [
        'rgba(255, 235, 132, 0)',
        'rgba(255, 235, 132, 0.2)',
        'rgba(255, 206, 68, 0.4)',
        'rgba(254, 176, 25, 0.6)',
        'rgba(253, 141, 60, 0.8)',
        'rgba(240, 59, 32, 1)'
      ];
    case 'supply':
      return [
        'rgba(213, 229, 240, 0)',
        'rgba(182, 212, 233, 0.2)',
        'rgba(133, 185, 223, 0.4)',
        'rgba(86, 152, 213, 0.6)',
        'rgba(48, 119, 206, 0.8)',
        'rgba(26, 115, 232, 1)'
      ];
    case 'rate':
      return [
        'rgba(213, 240, 224, 0)',
        'rgba(170, 226, 185, 0.2)',
        'rgba(120, 198, 146, 0.4)',
        'rgba(65, 171, 93, 0.6)',
        'rgba(35, 139, 69, 0.8)',
        'rgba(0, 109, 44, 1)'
      ];
    case 'bonus':
      return [
        'rgba(255, 235, 132, 0)',
        'rgba(255, 206, 68, 0.2)',
        'rgba(254, 176, 25, 0.4)',
        'rgba(253, 141, 60, 0.6)',
        'rgba(244, 102, 55, 0.8)',
        'rgba(234, 67, 53, 1)'
      ];
    default:
      if (Array.isArray(colorScheme)) {
        return colorScheme;
      }
      // Default gradient
      return [
        'rgba(0, 0, 255, 0)',
        'rgba(0, 0, 255, 0.2)',
        'rgba(0, 255, 255, 0.4)',
        'rgba(0, 255, 0, 0.6)',
        'rgba(255, 255, 0, 0.8)',
        'rgba(255, 0, 0, 1)'
      ];
  }
};

/**
 * A component that renders a heatmap visualization on a map to display data density or intensity patterns.
 * Used to visualize hotspots, demand forecasts, and bonus zones throughout the freight optimization platform.
 */
const HeatMap: React.FC<HeatMapProps> = ({
  dataPoints,
  hotspots,
  bonusZones,
  visible = true,
  opacity = 0.7,
  radius = 20,
  intensity = 1,
  colorScheme = 'demand',
  beforeId,
  onClick,
  onHover,
  id = 'heatmap-layer'
}) => {
  // State to store the processed GeoJSON data
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  // Process the input data to create GeoJSON when data changes
  useEffect(() => {
    if (dataPoints && dataPoints.length > 0) {
      setGeoJsonData(generateHeatmapData(dataPoints));
    } else if (hotspots && hotspots.length > 0) {
      setGeoJsonData(generateHeatmapFromHotspots(hotspots));
    } else if (bonusZones && bonusZones.length > 0) {
      setGeoJsonData(generateHeatmapFromBonusZones(bonusZones));
    } else {
      setGeoJsonData(null);
    }
  }, [dataPoints, hotspots, bonusZones]);

  // Configure the heatmap paint properties
  const colorRamp = getColorRamp(colorScheme);
  const heatmapPaint = {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'intensity'],
      0, 0,
      1, 1
    ],
    'heatmap-intensity': intensity,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, colorRamp[0],
      0.2, colorRamp[1],
      0.4, colorRamp[2],
      0.6, colorRamp[3],
      0.8, colorRamp[4],
      1, colorRamp[5]
    ],
    'heatmap-radius': radius,
    'heatmap-opacity': opacity
  };

  // Event handlers
  const handleClick = useCallback(
    (event: any) => {
      if (onClick && event.features && event.features.length > 0) {
        onClick({
          lngLat: event.lngLat,
          features: event.features
        });
      }
    },
    [onClick]
  );

  const handleHover = useCallback(
    (event: any) => {
      if (onHover && event.features && event.features.length > 0) {
        onHover({
          lngLat: event.lngLat,
          features: event.features
        });
      }
    },
    [onHover]
  );

  // Only render if we have data and the layer should be visible
  if (!visible || !geoJsonData) {
    return null;
  }

  return (
    <>
      <Source id={`${id}-source`} type="geojson" data={geoJsonData}>
        <Layer
          id={id}
          type="heatmap"
          paint={heatmapPaint}
          beforeId={beforeId}
        />
      </Source>
    </>
  );
};

export default HeatMap;