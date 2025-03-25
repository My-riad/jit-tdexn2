import React from 'react';
import styled, { useTheme } from 'styled-components';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // version ^4.7.1
import { ThemeType } from '../../styles/theme';
import Text from '../typography/Text';
import ScoreChart from '../charts/ScoreChart';
import ProgressBar from '../feedback/ProgressBar';

/**
 * Props for the ScoreDisplay component
 */
export interface ScoreDisplayProps {
  /** Current efficiency score (0-100) */
  score: number;
  /** Previous efficiency score for comparison */
  previousScore?: number;
  /** Historical score data for trend visualization */
  history?: Array<{score: number, date: string | Date}>;
  /** Size of the score display ('small', 'medium', 'large') */
  size?: 'small' | 'medium' | 'large';
  /** Display variant ('simple', 'detailed', 'compact') */
  variant?: 'simple' | 'detailed' | 'compact';
  /** Whether to show score change indicator */
  showChange?: boolean;
  /** Whether to show historical chart */
  showChart?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// Helper function to get padding based on size prop
const getSizePadding = (size: string, theme: ThemeType) => {
  switch (size) {
    case 'small':
      return theme.spacing.sm;
    case 'large':
      return theme.spacing.lg;
    case 'medium':
    default:
      return theme.spacing.md;
  }
};

// Helper function to get font size based on size prop
const getScoreFontSize = (size: string, theme: ThemeType) => {
  switch (size) {
    case 'small':
      return theme.fonts.size.lg;
    case 'large':
      return theme.fonts.size.xxl;
    case 'medium':
    default:
      return theme.fonts.size.xl;
  }
};

// Helper function to get chart height based on size prop
const getChartHeight = (size: string) => {
  switch (size) {
    case 'small':
      return '100px';
    case 'large':
      return '200px';
    case 'medium':
    default:
      return '150px';
  }
};

// Threshold values for score color determination
const scoreThresholds = [
  { value: 40, color: 'semantic.error' },
  { value: 60, color: 'semantic.warning' },
  { value: 80, color: 'semantic.info' },
  { value: 100, color: 'semantic.success' }
];

/**
 * Determines the color for a score based on thresholds
 */
const getScoreColor = (score: number, theme: ThemeType): string => {
  if (score < 40) return theme.colors.semantic.error;
  if (score < 60) return theme.colors.semantic.warning;
  if (score < 80) return theme.colors.semantic.info;
  return theme.colors.semantic.success;
};

/**
 * Formats the score change with a plus or minus sign
 */
const formatScoreChange = (currentScore: number, previousScore: number): string => {
  const difference = currentScore - previousScore;
  return difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1);
};

// Styled components
const ScoreContainer = styled.div<{ size?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => getSizePadding(props.size || 'medium', props.theme)};
  border-radius: ${props => props.theme.borders.radius.md};
  background-color: ${props => props.theme.colors.background.secondary};
  box-shadow: ${props => props.theme.elevation.low};
  width: 100%;
