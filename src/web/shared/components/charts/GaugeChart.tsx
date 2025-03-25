import React from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { colors, spacing } from '../../styles/theme';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number | string;
  startAngle?: number;
  endAngle?: number;
  thresholds?: number[];
  colors?: string[];
  format?: string;
  unit?: string;
  showValue?: boolean;
  style?: React.CSSProperties;
  className?: string;
  animate?: boolean;
  animationDuration?: number;
  valueFormatter?: (value: number) => string;
  target?: number;
  showTarget?: boolean;
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

const ValueDisplay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const ValueText = styled.span<{ color?: string; large?: boolean }>`
  font-size: ${props => props.large ? '2.5rem' : '2rem'};
  font-weight: ${props => props.theme.fonts.weight.bold};
  color: ${props => props.color || props.theme.colors.text.primary};
`;

const UnitText = styled.span`
  font-size: ${props => props.theme.fonts.size.md};
  color: ${props => props.theme.colors.text.secondary};
  margin-left: ${spacing.xs};
`;

const TargetIndicator = styled.div`
  position: absolute;
  width: 2px;
  height: 10px;
  background-color: ${props => props.theme.colors.text.secondary};
  transform-origin: bottom center;
`;

/**
 * Determines the color for a value based on thresholds
 */
const getColorForValue = (
  value: number, 
  min: number, 
  max: number, 
  thresholds: number[] = [25, 50, 75], 
  colorArray?: string[]
): string => {
  // Normalize the value between 0 and 1
  const normalizedValue = ((value - min) / (max - min));
  
  // Default colors use the semantic colors from the theme
  const defaultColors = [
    colors.semantic.error,
    colors.semantic.warning,
    colors.semantic.info,
    colors.semantic.success
  ];
  
  // Use provided colors or defaults
  const finalColors = colorArray || defaultColors;
  
  // Normalize thresholds to 0-1 range if they're in the 0-100 range
  const normalizedThresholds = thresholds.map(t => 
    t > 1 ? t / 100 : t
  );
  
  if (normalizedValue < normalizedThresholds[0]) return finalColors[0];
  if (normalizedValue < normalizedThresholds[1]) return finalColors[1];
  if (normalizedValue < normalizedThresholds[2]) return finalColors[2];
  return finalColors[3];
};

/**
 * Formats the value for display, adding appropriate suffix or prefix
 */
const formatValue = (
  value: number, 
  format?: string, 
  unit?: string, 
  valueFormatter?: (value: number) => string
): string => {
  if (valueFormatter) {
    return valueFormatter(value);
  }
  
  let formattedValue = Math.round(value).toString();
  
  if (format === 'percentage') {
    formattedValue = `${Math.round(value)}%`;
  } else if (format === 'currency') {
    formattedValue = `$${Math.round(value)}`;
  } else if (unit) {
    formattedValue = `${Math.round(value)}${unit}`;
  }
  
  return formattedValue;
};

/**
 * Prepares data for the gauge chart
 */
const prepareGaugeData = (value: number, min: number, max: number) => {
  // Ensure value is within min and max range
  const clampedValue = Math.min(Math.max(value, min), max);
  // Normalize value to 0-1 range
  const normalizedValue = (clampedValue - min) / (max - min);
  const remainingValue = 1 - normalizedValue;
  
  return [
    { name: 'value', value: normalizedValue },
    { name: 'remainder', value: remainingValue }
  ];
};

/**
 * A customizable gauge chart component that visualizes a single value as a position
 * on a circular or semi-circular gauge
 */
export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  title,
  subtitle,
  height = 300,
  width = '100%',
  startAngle = 180,
  endAngle = 0,
  thresholds = [25, 50, 75],
  colors: colorArray,
  format = 'value',
  unit,
  showValue = true,
  style,
  className,
  animate = true,
  animationDuration = 1000,
  valueFormatter,
  target,
  showTarget = false
}) => {
  // Prepare data for the chart
  const data = prepareGaugeData(value, min, max);
  
  // Get color for the current value
  const valueColor = getColorForValue(
    value,
    min,
    max,
    thresholds,
    colorArray
  );
  
  // Format value for display
  const formattedValue = formatValue(value, format, unit, valueFormatter);
  
  // Calculate target angle if target is provided
  const targetAngle = showTarget && target !== undefined
    ? startAngle - ((target - min) / (max - min) * (startAngle - endAngle))
    : 0;
  
  return (
    <ChartContainer 
      height={height} 
      style={style} 
      className={className}
    >
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      
      <GaugeContainer>
        <ResponsiveContainer width={width} height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={startAngle}
              endAngle={endAngle}
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={0}
              dataKey="value"
              isAnimationActive={animate}
              animationDuration={animationDuration}
            >
              <Cell key="cell-0" fill={valueColor} />
              <Cell key="cell-1" fill={colors.neutral.lightGray} />
              {showValue && (
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <g>
                        <text 
                          x={cx} 
                          y={cy - 20} 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            fill: valueColor
                          }}
                        >
                          {formattedValue}
                        </text>
                        {unit && (
                          <text 
                            x={cx} 
                            y={cy} 
                            textAnchor="middle" 
                            dominantBaseline="central"
                            style={{
                              fontSize: '0.875rem',
                              fill: colors.neutral.mediumGray
                            }}
                          >
                            {unit}
                          </text>
                        )}
                      </g>
                    );
                  }}
                  position="center"
                />
              )}
            </Pie>
            
            {showTarget && target !== undefined && (
              <Label
                content={({ viewBox }) => {
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  const radius = 90; // Matching outerRadius percentage
                  const angle = targetAngle * Math.PI / 180;
                  const x = cx + radius * Math.cos(angle);
                  const y = cy + radius * Math.sin(angle);
                  
                  return (
                    <line
                      x1={x}
                      y1={y}
                      x2={x + 10 * Math.cos(angle)}
                      y2={y + 10 * Math.sin(angle)}
                      stroke={colors.neutral.darkGray}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </GaugeContainer>
    </ChartContainer>
  );
};

export default GaugeChart;