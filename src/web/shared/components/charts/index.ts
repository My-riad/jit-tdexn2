/**
 * Chart Component Library
 * 
 * This file serves as the entry point for all chart components, providing a centralized
 * import location for all data visualization needs throughout the application.
 * 
 * The chart components support both light and dark themes, responsive layouts,
 * and customizable styling to maintain consistency with the design system.
 */

// Import chart components
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import GaugeChart from './GaugeChart';
import ScoreChart from './ScoreChart';
import EfficiencyChart from './EfficiencyChart';

// Export all chart components
export {
  BarChart,       // For comparative data visualization (e.g., driver performance comparison)
  LineChart,      // For time-series data visualization (e.g., efficiency trends over time)
  PieChart,       // For distribution data visualization (e.g., load type breakdown)
  GaugeChart,     // For single value visualization (e.g., current efficiency level)
  ScoreChart,     // For driver efficiency score visualization with historical context
  EfficiencyChart // For comprehensive efficiency metrics visualization with multiple data series
};