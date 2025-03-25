import React from 'react';
import styled, { useTheme } from 'styled-components';
import { ThemeType } from '../../styles/theme';
import Text from '../typography/Text';

/**
 * Configuration for color thresholds based on progress value
 */
export interface ThresholdConfig {
  /** Threshold value (0-100) */
  value: number;
  /** Color to apply when progress is at or above this threshold */
  color: string;
}

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps {
  /** Current progress value */
  value: number;
  /** Maximum progress value */
  max?: number;
  /** Size of the progress bar ('small', 'medium', 'large') */
  size?: 'small' | 'medium' | 'large';
  /** Color of the progress bar fill */
  color?: string;
  /** Variant of the progress bar ('determinate', 'indeterminate') */
  variant?: 'determinate' | 'indeterminate';
  /** Whether to show a label with the progress percentage */
  showLabel?: boolean;
  /** Custom label text (if not provided, percentage will be shown) */
  label?: string;
  /** Array of threshold configurations for color changes based on value */
  thresholds?: ThresholdConfig[];
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// Internal interfaces for styled components
interface ProgressBarContainerProps {
  size: string;
}

interface ProgressBarFillProps {
  width: string;
  color: string;
  variant: string;
}

// Helper function to determine the height based on size
const getHeightBySize = (size: string, theme: ThemeType): string => {
  switch (size) {
    case 'small':
      return '8px';
    case 'large':
      return '16px';
    case 'medium':
    default:
      return '12px';
  }
};

// Helper function to determine the color based on thresholds
const getColorFromThresholds = (
  percentage: number,
  thresholds: ThresholdConfig[] | undefined,
  theme: ThemeType
): string => {
  if (!thresholds || thresholds.length === 0) {
    return theme.colors.primary.blue;
  }

  // Sort thresholds in ascending order
  const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);
  
  // Find the threshold that applies
  for (let i = sortedThresholds.length - 1; i >= 0; i--) {
    if (percentage >= sortedThresholds[i].value) {
      return sortedThresholds[i].color;
    }
  }
  
  // If no threshold applies, return the default color
  return theme.colors.primary.blue;
};

// Keyframes for indeterminate animation
const indeterminateAnimation = `
  @keyframes indeterminateAnimation {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
`;

// Styled components
const ProgressBarContainer = styled.div<ProgressBarContainerProps>`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
`;

const ProgressBarTrack = styled.div<ProgressBarContainerProps>`
  width: 100%;
  height: ${props => getHeightBySize(props.size, props.theme)};
  background-color: ${props => props.theme.colors.neutral.gray200};
  border-radius: ${props => props.theme.borders.radius.md};
  overflow: hidden;
`;

const ProgressBarFill = styled.div<ProgressBarFillProps>`
  width: ${props => props.width};
  height: 100%;
  background-color: ${props => props.color};
  border-radius: ${props => props.theme.borders.radius.md};
  transition: width 0.3s ease;
  animation: ${props => props.variant === 'indeterminate' ? 'indeterminateAnimation 1.5s infinite linear' : 'none'};
  
  ${indeterminateAnimation}
`;

const ProgressBarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${props => props.theme.colors.neutral.mediumGray};
`;

// Constants
const DEFAULT_COLOR = 'primary.blue';
const DEFAULT_MAX = 100;

/**
 * ProgressBar Component
 * 
 * A customizable progress bar that visualizes completion or progress status.
 * Supports different sizes, colors, and variants with optional labels and
 * threshold-based color changes.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = DEFAULT_MAX,
  size = 'medium',
  color = DEFAULT_COLOR,
  variant = 'determinate',
  showLabel = false,
  label,
  thresholds,
  className,
  style,
  ...rest
}) => {
  const theme = useTheme();
  
  // Ensure valid value within range
  const validValue = Math.min(Math.max(0, value), max);
  
  // Calculate percentage
  const percentage = (validValue / max) * 100;
  
  // Determine color based on thresholds or default
  let progressColor;

  // If thresholds are provided, determine color based on them
  if (thresholds && thresholds.length > 0) {
    progressColor = getColorFromThresholds(percentage, thresholds, theme);
  } else {
    // Handle theme color values (e.g., 'primary.blue')
    if (color.includes('.')) {
      const [category, colorName] = color.split('.');
      progressColor = theme.colors[category]?.[colorName];
    } else {
      // Direct color value or theme color reference
      progressColor = theme.colors[color] || color;
    }
  }
  
  return (
    <ProgressBarContainer 
      size={size} 
      className={className} 
      style={style}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={variant === 'determinate' ? validValue : undefined}
      {...rest}
    >
      <ProgressBarTrack size={size}>
        <ProgressBarFill 
          width={variant === 'determinate' ? `${percentage}%` : '25%'} 
          color={progressColor}
          variant={variant}
        />
      </ProgressBarTrack>
      
      {showLabel && (
        <ProgressBarLabel>
          {label ? (
            <Text variant="caption" noMargin>{label}</Text>
          ) : (
            <Text variant="caption" noMargin>{`${Math.round(percentage)}%`}</Text>
          )}
        </ProgressBarLabel>
      )}
    </ProgressBarContainer>
  );
};

export default ProgressBar;