`;

const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreValue = styled.div<{ size?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreNumber = styled.div<{ color: string, size?: string }>`
  font-size: ${props => getScoreFontSize(props.size || 'medium', props.theme)};
  font-weight: ${props => props.theme.fonts.weight.bold};
  color: ${props => props.color};
  line-height: 1;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ScoreChange = styled.div<{ isPositive: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${props => props.isPositive ? props.theme.colors.semantic.success : props.theme.colors.semantic.error};
  margin-left: ${props => props.theme.spacing.xs};
`;

const ScoreLabel = styled.div`
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

const ScoreProgressContainer = styled.div`
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreChartContainer = styled.div<{ size?: string }>`
  width: 100%;
  height: ${props => getChartHeight(props.size || 'medium')};
  margin-top: ${props => props.theme.spacing.md};
`;

/**
 * ScoreDisplay Component
 * 
 * A reusable component that displays a driver's efficiency score with 
 * visual indicators, optional historical trends, and score change information.
 */
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  previousScore,
  history,
  size = 'medium',
  variant = 'simple',
  showChange = true,
  showChart = false,
  className,
  style
}) => {
  const theme = useTheme();
  
  // Get color based on score
  const scoreColor = getScoreColor(score, theme);
  
  // Calculate score change if previous score is provided
  const scoreChangeValue = previousScore !== undefined ? formatScoreChange(score, previousScore) : null;
  const isPositive = previousScore !== undefined ? score > previousScore : false;
  
  // Convert threshold objects to format expected by ProgressBar
  const progressThresholds = scoreThresholds.map(threshold => ({
    value: threshold.value,
    color: theme.colors.semantic[threshold.color.split('.')[1]]
  }));

  // Determine appropriate progress bar size
  const progressSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';

  if (variant === 'compact') {
    return (
      <ScoreContainer 
        size={size} 
        className={className} 
        style={style}
        aria-label={`Efficiency score: ${Math.round(score)} out of 100${scoreChangeValue ? `. Change: ${scoreChangeValue}` : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginRight: theme.spacing.md }}>
            <ScoreNumber color={scoreColor} size={size}>
              {Math.round(score)}
            </ScoreNumber>
            {showChange && scoreChangeValue && (
              <ScoreChange isPositive={isPositive}>
                {isPositive ? (
                  <FaArrowUp aria-label="Increased" style={{ marginRight: '2px' }} />
                ) : (
                  <FaArrowDown aria-label="Decreased" style={{ marginRight: '2px' }} />
                )}
                {scoreChangeValue}
              </ScoreChange>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <ProgressBar 
              value={score} 
              max={100} 
              size={progressSize}
              variant="determinate"
              thresholds={progressThresholds}
            />
          </div>
        </div>
      </ScoreContainer>
    );
  }

  if (variant === 'detailed') {
    return (
      <ScoreContainer 
        size={size} 
        className={className} 
        style={style}
        aria-label={`Efficiency score details: ${Math.round(score)} out of 100${scoreChangeValue ? `. Change: ${scoreChangeValue}` : ''}`}
      >
        <ScoreHeader>
          <Text variant="label" noMargin>Efficiency Score</Text>
          {previousScore !== undefined && (
            <Text variant="caption" color="secondary" noMargin>
              {isPositive ? 'Improving' : 'Declining'}
            </Text>
          )}
        </ScoreHeader>
        
        <ScoreValue size={size}>
          <ScoreNumber color={scoreColor} size={size}>
            {Math.round(score)}
          </ScoreNumber>
          
          {showChange && scoreChangeValue && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ScoreChange isPositive={isPositive}>
                {isPositive ? (
                  <FaArrowUp aria-label="Increased" style={{ marginRight: '2px' }} />
                ) : (
                  <FaArrowDown aria-label="Decreased" style={{ marginRight: '2px' }} />
                )}
                {scoreChangeValue}
              </ScoreChange>
              <Text variant="caption" noMargin style={{ marginLeft: theme.spacing.xs }}>
                since last update
              </Text>
            </div>
          )}
        </ScoreValue>
        
        <ScoreProgressContainer>
          <ProgressBar 
            value={score} 
            max={100} 
            size={progressSize}
            variant="determinate"
            thresholds={progressThresholds}
            showLabel={true}
          />
        </ScoreProgressContainer>
        
        {showChart && history && history.length > 0 && (
          <ScoreChartContainer size={size}>
            <ScoreChart 
              score={score}
              previousScore={previousScore}
              history={history}
              chartType="area"
              height={parseInt(getChartHeight(size))}
              showTarget={true}
              title="Historical Performance"
            />
          </ScoreChartContainer>
        )}
        
        <div style={{ marginTop: theme.spacing.sm, width: '100%' }}>
          <Text variant="caption" color="secondary">
            Driver's efficiency score is calculated based on empty miles reduction, 
            network contribution, on-time performance, and Smart Hub utilization.
          </Text>
        </div>
      </ScoreContainer>
    );
  }

  // Simple variant (default)
  return (
    <ScoreContainer 
      size={size} 
      className={className} 
      style={style}
      aria-label={`Efficiency score: ${Math.round(score)} out of 100${scoreChangeValue ? `. Change: ${scoreChangeValue}` : ''}`}
    >
      <ScoreHeader>
        <ScoreLabel>Efficiency Score</ScoreLabel>
      </ScoreHeader>
      
      <ScoreValue size={size}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ScoreNumber color={scoreColor} size={size}>
            {Math.round(score)}
          </ScoreNumber>
          {showChange && scoreChangeValue && (
            <ScoreChange isPositive={isPositive}>
              {isPositive ? (
                <FaArrowUp aria-label="Increased" style={{ marginRight: '2px' }} />
              ) : (
                <FaArrowDown aria-label="Decreased" style={{ marginRight: '2px' }} />
              )}
              {scoreChangeValue}
            </ScoreChange>
          )}
        </div>
      </ScoreValue>
      
      <ScoreProgressContainer>
        <ProgressBar 
          value={score} 
          max={100} 
          size={progressSize}
          variant="determinate"
          thresholds={progressThresholds}
        />
      </ScoreProgressContainer>
      
      {showChart && history && history.length > 0 && (
        <ScoreChartContainer size={size}>
          <ScoreChart 
            score={score}
            previousScore={previousScore}
            history={history}
            chartType="line"
            height={parseInt(getChartHeight(size))}
            showTarget={false}
          />
        </ScoreChartContainer>
      )}
    </ScoreContainer>
  );
};

// Default props
ScoreDisplay.defaultProps = {
  size: 'medium',
  variant: 'simple',
  showChange: true,
  showChart: false
};

export default ScoreDisplay;