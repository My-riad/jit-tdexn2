import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/colors';
import { theme } from '../styles/theme';
import { GaugeChart } from '../../shared/components/charts/GaugeChart';
import { ProgressBar } from '../../shared/components/feedback/ProgressBar';
import { formatEfficiencyScore } from '../../common/utils/formatters';
import { DriverScore } from '../../common/interfaces/gamification.interface';

/**
 * Score thresholds for determining color and category
 */
const SCORE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 75,
  LOW: 60
};

/**
 * Size configurations for different component sizes
 */
const SIZE_MAP = {
  small: {
    gaugeSize: 120,
    fontSize: '24px',
    labelSize: '12px'
  },
  medium: {
    gaugeSize: 160,
    fontSize: '36px',
    labelSize: '14px'
  },
  large: {
    gaugeSize: 200,
    fontSize: '48px',
    labelSize: '16px'
  }
};

/**
 * Props for the EfficiencyScore component
 */
interface EfficiencyScoreProps {
  /** Current efficiency score value (0-100) */
  score: number;
  /** Previous efficiency score for comparison */
  previousScore?: number;
  /** Visualization style ('gauge' or 'progress') */
  variant?: 'gauge' | 'progress';
  /** Size of the component ('small', 'medium', 'large') */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the change from previous score */
  showChange?: boolean;
  /** Whether to show a label with the score */
  showLabel?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Container for the efficiency score component
 */
const ScoreContainer = styled.div<{ size: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: ${props => props.size === 'small' ? '8px' : props.size === 'large' ? '16px' : '12px'};
`;

/**
 * Display for the numeric score value
 */
const ScoreValue = styled.div<{ size: string; color: string }>`
  font-size: ${props => props.size === 'small' ? '24px' : props.size === 'large' ? '48px' : '36px'};
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 4px;
`;

/**
 * Label for the efficiency score
 */
const ScoreLabel = styled.div<{ size: string }>`
  font-size: ${props => props.size === 'small' ? '12px' : props.size === 'large' ? '16px' : '14px'};
  color: ${props => props.theme.colors.neutral.gray600};
  margin-bottom: 8px;
`;

/**
 * Display for the score change value
 */
const ScoreChange = styled.div<{ isPositive: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.isPositive ? props.theme.colors.semantic.success : props.theme.colors.semantic.error};
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

/**
 * Container for the gauge chart visualization
 */
const GaugeContainer = styled.div<{ size: string }>`
  width: ${props => props.size === 'small' ? '120px' : props.size === 'large' ? '200px' : '160px'};
  height: ${props => props.size === 'small' ? '120px' : props.size === 'large' ? '200px' : '160px'};
  position: relative;
`;

/**
 * Container for the progress bar visualization
 */
const ProgressContainer = styled.div`
  width: 100%;
  margin: 8px 0;
`;

/**
 * Determines the appropriate color for a score based on its value
 */
const getScoreColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.HIGH) return colors.semantic.success;
  if (score >= SCORE_THRESHOLDS.MEDIUM) return colors.semantic.info;
  if (score >= SCORE_THRESHOLDS.LOW) return colors.semantic.warning;
  return colors.semantic.error;
};

/**
 * Component that displays a driver's efficiency score
 */
export const EfficiencyScore: React.FC<EfficiencyScoreProps> = ({
  score,
  previousScore,
  variant = 'progress',
  size = 'medium',
  showChange = true,
  showLabel = true,
  className,
  style
}) => {
  // Calculate score change if previous score is provided
  const scoreChange = previousScore !== undefined ? score - previousScore : 0;
  const isPositive = scoreChange >= 0;
  
  // Get color based on score value
  const color = getScoreColor(score);
  
  // Format score for display
  const formattedScore = formatEfficiencyScore(score);
  
  return (
    <ScoreContainer size={size} className={className} style={style}>
      {showLabel && <ScoreLabel size={size}>EFFICIENCY SCORE</ScoreLabel>}
      
      {variant === 'gauge' ? (
        // Gauge chart visualization
        <GaugeContainer size={size}>
          <GaugeChart
            value={score}
            min={0}
            max={100}
            colors={[color]}
            height={SIZE_MAP[size].gaugeSize}
            width={SIZE_MAP[size].gaugeSize}
            showValue={false}
            animate={true}
          />
          <ScoreValue 
            size={size} 
            color={color}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {formattedScore}
          </ScoreValue>
        </GaugeContainer>
      ) : (
        // Progress bar visualization
        <ProgressContainer>
          <ScoreValue size={size} color={color}>
            {formattedScore}
          </ScoreValue>
          <ProgressBar
            value={score}
            max={100}
            color={color}
            size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
            showLabel={false}
          />
        </ProgressContainer>
      )}
      
      {/* Show score change if enabled and previous score is available */}
      {showChange && previousScore !== undefined && (
        <ScoreChange isPositive={isPositive}>
          {isPositive ? '+' : ''}{Math.abs(scoreChange)} this week
        </ScoreChange>
      )}
    </ScoreContainer>
  );
};

export default EfficiencyScore;