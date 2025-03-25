import React from 'react';
import styled from 'styled-components';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, Label, LabelList } from 'recharts';
import { colors, spacing } from '../../styles/theme';

// Define the data point interface for the pie chart
interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

// Props interface for the PieChart component
interface PieChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
  animate?: boolean;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (value: number) => string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  dataKey?: string;
  nameKey?: string;
  isDonut?: boolean;
}

// Styled components for the chart
const ChartContainer = styled.div<{ height?: number | string }>`
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
  font-size: 20px;
  font-weight: 700;
  color: ${colors.neutral.darkGray};
  margin: 0 0 ${spacing.xs} 0;
`;

const ChartSubtitle = styled.p`
  font-size: 14px;
  color: ${colors.neutral.mediumGray};
  margin: 0;
`;

const ChartContent = styled.div`
  flex: 1;
  width: 100%;
`;

const CustomTooltipWrapper = styled.div`
  background-color: ${colors.neutral.white};
  border: 1px solid ${colors.neutral.lightGray};
  border-radius: 8px;
  padding: ${spacing.sm};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TooltipLabel = styled.p`
  font-weight: 700;
  margin: 0 0 ${spacing.xs} 0;
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
  margin-right: ${spacing.xs};
  background-color: ${props => props.color};
`;

// Custom tooltip component for the pie chart
const CustomTooltip = (props: any) => {
  const { active, payload, valueFormatter } = props;
  
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = data.value;
    const name = data.name;
    const color = data.payload.fill || data.payload.color;
    const formattedValue = valueFormatter ? valueFormatter(value) : value;
    
    return (
      <CustomTooltipWrapper>
        <TooltipLabel>{name}</TooltipLabel>
        <TooltipValue>
          <ColorIndicator color={color} />
          {formattedValue}
        </TooltipValue>
      </CustomTooltipWrapper>
    );
  }
  
  return null;
};

// Custom label renderer for pie slices
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, labelFormatter } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Only render label if the slice is large enough (at least 5%)
  if (percent < 0.05) return null;
  
  const formattedValue = labelFormatter ? labelFormatter(value) : `${(percent * 100).toFixed(0)}%`;
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize={12}
      fontWeight={500}
    >
      {formattedValue}
    </text>
  );
};

/**
 * A customizable pie chart component that visualizes data as proportional slices of a circle
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  width = '100%',
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  colors = [
    colors.chartColors.series1,
    colors.chartColors.series2,
    colors.chartColors.series3,
    colors.chartColors.series4,
    colors.chartColors.series5,
  ],
  style,
  className,
  animate = true,
  valueFormatter,
  labelFormatter,
  innerRadius = 0,
  outerRadius = '80%',
  paddingAngle = 0,
  dataKey = 'value',
  nameKey = 'name',
  isDonut = false,
}) => {
  // Calculate innerRadius for donut chart if isDonut is true
  const calculatedInnerRadius = isDonut ? (typeof outerRadius === 'string' 
    ? parseInt(outerRadius) * 0.6 + '%' 
    : outerRadius * 0.6) 
    : innerRadius;
  
  return (
    <ChartContainer height={height} style={style} className={className}>
      {(title || subtitle) && (
        <ChartHeader>
          {title && <ChartTitle>{title}</ChartTitle>}
          {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
        </ChartHeader>
      )}
      <ChartContent>
        <ResponsiveContainer width={width} height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              innerRadius={calculatedInnerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              fill={colors[0]}
              isAnimationActive={animate}
              labelLine={false}
              label={showLabels ? renderCustomizedLabel : undefined}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]} 
                />
              ))}
            </Pie>
            
            {showLegend && (
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: spacing.md }}
              />
            )}
            
            {showTooltip && (
              <Tooltip 
                content={<CustomTooltip valueFormatter={valueFormatter} />} 
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </ChartContent>
    </ChartContainer>
  );
};

export default PieChart;