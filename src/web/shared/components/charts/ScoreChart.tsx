import React from 'react';
import styled from 'styled-components';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area
} from 'recharts';
import { colors, spacing } from '../../styles/theme';
import GaugeChart from './GaugeChart';

/**
 * Props interface for the ScoreChart component
 */
interface ScoreChartProps {
  score: number;
  previousScore?: number;
  history?: Array<{score: number, date: string | Date}>;
  target?: number;
  title?: string;
  subtitle?: string;
  min?: number;
  max?: number;
  height?: number;
  width?: number;
  chartType?: 'gauge' | 'line' | 'area' | 'combined';
  showHistory?: boolean;
  showTarget?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  thresholds?: number[];
  colors?: string[];
  animate?: boolean;
  animationDuration?: number;
  style?: React.CSSProperties;
  className?: string;
}

const ChartContainer = styled.div<{ height?: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '300px'};
  padding: ${spacing.md};
`;

const ChartHeader = styled.div`
  margin-bottom: ${spacing.md};
  text-align: center;
`;

const ChartTitle = styled.h3`
  font-size: ${props => props.theme.fonts.size.lg};
  font-weight: ${props => props.theme.fonts.weight.bold};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${spacing.xs} 0;
`;

const ChartSubtitle = styled.p`
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
`;

const GaugeContainer = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
`;

const LineChartContainer = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
`;

const CombinedContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
`;

const GaugeSection = styled.div`
  flex: 0.6;
  width: 100%;
`;

const HistorySection = styled.div`
  flex: 0.4;
  width: 100%;
  margin-top: ${spacing.md};
`;

const ScoreChange = styled.div`
  position: absolute;
  top: ${spacing.lg};
  right: ${spacing.lg};
  display: flex;
  align-items: center;
  font-size: ${props => props.theme.fonts.size.md};
`;

const PositiveChange = styled.span`
  color: ${props => props.theme.colors.semantic.success};
  display: flex;
  align-items: center;
`;

const NegativeChange = styled.span`
  color: ${props => props.theme.colors.semantic.error};
  display: flex;
  align-items: center;
`;

const CustomTooltipContainer = styled.div`
  background-color: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.light};
  border-radius: ${props => props.theme.borders.radius.md};
  padding: ${spacing.sm};
  box-shadow: ${props => props.theme.elevation.medium};
`;

const TooltipLabel = styled.p`
  margin: 0 0 ${spacing.xs} 0;
  font-weight: ${props => props.theme.fonts.weight.medium};
`;

const TooltipValue = styled.p<{ color?: string }>`
  margin: 0;
  font-weight: ${props => props.theme.fonts.weight.bold};
  color: ${props => props.color || props.theme.colors.text.primary};
`;

/**
 * Determines the color for a score based on thresholds
 */
const getScoreColor = (
  score: number,
  thresholds: number[] = [40, 60, 80],
  colorArray?: string[]
): string => {
  // Default colors use the semantic colors from the theme
  const defaultColors = [
    colors.semantic.error,
    colors.semantic.warning,
    colors.semantic.info,
    colors.semantic.success
  ];
  
  // Use provided colors or defaults
  const finalColors = colorArray || defaultColors;
  
  if (score < thresholds[0]) return finalColors[0];
  if (score < thresholds[1]) return finalColors[1];
  if (score < thresholds[2]) return finalColors[2];
  return finalColors[3];
};

/**
 * Formats a date for display in the chart
 */
const formatScoreDate = (date: string | Date, format?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  }
  
  if (format === 'medium') {
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${String(dateObj.getFullYear()).substr(2, 2)}`;
  }
  
  if (format === 'time') {
    return `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
  }
  
  return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
};

/**
 * Custom tooltip component for displaying score details on hover
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const date = payload[0].payload.date;
    const formattedDate = formatScoreDate(date);
    const color = getScoreColor(score);
    
    return (
      <CustomTooltipContainer>
        <TooltipLabel>{formattedDate}</TooltipLabel>
        <TooltipValue color={color}>Score: {score}</TooltipValue>
      </CustomTooltipContainer>
    );
  }
  
  return null;
};

/**
 * Prepares historical score data for the chart
 */
