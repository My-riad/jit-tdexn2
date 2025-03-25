import React from 'react';
import styled from 'styled-components';
import { colors, spacing } from '../../styles/theme';
import LineChart from './LineChart';
import GaugeChart from './GaugeChart';

// Interface for the EfficiencyChart component props
interface EfficiencyChartProps {
  score: number;                // Current efficiency score value
  previousScore?: number;       // Previous efficiency score for comparison
  history?: Array<{             // Historical efficiency data
    date: string | Date;
    score: number;
    emptyMiles?: number;
    networkContribution?: number;
    smartHubUsage?: number;
  }>;
  target?: number;              // Target efficiency score to display as a reference
  title?: string;               // Chart title
  subtitle?: string;            // Chart subtitle
  min?: number;                 // Minimum value for the chart scale
  max?: number;                 // Maximum value for the chart scale
  height?: number;              // Chart height in pixels
  width?: number | string;      // Chart width in pixels or percentage
  chartType?: 'gauge' | 'line' | 'area' | 'combined'; // Type of chart to display
  showHistory?: boolean;        // Whether to show historical data
  showEmptyMiles?: boolean;     // Whether to show empty miles data series
  showNetworkContribution?: boolean; // Whether to show network contribution data series
  showSmartHubUsage?: boolean;  // Whether to show smart hub usage data series
  showTarget?: boolean;         // Whether to show target reference line
  showLabels?: boolean;         // Whether to show axis labels
  thresholds?: number[];        // Score thresholds for color changes
  colors?: string[];            // Colors for different score ranges
  animate?: boolean;            // Whether to animate the chart
  animationDuration?: number;   // Duration of animation in milliseconds
  style?: React.CSSProperties;  // Additional CSS styles
  className?: string;           // Additional CSS class name
}

// Styled components for the chart
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  padding: ${spacing.md};
`;

const ChartHeader = styled.div`
  margin-bottom: ${spacing.md};
  text-align: center;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 ${spacing.xs} 0;
  color: ${colors.text.primary};
`;

const ChartSubtitle = styled.p`
  font-size: 14px;
  color: ${colors.text.secondary};
  margin: 0;
`;

const GaugeContainer = styled.div`
  flex: 0.6;
  width: 100%;
  position: relative;
`;

const LineChartContainer = styled.div`
  flex: ${props => props.chartType === 'combined' ? '0.4' : '1'};
  width: 100%;
  position: relative;
`;

const CombinedContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
`;

const ScoreChange = styled.div`
  position: absolute;
  top: ${spacing.lg};
  right: ${spacing.lg};
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const PositiveChange = styled.span`
  color: ${colors.semantic.success};
  display: flex;
  align-items: center;
`;

const NegativeChange = styled.span`
  color: ${colors.semantic.error};
  display: flex;
  align-items: center;
`;

const MetricLegend = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${spacing.md};
  flex-wrap: wrap;
  gap: ${spacing.sm};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${spacing.md};
`;

const LegendColor = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: ${spacing.xs};
  background-color: ${props => props.color};
`;

const LegendLabel = styled.span`
  font-size: 12px;
  color: ${colors.text.secondary};
