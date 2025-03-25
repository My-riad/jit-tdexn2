import React from 'react';
import styled from 'styled-components';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { theme } from '../../styles/theme';

/**
 * Interface representing a single data point for the bar chart
 */
interface DataPoint {
  name: string;
  value: any;
  additionalValues?: any;
  color?: string;
}

/**
 * Interface representing a data series for multi-bar charts
 */
interface DataSeries {
  name: string;
  dataKey: string;
  color?: string;
  stackId?: string;
}

/**
 * Interface representing a reference line for thresholds or targets
 */
interface ReferenceLine {
  label: string;
  value: number;
  color?: string;
  axis?: string;
  dashed?: boolean;
}

/**
 * Props interface for the BarChart component
 */
interface BarChartProps {
  data: DataPoint[];
  series?: DataSeries[];
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  colors?: string[];
  referenceLines?: ReferenceLine[];
  style?: React.CSSProperties;
  className?: string;
  horizontal?: boolean;
  stacked?: boolean;
  tooltipFormatter?: (value: any) => string;
  labelFormatter?: (value: any) => string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  barSize?: number;
  barGap?: number;
  animate?: boolean;
}

// Styled Components
const ChartContainer = styled.div<{ height?: number }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  padding: ${theme.spacing.md};
`;

const ChartHeader = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const ChartTitle = styled.h3`
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing.xs} 0;
`;

const ChartSubtitle = styled.p`
  font-size: ${theme.fonts.size.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

const ChartContent = styled.div`
  flex: 1;
  width: 100%;
`;

const CustomTooltip = styled.div`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borders.radius.md};
  padding: ${theme.spacing.sm};
  box-shadow: ${theme.elevation.low};
`;

const TooltipLabel = styled.p`
  font-weight: ${theme.fonts.weight.bold};
  margin: 0 0 ${theme.spacing.xs} 0;
`;

const TooltipValue = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
`;

const ColorIndicator = styled.span<{ color?: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: ${theme.spacing.xs};
  background-color: ${props => props.color};
`;

/**
 * Custom tooltip component for displaying detailed information on hover
 */
function CustomTooltip(props: any) {
  const { active, payload, label, tooltipFormatter } = props;
  
  if (active && payload && payload.length) {
    return (
      <CustomTooltip>
        <TooltipLabel>{label}</TooltipLabel>
        {payload.map((entry: any, index: number) => (
          <TooltipValue key={`tooltip-value-${index}`}>
            <ColorIndicator color={entry.color || entry.fill} />
            <span>{entry.name}: </span>
            <span>
              {tooltipFormatter ? tooltipFormatter(entry.value) : entry.value}
            </span>
          </TooltipValue>
        ))}
      </CustomTooltip>
    );
  }
  
  return null;
}

/**
 * A customizable bar chart component that visualizes comparative data as rectangular bars
 * 
 * The component supports both horizontal and vertical orientations, single or multiple data series,
 * stacked bars, reference lines, custom tooltips, and various styling options.
 */
const BarChart: React.FC<BarChartProps> = ({
  data,
  series,
  xAxisDataKey = 'name',
  yAxisDataKey = 'value',
  title,
  subtitle,
  height = 400,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  colors = [
    theme.colors.chart.primary,
    theme.colors.chart.secondary,
    theme.colors.chart.tertiary,
    theme.colors.chart.quaternary,
    theme.colors.text.secondary
  ],
  referenceLines,
  style,
  className,
  horizontal = false,
  stacked = false,
  tooltipFormatter,
  labelFormatter,
  yAxisLabel,
  xAxisLabel,
  barSize = 20,
  barGap = 4,
  animate = true
}) => {
  return (
    <ChartContainer height={height} style={style} className={className}>
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      
      <ChartContent>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            barGap={barGap}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.chart.grid} />}
            
            <XAxis
              dataKey={horizontal ? yAxisDataKey : xAxisDataKey}
              type={horizontal ? 'number' : 'category'}
              tick={{ fill: theme.colors.chart.label }}
              axisLine={{ stroke: theme.colors.chart.axis }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
            />
            
            <YAxis
              dataKey={horizontal ? xAxisDataKey : yAxisDataKey}
              type={horizontal ? 'category' : 'number'}
              tick={{ fill: theme.colors.chart.label }}
              axisLine={{ stroke: theme.colors.chart.axis }}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            
            {showTooltip && (
              <Tooltip
                content={<CustomTooltip tooltipFormatter={tooltipFormatter} />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
            )}
            
            {showLegend && <Legend />}
            
            {series ? (
              // Multiple data series
              series.map((s, index) => (
                <Bar
                  key={`bar-${s.dataKey}-${index}`}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color || colors[index % colors.length]}
                  stackId={stacked ? (s.stackId || 'stack') : undefined}
                  barSize={barSize}
                  isAnimationActive={animate}
                >
                  {showLabels && (
                    <LabelList
                      dataKey={s.dataKey}
                      position={horizontal ? 'insideRight' : 'insideTop'}
                      formatter={labelFormatter}
                    />
                  )}
                </Bar>
              ))
            ) : (
              // Single data series
              <Bar
                dataKey={yAxisDataKey}
                fill={colors[0]}
                barSize={barSize}
                isAnimationActive={animate}
              >
                {showLabels && (
                  <LabelList
                    dataKey={yAxisDataKey}
                    position={horizontal ? 'insideRight' : 'insideTop'}
                    formatter={labelFormatter}
                  />
                )}
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
              </Bar>
            )}
            
            {referenceLines &&
              referenceLines.map((line, index) => (
                <ReferenceLine
                  key={`ref-line-${index}`}
                  y={line.axis === 'x' ? undefined : line.value}
                  x={line.axis === 'x' ? line.value : undefined}
                  stroke={line.color || theme.colors.semantic.warning}
                  strokeDasharray={line.dashed ? '3 3' : undefined}
                  label={line.label}
                />
              ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </ChartContent>
    </ChartContainer>
  );
};

export default BarChart;