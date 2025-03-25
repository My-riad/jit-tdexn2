import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useThemeContext } from '../../../common/contexts/ThemeContext';

// Size configurations for tooltips
const TOOLTIP_SIZES = {
  small: {
    padding: 'xs',
    fontSize: 'xs',
    maxWidth: '150px'
  },
  medium: {
    padding: 'sm',
    fontSize: 'sm',
    maxWidth: '250px'
  },
  large: {
    padding: 'md',
    fontSize: 'md',
    maxWidth: '350px'
  }
};

// Offset distance between tooltip and target element
const TOOLTIP_OFFSET = 8;

// Props for the Tooltip component
export interface TooltipProps {
  /**
   * Content to display in the tooltip
   */
  content: string | React.ReactNode;
  
  /**
   * Position of the tooltip relative to the target element
   * @default 'top'
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Size of the tooltip
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * The element that triggers the tooltip
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS class for the tooltip container
   */
  className?: string;
}

// Props for the styled tooltip container
interface TooltipContainerProps {
  className?: string;
}

// Props for the styled tooltip content
interface TooltipContentProps {
  position: 'top' | 'right' | 'bottom' | 'left';
  size: 'small' | 'medium' | 'large';
  visible: boolean;
  positionStyles: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    transform?: string;
  };
}

// Styled component for the tooltip container
const TooltipContainer = styled.div<TooltipContainerProps>`
  position: relative;
  display: inline-block;
  width: fit-content;
`;

// Styled component for the tooltip content
const TooltipContent = styled.div<TooltipContentProps>`
  position: absolute;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  padding: ${({ theme, size }) => theme.spacing[TOOLTIP_SIZES[size].padding]};
  font-size: ${({ theme, size }) => theme.fonts.size[TOOLTIP_SIZES[size].fontSize]};
  box-shadow: ${({ theme }) => theme.elevation.medium};
  z-index: ${({ theme }) => theme.zIndex.tooltip};
  max-width: ${({ size }) => TOOLTIP_SIZES[size].maxWidth};
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  pointer-events: none; /* Prevents tooltip from interfering with mouse events */
  
  /* Position styles */
  ${({ positionStyles }) => positionStyles && Object.entries(positionStyles).map(([key, value]) => `${key}: ${value};`).join('')}
  
  /* Visibility control */
  ${({ visible }) => visible && `
    opacity: 1;
    visibility: visible;
  `}
  
  /* Arrow styling */
  &::before {
    content: '';
    position: absolute;
    border-style: solid;
    border-width: 5px;
    
    ${({ position, theme }) => {
      const borderColor = theme.colors.background.secondary;
      
      switch (position) {
        case 'top':
          return `
            border-color: ${borderColor} transparent transparent transparent;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
          `;
        case 'right':
          return `
            border-color: transparent ${borderColor} transparent transparent;
            left: -10px;
            top: 50%;
            transform: translateY(-50%);
          `;
        case 'bottom':
          return `
            border-color: transparent transparent ${borderColor} transparent;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
          `;
        case 'left':
          return `
            border-color: transparent transparent transparent ${borderColor};
            right: -10px;
            top: 50%;
            transform: translateY(-50%);
          `;
        default:
          return '';
      }
    }}
  }
`;

/**
 * A reusable tooltip component that displays contextual information on hover or focus
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  size = 'medium',
  disabled = false,
  children,
  className,
  ...rest
}) => {
  // State to track tooltip visibility
  const [visible, setVisible] = useState(false);
  
  // Refs for the container and tooltip elements
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Access theme from context
  const { theme } = useThemeContext();
  
  // Generate unique ID for tooltip content
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Position styles for the tooltip
  const [positionStyles, setPositionStyles] = useState<{
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    transform?: string;
  }>({});
  
  // Calculate tooltip position when visibility changes
  useEffect(() => {
    if (visible && containerRef.current) {
      let newStyles = {};
      
      switch (position) {
        case 'top':
          newStyles = {
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: `${TOOLTIP_OFFSET}px`,
          };
          break;
        case 'right':
          newStyles = {
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: `${TOOLTIP_OFFSET}px`,
          };
          break;
        case 'bottom':
          newStyles = {
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: `${TOOLTIP_OFFSET}px`,
          };
          break;
        case 'left':
          newStyles = {
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: `${TOOLTIP_OFFSET}px`,
          };
          break;
      }
      
      setPositionStyles(newStyles);
    }
  }, [visible, position]);
  
  // Event handlers for showing/hiding the tooltip
  const handleMouseEnter = () => {
    if (!disabled) {
      setVisible(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (!disabled) {
      setVisible(false);
    }
  };
  
  const handleFocus = () => {
    if (!disabled) {
      setVisible(true);
    }
  };
  
  const handleBlur = () => {
    if (!disabled) {
      setVisible(false);
    }
  };
  
  // If tooltip is disabled, just render children
  if (disabled) {
    return <>{children}</>;
  }
  
  // Enhance children with aria-describedby if possible
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        'aria-describedby': tooltipId,
      });
    }
    return child;
  });
  
  return (
    <TooltipContainer
      ref={containerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      {enhancedChildren}
      <TooltipContent
        ref={tooltipRef}
        id={tooltipId}
        position={position}
        size={size}
        visible={visible}
        positionStyles={positionStyles}
        role="tooltip"
      >
        {content}
      </TooltipContent>
    </TooltipContainer>
  );
};

export default Tooltip;