`;

/**
 * Determines the color for an efficiency score based on thresholds
 */
const getColorForScore = (
  score: number,
  thresholds: number[] = [40, 60, 80],
  colors?: string[]
): string => {
  // Default colors use the semantic colors from the theme
  const defaultColors = [
    colors.semantic.error,
    colors.semantic.warning,
    colors.semantic.info,
    colors.semantic.success
  ];
  
  // Use provided colors or defaults
  const finalColors = colors || defaultColors;
  
  if (score < thresholds[0]) return finalColors[0];
  if (score < thresholds[1]) return finalColors[1];
  if (score < thresholds[2]) return finalColors[2];
  return finalColors[3];
};

/**
 * Formats efficiency values for display in the chart
 */
const formatEfficiencyValue = (value: number, dataKey: string): string => {
  if (dataKey === 'score') {
    return Math.round(value).toString();
  } else if (dataKey === 'emptyMiles' || dataKey === 'smartHubUsage') {
    return `${Math.round(value)}%`;
  } else if (dataKey === 'networkContribution') {
    return `${value.toFixed(1)}`;
  }
  return value.toString();
};

/**
 * Prepares historical efficiency data for the chart
 */
const prepareHistoryData = (
  history: Array<{
    date: string | Date;
    score: number;
    emptyMiles?: number;
    networkContribution?: number;
    smartHubUsage?: number;
  }>
) => {
  // Sort history by date in ascending order
  return [...history].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * A specialized chart component for visualizing efficiency metrics in the freight optimization platform.
 * This component displays key performance indicators such as fleet efficiency score, empty miles percentage,
 * and network contribution over time, allowing users to track optimization progress and identify trends.
 */
const EfficiencyChart: React.FC<EfficiencyChartProps> = ({
  score,
  previousScore,
  history,
  target,
  title,
  subtitle,
  min = 0,
  max = 100,
  height = 400,
  width,
  chartType = 'combined',
  showHistory = true,
  showEmptyMiles = false,
  showNetworkContribution = false,
  showSmartHubUsage = false,
  showTarget = false,
  showLabels = true,
  thresholds,
  colors: customColors,
  animate = true,
  animationDuration = 1000,
  style,
  className
}) => {
  // Determine color for the current score
  const scoreColor = getColorForScore(score, thresholds, customColors);
  
  // Prepare history data if provided
  const processedHistory = history && showHistory ? prepareHistoryData(history) : [];
  
  return (
    <ChartContainer height={height} style={style} className={className}>
      {/* Render chart header if title or subtitle is provided */}
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      
      {/* Render chart content based on chartType */}
      {chartType === 'combined' ? (
        <CombinedContainer>
          {/* Gauge chart showing current score */}
          <GaugeContainer>
            <GaugeChart
              value={score}
              min={min}
              max={max}
              colors={customColors}
              thresholds={thresholds}
              animate={animate}
              animationDuration={animationDuration}
              showTarget={showTarget && target !== undefined}
              target={target}
            />
            
            {/* Score change indicator */}
            {previousScore !== undefined && (
              <ScoreChange>
                {score > previousScore ? (
                  <PositiveChange>
                    +{(score - previousScore).toFixed(1)}
                  </PositiveChange>
                ) : score < previousScore ? (
                  <NegativeChange>
                    {(score - previousScore).toFixed(1)}
                  </NegativeChange>
                ) : null}
              </ScoreChange>
            )}
          </GaugeContainer>
          
          {/* Line chart showing historical data */}
          {showHistory && processedHistory.length > 0 && (
            <LineChartContainer chartType={chartType}>
              <LineChart
                data={processedHistory}
                xAxisDataKey="date"
                series={[
                  { name: 'Efficiency Score', dataKey: 'score', color: scoreColor },
                  ...(showEmptyMiles ? [{ 
                    name: 'Empty Miles %', 
                    dataKey: 'emptyMiles', 
                    color: colors.semantic.error 
                  }] : []),
                  ...(showNetworkContribution ? [{ 
                    name: 'Network Contribution', 
                    dataKey: 'networkContribution', 
                    color: colors.semantic.success 
                  }] : []),
                  ...(showSmartHubUsage ? [{ 
                    name: 'Smart Hub Usage', 
                    dataKey: 'smartHubUsage', 
                    color: colors.semantic.warning 
                  }] : [])
                ]}
                showGrid={true}
                showLegend={true}
                showDots={true}
                animate={animate}
                connectNulls={true}
                valueFormatter={(value, dataKey) => formatEfficiencyValue(value, dataKey)}
                referenceLines={showTarget && target !== undefined ? [
                  { 
                    label: 'Target', 
                    value: target, 
                    color: colors.semantic.warning,
                    dashed: true 
                  }
                ] : undefined}
              />
            </LineChartContainer>
          )}
        </CombinedContainer>
      ) : chartType === 'gauge' ? (
        <GaugeContainer>
          <GaugeChart
            value={score}
            min={min}
            max={max}
            colors={customColors}
            thresholds={thresholds}
            title={title}
            subtitle={subtitle}
            height={height}
            width={width}
            animate={animate}
            animationDuration={animationDuration}
            showTarget={showTarget && target !== undefined}
            target={target}
          />
          
          {previousScore !== undefined && (
            <ScoreChange>
              {score > previousScore ? (
                <PositiveChange>
                  +{(score - previousScore).toFixed(1)}
                </PositiveChange>
              ) : score < previousScore ? (
                <NegativeChange>
                  {(score - previousScore).toFixed(1)}
                </NegativeChange>
              ) : null}
            </ScoreChange>
          )}
        </GaugeContainer>
      ) : (
        // Line or area chart
        showHistory && processedHistory.length > 0 && (
          <LineChartContainer>
            <LineChart
              data={processedHistory}
              xAxisDataKey="date"
              series={[
                { name: 'Efficiency Score', dataKey: 'score', color: scoreColor },
                ...(showEmptyMiles ? [{ 
                  name: 'Empty Miles %', 
                  dataKey: 'emptyMiles', 
                  color: colors.semantic.error 
                }] : []),
                ...(showNetworkContribution ? [{ 
                  name: 'Network Contribution', 
                  dataKey: 'networkContribution', 
                  color: colors.semantic.success 
                }] : []),
                ...(showSmartHubUsage ? [{ 
                  name: 'Smart Hub Usage', 
                  dataKey: 'smartHubUsage', 
                  color: colors.semantic.warning 
                }] : [])
              ]}
              title={title}
              subtitle={subtitle}
              height={height}
              showGrid={true}
              showLegend={true}
              showDots={true}
              animate={animate}
              connectNulls={true}
              valueFormatter={(value, dataKey) => formatEfficiencyValue(value, dataKey)}
              areaFill={chartType === 'area' ? 'auto' : undefined}
              areaOpacity={0.1}
              referenceLines={showTarget && target !== undefined ? [
                { 
                  label: 'Target', 
                  value: target, 
                  color: colors.semantic.warning,
                  dashed: true 
                }
              ] : undefined}
            />
          </LineChartContainer>
        )
      )}
      
      {/* Render metric legend if showing multiple metrics */}
      {(showEmptyMiles || showNetworkContribution || showSmartHubUsage) && (
        <MetricLegend>
          <LegendItem>
            <LegendColor color={scoreColor} />
            <LegendLabel>Efficiency Score</LegendLabel>
          </LegendItem>
          
          {showEmptyMiles && (
            <LegendItem>
              <LegendColor color={colors.semantic.error} />
              <LegendLabel>Empty Miles %</LegendLabel>
            </LegendItem>
          )}
          
          {showNetworkContribution && (
            <LegendItem>
              <LegendColor color={colors.semantic.success} />
              <LegendLabel>Network Contribution</LegendLabel>
            </LegendItem>
          )}
          
          {showSmartHubUsage && (
            <LegendItem>
              <LegendColor color={colors.semantic.warning} />
              <LegendLabel>Smart Hub Usage</LegendLabel>
            </LegendItem>
          )}
        </MetricLegend>
      )}
    </ChartContainer>
  );
};

export default EfficiencyChart;