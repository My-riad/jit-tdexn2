import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { pulse } from '../../styles/animations';
import { getResponsiveValue } from '../../../common/utils/responsive';

export interface SkeletonProps {
  /** The visual style of the skeleton (text, rectangle, circle) */
  variant?: 'text' | 'rectangle' | 'circle';
  /** Width of the skeleton element (can be px, %, em, rem or number for px) */
  width?: string | number | Record<string, string | number>;
  /** Height of the skeleton element (can be px, %, em, rem or number for px) */
  height?: string | number | Record<string, string | number>;
  /** Border radius of the skeleton element */
  borderRadius?: string;
  /** Number of skeleton items to render */
  count?: number;
  /** Gap between multiple skeleton items */
  gap?: string;
  /** Additional CSS class for styling */
  className?: string;
}

const SkeletonContainer = styled.div<{ gap: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap};
  width: fit-content;
`;

const SkeletonItem = styled.div<{
  width: string;
  height: string;
  borderRadius: string;
}>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  border-radius: ${({ borderRadius }) => borderRadius};
  background: ${({ theme }) => {
    // Use skeleton colors if available, otherwise fall back to sensible defaults
    const baseColor = theme.colors?.skeleton?.base || 
                     theme.colors?.background?.secondary || 
                     theme.colors?.gray?.light ||
                     '#e0e0e0';
    const highlightColor = theme.colors?.skeleton?.highlight || 
                           theme.colors?.background?.tertiary || 
                           theme.colors?.gray?.lighter ||
                           '#f0f0f0';
    
    return `linear-gradient(
      110deg,
      ${baseColor} 30%,
      ${highlightColor} 50%,
      ${baseColor} 70%
    )`;
  }};
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  opacity: 0.7;
`;

/**
 * A component that displays a skeleton loading placeholder with various customization options.
 * 
 * @example
 * // Basic usage
 * <Skeleton />
 * 
 * @example
 * // Custom dimensions and multiple items
 * <Skeleton width={200} height={20} count={3} gap="16px" />
 * 
 * @example
 * // Circle variant for avatar placeholders
 * <Skeleton variant="circle" width={48} height={48} />
 * 
 * @example
 * // Responsive dimensions
 * <Skeleton width={{ mobile: '100%', tablet: '300px', desktop: '500px' }} height={20} />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangle',
  width = '100%',
  height = '16px',
  borderRadius,
  count = 1,
  gap,
  className,
}) => {
  const theme = useTheme();
  
  // Use a window width state with a safe default for SSR
  const [windowWidth, setWindowWidth] = useState(576); // Default to mobile size
  
  // Update window width on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  // Set default gap from theme if not provided
  const gapValue = gap || theme.spacing?.sm || '8px';
  
  // Handle responsive dimensions
  let widthValue: string;
  let heightValue: string;
  
  if (typeof width === 'object') {
    // For responsive width
    const responsiveWidth = getResponsiveValue(width, windowWidth);
    widthValue = typeof responsiveWidth === 'number' ? `${responsiveWidth}px` : String(responsiveWidth || '100%');
  } else {
    // For static width
    widthValue = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (typeof height === 'object') {
    // For responsive height
    const responsiveHeight = getResponsiveValue(height, windowWidth);
    heightValue = typeof responsiveHeight === 'number' ? `${responsiveHeight}px` : String(responsiveHeight || '16px');
  } else {
    // For static height
    heightValue = typeof height === 'number' ? `${height}px` : height;
  }
  
  // Determine border radius based on variant and props
  let radiusValue = borderRadius;
  if (!radiusValue) {
    if (variant === 'circle') {
      radiusValue = '50%';
    } else if (variant === 'text') {
      radiusValue = theme.borders?.radius?.sm || '4px';
    } else {
      radiusValue = theme.borders?.radius?.sm || '4px';
    }
  }

  // Create an array for rendering multiple skeleton items
  const items = Array.from({ length: count }, (_, index) => (
    <SkeletonItem
      key={index}
      width={widthValue}
      height={heightValue}
      borderRadius={radiusValue}
      aria-hidden="true"
    />
  ));

  return (
    <SkeletonContainer 
      gap={gapValue} 
      className={className} 
      aria-label="Loading content"
      data-testid="skeleton-loader"
    >
      {items}
    </SkeletonContainer>
  );
};

// Named export for better tree-shaking
export { Skeleton };

// Default export for backward compatibility
export default Skeleton;