const prepareHistoryData = (history: Array<{score: number, date: string | Date}>) => {
  return [...history].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * A customizable chart component that visualizes driver efficiency scores with historical trends
 */
export const ScoreChart: React.FC<ScoreChartProps> = ({
  score,
  previousScore,
  history,
  target,
  title,
  subtitle,
  min = 0,
  max = 100,
  height = 300,
  width,
  chartType = 'combined',
  showHistory = true,
  showTarget = true,
  showLabels = true,
  showTooltip = true,
  thresholds = [40, 60, 80],
  colors: colorArray,
  animate = true,
  animationDuration = 1000,
  style,
  className
}) => {
  // Get color for the current score
  const scoreColor = getScoreColor(score, thresholds, colorArray);
  
  // Calculate score change if previous score is provided
  const scoreChange = previousScore !== undefined ? score - previousScore : undefined;
  
  // Prepare history data if provided
  const historyData = history && showHistory ? prepareHistoryData(history) : [];
  
  return (
    <ChartContainer height={height} style={style} className={className}>
      {/* Chart header with title and subtitle */}
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      
      {/* Render different chart types based on chartType prop */}
      {chartType === 'gauge' && (
        <GaugeContainer>
          <GaugeChart
            value={score}
            min={min}
            max={max}
            colors={colorArray}
            thresholds={thresholds}
            animate={animate}
            animationDuration={animationDuration}
            target={showTarget ? target : undefined}
          />
          
          {/* Score change indicator */}
          {scoreChange !== undefined && (
            <ScoreChange>
              {scoreChange > 0 ? (
                <PositiveChange>+{scoreChange.toFixed(1)}▲</PositiveChange>
              ) : scoreChange < 0 ? (
                <NegativeChange>{scoreChange.toFixed(1)}▼</NegativeChange>
              ) : null}
            </ScoreChange>
          )}
        </GaugeContainer>
      )}
      
      {/* Line chart for historical data */}
      {(chartType === 'line' || chartType === 'area') && showHistory && historyData.length > 0 && (
        <LineChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={historyData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.chart.grid} />
              {showLabels && (
                <>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => formatScoreDate(date, 'short')}
                    stroke={colors.chart.axis}
                    tick={{ fill: colors.chart.label }}
                  />
                  <YAxis
                    domain={[min, max]}
                    stroke={colors.chart.axis}
                    tick={{ fill: colors.chart.label }}
                  />
                </>
              )}
              
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              
              {showTarget && target !== undefined && (
                <ReferenceLine
                  y={target}
                  stroke={colors.chart.secondary}
                  strokeDasharray="3 3"
                  label={{ value: `Target: ${target}`, fill: colors.chart.label, position: 'right' }}
                />
              )}
              
              {chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={scoreColor}
                  strokeWidth={2}
                  dot={{ fill: scoreColor, r: 4 }}
                  activeDot={{ r: 6, fill: scoreColor }}
                  isAnimationActive={animate}
                  animationDuration={animationDuration}
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={scoreColor}
                  fill={scoreColor}
                  fillOpacity={0.2}
                  isAnimationActive={animate}
                  animationDuration={animationDuration}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </LineChartContainer>
      )}
      
      {/* Combined gauge and history chart */}
      {chartType === 'combined' && (
        <CombinedContainer>
          <GaugeSection>
            <GaugeChart
              value={score}
              min={min}
              max={max}
              colors={colorArray}
              thresholds={thresholds}
              animate={animate}
              animationDuration={animationDuration}
              target={showTarget ? target : undefined}
            />
            
            {/* Score change indicator */}
            {scoreChange !== undefined && (
              <ScoreChange>
                {scoreChange > 0 ? (
                  <PositiveChange>+{scoreChange.toFixed(1)}▲</PositiveChange>
                ) : scoreChange < 0 ? (
                  <NegativeChange>{scoreChange.toFixed(1)}▼</NegativeChange>
                ) : null}
              </ScoreChange>
            )}
          </GaugeSection>
          
          {/* History chart section */}
          {showHistory && historyData.length > 0 && (
            <HistorySection>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.chart.grid} />
                  {showLabels && (
                    <>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => formatScoreDate(date, 'short')}
                        stroke={colors.chart.axis}
                        tick={{ fill: colors.chart.label }}
                      />
                      <YAxis
                        domain={[min, max]}
                        stroke={colors.chart.axis}
                        tick={{ fill: colors.chart.label }}
                      />
                    </>
                  )}
                  
                  {showTooltip && <Tooltip content={<CustomTooltip />} />}
                  
                  {showTarget && target !== undefined && (
                    <ReferenceLine
                      y={target}
                      stroke={colors.chart.secondary}
                      strokeDasharray="3 3"
                      label={{ value: `Target: ${target}`, fill: colors.chart.label, position: 'right' }}
                    />
                  )}
                  
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={scoreColor}
                    fill={scoreColor}
                    fillOpacity={0.2}
                    isAnimationActive={animate}
                    animationDuration={animationDuration}
                  />
                </LineChart>
              </ResponsiveContainer>
            </HistorySection>
          )}
        </CombinedContainer>
      )}
    </ChartContainer>
  );
};

export default ScoreChart;