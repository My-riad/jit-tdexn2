import React from 'react';
import styled from 'styled-components';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Dot,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { colors, spacing } from '../../styles/theme';

// Interfaces for data structure and component props
interface DataPoint {
  x: any;
  y: any;
  additionalValues?: any;
  color?: string;
}

interface DataSeries {
  name: string;
  dataKey: string;
  color?: string;
  strokeDashed?: boolean;
  strokeWidth?: number;
}

interface ReferenceLine {
  label: string;
  value: number;
  color?: string;
  axis?: string;
  dashed?: boolean;
}

interface ReferenceArea {
  label?: string;
  y1: number;
  y2: number;
  color?: string;
  opacity?: number;
}

interface LineChartProps {
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
  showDots?: boolean;
  colors?: string[];
  referenceLines?: ReferenceLine[];
  referenceAreas?: ReferenceArea[];
  style?: React.CSSProperties;
  className?: string;
  animate?: boolean;
  valueFormatter?: (value: any) => string;
  xAxisFormatter?: (value: any) => string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  connectNulls?: boolean;
  strokeWidth?: number;
  dotSize?: number;
  syncId?: boolean;
  areaFill?: string;
  areaOpacity?: number;
}

// Styled components for the chart and its elements
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: ${props => props.height || '400px'};
  padding: ${spacing.md};
`;

const ChartHeader = styled.div`
  margin-bottom: ${spacing.md};
`;

const ChartTitle = styled.h3`
  font-size: ${props => props.theme.fonts.size.lg};
  font-weight: ${props => props.theme.fonts.weight.bold};
  color: ${colors.text.primary};
  margin: 0 0 ${spacing.xs} 0;
`;

const ChartSubtitle = styled.p`
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${colors.text.secondary};
  margin: 0;
`;

const ChartContent = styled.div`
  flex: 1;
  width: 100%;
`;

const CustomTooltipWrapper = styled.div`
  background-color: ${colors.background.primary};
  border: 1px solid ${colors.border.light};
  border-radius: ${props => props.theme.borders.radius.md};
  padding: ${spacing.sm};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const TooltipLabel = styled.p`
  font-weight: ${props => props.theme.fonts.weight.bold};
  margin: 0 0 ${spacing.xs} 0;
`;

const TooltipValue = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
`;

const ColorIndicator = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: ${spacing.xs};
  background-color: ${props => props.color};
`;

/**
 * Custom tooltip component for displaying detailed information on hover
 */
const CustomTooltip = (props: any) => {
  const { active, payload, label, valueFormatter } = props;
  
  if (!active || !payload || !payload.length) {
    return null;
  }
  
  return (
    <CustomTooltipWrapper>
      <TooltipLabel>{label}</TooltipLabel>
      {payload.map((entry: any, index: number) => (
        <TooltipValue key={`tooltip-value-${index}`}>
          <ColorIndicator color={entry.color} />
          {entry.name}: {valueFormatter ? valueFormatter(entry.value) : entry.value}
        </TooltipValue>
      ))}
    </CustomTooltipWrapper>
  );
};

/**
 * Custom dot component for rendering data points with custom styling
 */
const CustomDot = (props: any) => {
  const { cx, cy, stroke, strokeWidth, index, value, r, fill } = props;
  
  // Determine dot color based on value and thresholds
  const dotColor = fill || stroke;
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r || 4}
      stroke={stroke}
      strokeWidth={strokeWidth || 1}
      fill={dotColor}
    />
  );
};

/**
 * A reusable line chart component that visualizes data as a series of points connected by straight line segments.
 * This component is used throughout the platform for displaying time-series data such as efficiency trends,
 * historical performance metrics, and other key indicators that show changes over time.
 */
const LineChart: React.FC<LineChartProps> = ({
  data,
  series,
  xAxisDataKey = 'x',
  yAxisDataKey = 'y',
  title,
  subtitle,
  height = 400,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showDots = true,
  colors: colorsProp = [
    colors.chart.primary,
    colors.chart.secondary,
    colors.chart.tertiary,
    colors.chart.quaternary
  ],
  referenceLines,
  referenceAreas,
  style,
  className,
  animate = true,
  valueFormatter,
  xAxisFormatter,
  yAxisLabel,
  xAxisLabel,
  connectNulls = false,
  strokeWidth = 2,
  dotSize = 4,
  syncId,
  areaFill,
  areaOpacity = 0.1
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
          <RechartsLineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            syncId={syncId ? 'sync' : undefined}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.chart.grid}
                vertical={false}
              />
            )}
            <XAxis
              dataKey={xAxisDataKey}
              tick={{ fill: colors.chart.label }}
              tickLine={{ stroke: colors.chart.axis }}
              axisLine={{ stroke: colors.chart.axis }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              tickFormatter={xAxisFormatter}
            />
            <YAxis
              tick={{ fill: colors.chart.label }}
              tickLine={{ stroke: colors.chart.axis }}
              axisLine={{ stroke: colors.chart.axis }}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            
            {showTooltip && (
              <Tooltip
                content={<CustomTooltip valueFormatter={valueFormatter} />}
                cursor={{ stroke: colors.chart.grid, strokeDasharray: '3 3' }}
              />
            )}
            
            {showLegend && (
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingTop: '10px' }}
              />
            )}
            
            {/* Render multiple lines if series is provided */}
            {series ? (
              series.map((s, index) => (
                <Line
                  key={`line-${s.name}`}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color || colorsProp[index % colorsProp.length]}
                  strokeWidth={s.strokeWidth || strokeWidth}
                  strokeDasharray={s.strokeDashed ? '5 5' : undefined}
                  dot={showDots ? (props) => <CustomDot {...props} r={dotSize} /> : false}
                  activeDot={{ r: dotSize + 2 }}
                  connectNulls={connectNulls}
                  isAnimationActive={animate}
                  animationDuration={animate ? 1000 : 0}
                  {...(areaFill ? {
                    fill: areaFill === 'auto' ? s.color || colorsProp[index % colorsProp.length] : areaFill,
                    fillOpacity: areaOpacity
                  } : {})}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={yAxisDataKey}
                stroke={colorsProp[0]}
                strokeWidth={strokeWidth}
                dot={showDots ? (props) => <CustomDot {...props} r={dotSize} /> : false}
                activeDot={{ r: dotSize + 2 }}
                connectNulls={connectNulls}
                isAnimationActive={animate}
                animationDuration={animate ? 1000 : 0}
                {...(areaFill ? {
                  fill: areaFill === 'auto' ? colorsProp[0] : areaFill,
                  fillOpacity: areaOpacity
                } : {})}
              />
            )}
            
            {/* Render reference lines if provided */}
            {referenceLines?.map((line, index) => (
              <ReferenceLine
                key={`ref-line-${index}`}
                y={line.axis !== 'x' ? line.value : undefined}
                x={line.axis === 'x' ? line.value : undefined}
                label={{
                  value: line.label,
                  fill: colors.text.secondary,
                  fontSize: 12
                }}
                stroke={line.color || colors.chart.grid}
                strokeDasharray={line.dashed ? '3 3' : undefined}
              />
            ))}
            
            {/* Render reference areas if provided */}
            {referenceAreas?.map((area, index) => (
              <ReferenceArea
                key={`ref-area-${index}`}
                y1={area.y1}
                y2={area.y2}
                label={area.label}
                fill={area.color || colors.chart.grid}
                fillOpacity={area.opacity || 0.1}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </ChartContent>
    </ChartContainer>
  );
};

export default LineChart;