import React, { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl'; // v7.1.0
import { Position } from '../../../common/interfaces/tracking.interface';
import { colors } from '../../styles/colors';
import { decodePath } from '../../../common/utils/geoUtils';

/**
 * Props for the RouteLine component
 */
interface RouteLineProps {
  /**
   * Array of coordinates defining the route path.
   * Can be either Position objects with latitude/longitude properties,
   * or [longitude, latitude] tuples as expected by GeoJSON.
   */
  coordinates?: Position[] | [number, number][];
  
  /**
   * Google Maps encoded polyline string representing the route.
   * Will be decoded to coordinates if provided.
   */
  encodedPath?: string;
  
  /**
   * Color of the route line
   * @default colors.mapColors.routeLine
   */
  color?: string;
  
  /**
   * Width of the route line in pixels
   * @default 3
   */
  width?: number;
  
  /**
   * Dash pattern for the line [dash length, gap length]
   * @example [2, 1] for a dashed line
   */
  pattern?: Array<number>;
  
  /**
   * Opacity of the route line (0-1)
   * @default 1
   */
  opacity?: number;
  
  /**
   * Unique identifier for the route line
   * @default Generated random ID
   */
  id?: string;
  
  /**
   * Callback function when the route line is clicked
   */
  onClick?: (event: mapboxgl.MapLayerMouseEvent) => void;
  
  /**
   * Z-index for controlling the stacking order of the line
   * @default 0
   */
  zIndex?: number;
  
  /**
   * Whether the route line is interactive (can be clicked)
   * @default true
   */
  interactive?: boolean;
}

/**
 * RouteLine component for rendering a route path on a map
 * 
 * This component renders a line on a map representing a route between two or more points.
 * It supports both coordinate arrays and encoded polyline strings, with customizable styling.
 */
const RouteLine: React.FC<RouteLineProps> = ({
  coordinates,
  encodedPath,
  color = colors.mapColors.routeLine,
  width = 3,
  pattern,
  opacity = 1,
  id = `route-line-${Math.random().toString(36).substring(2, 9)}`,
  onClick,
  zIndex = 0,
  interactive = true,
}) => {
  // Create GeoJSON data from coordinates or encoded path
  const geoJsonData = useMemo(() => {
    let routeCoordinates: Array<[number, number]> = [];

    // If encodedPath is provided, decode it
    if (encodedPath) {
      const decodedCoordinates = decodePath(encodedPath);
      routeCoordinates = decodedCoordinates.map(coord => [coord.longitude, coord.latitude]);
    }
    // Otherwise use provided coordinates
    else if (coordinates && coordinates.length > 0) {
      routeCoordinates = coordinates.map(coord => {
        // Handle both Position objects and [number, number] tuples
        if ('latitude' in coord && 'longitude' in coord) {
          // Convert Position object to [longitude, latitude] for GeoJSON
          return [coord.longitude, coord.latitude];
        } else {
          // Assume [longitude, latitude] format for tuples, which is what GeoJSON expects
          return coord;
        }
      });
    }

    // Return a GeoJSON feature collection
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        },
      ],
    };
  }, [coordinates, encodedPath]);

  return (
    <Source id={`${id}-source`} type="geojson" data={geoJsonData}>
      <Layer
        id={id}
        type="line"
        paint={{
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
          'line-dasharray': pattern,
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': zIndex,
        }}
        onClick={interactive ? onClick : undefined}
      />
    </Source>
  );
};

export default RouteLine;