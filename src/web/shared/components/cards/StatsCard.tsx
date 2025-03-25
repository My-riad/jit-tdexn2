import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import Heading from '../typography/Heading';
import Text from '../typography/Text';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { theme } from '../../styles/theme';

/**
 * Enum for trend direction types
 */
const TrendDirection = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
};

const DEFAULT_COLOR = 'primary';

/**
 * Props interface for StatsCard component
 */
interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: string;
  higherIsBetter?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Styled components for the StatsCard
 */
const StyledStatsCard = styled.div<{ onClick?: () => void }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: ${({ onClick }) => onClick ? 'pointer' : 'default'};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  ${({ onClick }) => onClick && `
    &:hover {
      transform: scale(1.02);
    }
  `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing.xs};
`;

const IconContainer = styled.div<{ color?: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ color }) => {
    // Use color with transparency
    switch (color) {
      case 'success':
        return 'rgba(52, 168, 83, 0.1)';
      case 'warning':
        return 'rgba(251, 188, 4, 0.1)';
      case 'error':
        return 'rgba(234, 67, 53, 0.1)';
      default:
        return 'rgba(26, 115, 232, 0.1)'; // Default to primary blue
    }
  }};
  margin-right: ${theme.spacing.sm};
  color: ${({ color }) => {
    // Use semantic colors
    switch (color) {
      case 'success':
        return '#34A853';
      case 'warning':
        return '#FBBC04';
      case 'error':
        return '#EA4335';
      default:
        return '#1A73E8'; // Default to primary blue
    }
  }};
`;

const ValueContainer = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: ${theme.spacing.xs};
`;

const TrendContainer = styled.div<{ trendDirection: string }>`
  display: flex;
  align-items: center;
  margin-left: ${theme.spacing.sm};
  color: ${({ trendDirection }) => {
    switch (trendDirection) {
      case TrendDirection.POSITIVE:
        return '#34A853'; // Success green
      case TrendDirection.NEGATIVE:
        return '#EA4335'; // Error red
      default:
        return '#5F6368'; // Text secondary
    }
  }};
`;

const TrendIcon = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing.xxs};
  height: 16px;
  width: 16px;
`;

/**
 * StatsCard component for displaying statistical information with a title, value, and optional trend indicator
 * Used throughout the application to present key metrics and KPIs in a consistent format
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  color = DEFAULT_COLOR,
  higherIsBetter = true,
  onClick,
  className,
  ...rest
}) => {
  // Determine trend direction
  const trendDirection = trend === undefined || trend === 0 
    ? TrendDirection.NEUTRAL 
    : trend > 0 ? TrendDirection.POSITIVE : TrendDirection.NEGATIVE;
  
  // Determine if the trend is good or bad based on the higherIsBetter flag
  const trendColor = trendDirection === TrendDirection.NEUTRAL 
    ? TrendDirection.NEUTRAL 
    : (higherIsBetter && trendDirection === TrendDirection.POSITIVE) || 
      (!higherIsBetter && trendDirection === TrendDirection.NEGATIVE)
        ? TrendDirection.POSITIVE 
        : TrendDirection.NEGATIVE;

  return (
    <Card 
      className={className} 
      onClick={onClick}
      elevation={onClick ? "medium" : "low"}
      {...rest}
    >
      <StyledStatsCard onClick={onClick}>
        <CardHeader>
          {icon && (
            <IconContainer color={color}>
              {icon}
            </IconContainer>
          )}
          <Heading level={6} noMargin>
            {title}
          </Heading>
        </CardHeader>

        <ValueContainer>
          <Text variant="data" noMargin>
            {value}
          </Text>
          
          {trend !== undefined && (
            <TrendContainer trendDirection={trendColor}>
              <TrendIcon>
                {trendDirection === TrendDirection.POSITIVE ? (
                  <ArrowUpIcon />
                ) : trendDirection === TrendDirection.NEGATIVE ? (
                  <ArrowDownIcon />
                ) : null}
              </TrendIcon>
              <Text variant="caption" noMargin>
                {Math.abs(trend)}%
              </Text>
            </TrendContainer>
          )}
        </ValueContainer>

        {(subtitle || trendLabel) && (
          <Text variant="caption" color="secondary" noMargin>
            {subtitle || trendLabel}
          </Text>
        )}
      </StyledStatsCard>
    </Card>
  );
};

export default StatsCard;
export type { StatsCardProps };