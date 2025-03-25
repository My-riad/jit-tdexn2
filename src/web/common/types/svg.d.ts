import * as React from 'react'; // React ^18.2.0

/**
 * Common props interface for SVG components used throughout the application
 */
export interface SVGComponentProps {
  /** Width of the SVG component (can be specified as a number or CSS string) */
  width?: string | number;
  /** Height of the SVG component (can be specified as a number or CSS string) */
  height?: string | number;
  /** Color of the SVG elements (usually applied to fill or stroke) */
  color?: string;
  /** CSS class names to apply to the SVG component */
  className?: string;
  /** Inline CSS styles to apply to the SVG component */
  style?: React.CSSProperties;
}

/**
 * Type definition for SVG icon components that combines React's SVG props with custom SVG props
 */
export type IconComponent = React.FC<React.SVGProps<SVGSVGElement> & SVGComponentProps>;

/**
 * Interface defining the complete set of SVG icons available in the application
 */
export interface IconSet {
  /** Achievement badge icon */
  achievement: IconComponent;
  /** Alert/warning notification icon */
  alert: IconComponent;
  /** Arrow icon (can be rotated for different directions) */
  arrow: IconComponent;
  /** Calendar/date icon */
  calendar: IconComponent;
  /** Checkmark/completion icon */
  check: IconComponent;
  /** Clock/time icon */
  clock: IconComponent;
  /** Close/dismiss icon */
  close: IconComponent;
  /** Dashboard/home icon */
  dashboard: IconComponent;
  /** Download icon */
  download: IconComponent;
  /** Driver/person icon */
  driver: IconComponent;
  /** Edit/pencil icon */
  edit: IconComponent;
  /** Filter/funnel icon */
  filter: IconComponent;
  /** Location/pin icon */
  location: IconComponent;
  /** Logout/sign out icon */
  logout: IconComponent;
  /** Menu/hamburger icon */
  menu: IconComponent;
  /** Money/currency icon */
  money: IconComponent;
  /** Notification/bell icon */
  notification: IconComponent;
  /** Phone/call icon */
  phone: IconComponent;
  /** Plus/add icon */
  plus: IconComponent;
  /** Profile/user icon */
  profile: IconComponent;
  /** Search/magnifying glass icon */
  search: IconComponent;
  /** Settings/gear icon */
  settings: IconComponent;
  /** Star/favorite icon */
  star: IconComponent;
  /** Truck/vehicle icon */
  truck: IconComponent;
}

/**
 * Props interface for SVG markers used in map components
 */
export interface MapMarkerSVGProps {
  /** Width of the marker (can be specified as a number or CSS string) */
  width?: string | number;
  /** Height of the marker (can be specified as a number or CSS string) */
  height?: string | number;
  /** Color of the marker */
  color?: string;
  /** Whether the marker is in selected state */
  selected?: boolean;
  /** CSS class names to apply to the marker */
  className?: string;
  /** Click handler for the marker */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  /** Inline CSS styles to apply to the marker */
  style?: React.CSSProperties;
}

/**
 * Props interface for SVG chart components used in data visualization
 */
export interface ChartSVGProps {
  /** Width of the chart (can be specified as a number or CSS string) */
  width?: string | number;
  /** Height of the chart (can be specified as a number or CSS string) */
  height?: string | number;
  /** Data array to be visualized in the chart */
  data: any[];
  /** Array of colors to use for data visualization */
  colors?: string[];
  /** CSS class names to apply to the chart */
  className?: string;
  /** Inline CSS styles to apply to the chart */
  style?: React.CSSProperties;
  /** Margin space around the chart content */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Click handler for chart interactions */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}