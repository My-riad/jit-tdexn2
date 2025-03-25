import React from 'react';
import styled, { useTheme, css } from 'styled-components';
import { rotate, pulse, transitionDurations } from '../../styles/animations';
import { colors } from '../../styles/colors';
import { useLoadingContext } from '../../../common/contexts/LoadingContext';
import { getResponsiveValue } from '../../../common/utils/responsive';

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  /** The visual style of the loading indicator (spinner, pulse, dots) */
  variant?: 'spinner' | 'pulse' | 'dots';
  /** The size of the loading indicator (sm, md, lg) */
  size?: 'sm' | 'md' | 'lg';
  /** The color of the loading indicator */
  color?: string;
  /** Optional text to display alongside the loading indicator */
  label?: string;
  /** Whether to display the indicator as a full-page overlay */
  fullPage?: boolean;
  /** Whether the loading indicator should be visible */
  isLoading?: boolean;
  /** Additional CSS class for styling */
  className?: string;
}

/**
 * Container for the loading indicator with positioning and layout
 */
const LoadingContainer = styled.div<{ fullPage?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  transition: opacity ${transitionDurations.normal} ease-in-out;
  
  ${({ fullPage }) =>
    fullPage &&
    css`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${colors.transparency.light70};
      z-index: 1000;
      padding: 0;
    `}
`;

/**
 * Container for the spinner variant
 */
const SpinnerContainer = styled.div<{ size: string; color: string }>`
  border: 2px solid ${colors.neutral.lightGray};
  border-top: 2px solid ${({ color }) => color};
  border-radius: 50%;
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  animation: ${rotate} 1s linear infinite;
`;

/**
 * Container for the pulse variant
 */
const PulseContainer = styled.div<{ size: string; color: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: ${({ color }) => color};
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

/**
 * Container for the dots variant
 */
const DotsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

/**
 * Individual dot for the dots variant
 */
const Dot = styled.div<{ size: string; color: string; delay: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background-color: ${({ color }) => color};
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay};
`;

/**
 * Text label for the loading indicator
 */
const LoadingLabel = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: ${colors.neutral.mediumGray};
  font-weight: 500;
`;

/**
 * A component that displays a loading indicator with various customization options
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  variant = 'spinner',
  size = 'md',
  color,
  label = 'Loading...',
  fullPage = false,
  isLoading = true,
  className,
}) => {
  const theme = useTheme();
  const { loading: contextLoading, loadingMessage } = useLoadingContext();
  
  // Determine if loading should be shown based on props and context
  const showLoading = isLoading || contextLoading;
  
  // If not loading, don't render anything
  if (!showLoading) return null;
  
  // Use label from props if provided, otherwise use from context
  const displayLabel = label || loadingMessage || 'Loading...';
  
  // Get the color to use, with fallback to theme color
  const displayColor = color || colors.primary.blue;
  
  // Define size mappings for different device types and indicator variants
  const sizeMappings = {
    sm: {
      mobile: { spinner: '20px', pulse: '14px', dot: '6px' },
      tablet: { spinner: '24px', pulse: '16px', dot: '8px' },
      desktop: { spinner: '24px', pulse: '16px', dot: '8px' },
    },
    md: {
      mobile: { spinner: '28px', pulse: '20px', dot: '8px' },
      tablet: { spinner: '32px', pulse: '24px', dot: '10px' },
      desktop: { spinner: '36px', pulse: '28px', dot: '10px' },
    },
    lg: {
      mobile: { spinner: '36px', pulse: '28px', dot: '10px' },
      tablet: { spinner: '48px', pulse: '32px', dot: '12px' },
      desktop: { spinner: '56px', pulse: '40px', dot: '14px' },
    },
  };
  
  // Get responsive size based on current device
  const sizeValue = getResponsiveValue(
    sizeMappings[size as keyof typeof sizeMappings],
    typeof window !== 'undefined' ? window.innerWidth : 992
  );
  
  // Render the appropriate variant
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerContainer size={sizeValue.spinner} color={displayColor} />;
      case 'pulse':
        return <PulseContainer size={sizeValue.pulse} color={displayColor} />;
      case 'dots':
        return (
          <DotsContainer>
            <Dot size={sizeValue.dot} color={displayColor} delay="0s" />
            <Dot size={sizeValue.dot} color={displayColor} delay="0.2s" />
            <Dot size={sizeValue.dot} color={displayColor} delay="0.4s" />
          </DotsContainer>
        );
      default:
        return <SpinnerContainer size={sizeValue.spinner} color={displayColor} />;
    }
  };
  
  return (
    <LoadingContainer 
      fullPage={fullPage} 
      className={className} 
      role="status" 
      aria-live="polite"
      aria-busy="true"
    >
      {renderLoadingIndicator()}
      {displayLabel && <LoadingLabel>{displayLabel}</LoadingLabel>}
      <span className="sr-only">{displayLabel}</span>
    </LoadingContainer>
  );
};

export default LoadingIndicator;