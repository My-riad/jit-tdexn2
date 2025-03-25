import React, { useState } from 'react';
import styled from 'styled-components';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { mapColors, neutral } from '../../styles/colors';
import { spacing, borders } from '../../styles/theme';

interface LegendItem {
  label: string;
  color: string;
}

interface MapLegendProps {
  items: Array<{ label: string; color: string; }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  expanded?: boolean;
  onToggle?: () => void;
  title?: string;
  className?: string;
}

const LegendContainer = styled.div<{ position: string }>`
  position: absolute;
  z-index: 1;
  background-color: ${neutral.white};
  border-radius: ${borders.radius.md};
  box-shadow: 0 2px 4px ${neutral.dark20};
  margin: ${spacing.sm};
  max-width: 200px;
  overflow: hidden;
  top: ${props => props.position.includes('top') ? '0' : 'auto'};
  bottom: ${props => props.position.includes('bottom') ? '0' : 'auto'};
  left: ${props => props.position.includes('left') ? '0' : 'auto'};
  right: ${props => props.position.includes('right') ? '0' : 'auto'};
`;

const LegendHeader = styled.div<{ expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${neutral.gray100};
  border-bottom: ${props => props.expanded ? `1px solid ${neutral.lightGray}` : 'none'};
`;

const LegendTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${neutral.darkGray};
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacing.xxs};
  color: ${neutral.darkGray};
  font-size: 12px;
  &:hover { color: ${neutral.black}; }
  &:focus { outline: none; }
`;

const LegendContent = styled.div`
  padding: ${spacing.xs} ${spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const LegendItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
`;

const ColorIndicator = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.color};
  border-radius: ${borders.radius.xs};
  border: 1px solid ${neutral.lightGray};
`;

const ItemLabel = styled.span`
  font-size: 12px;
  color: ${neutral.darkGray};
`;

const MapLegend: React.FC<MapLegendProps> = ({
  items,
  position = 'bottom-left',
  expanded = true,
  onToggle,
  title = 'Legend',
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Determine if the component is controlled externally
  const isControlled = onToggle !== undefined;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <LegendContainer position={position} className={className}>
      <LegendHeader expanded={isControlled ? expanded : isExpanded}>
        <LegendTitle>{title}</LegendTitle>
        <ToggleButton 
          onClick={handleToggle}
          aria-label={(isControlled ? expanded : isExpanded) ? 'Collapse legend' : 'Expand legend'}
          aria-expanded={(isControlled ? expanded : isExpanded)}
        >
          {(isControlled ? expanded : isExpanded) ? <FaChevronUp /> : <FaChevronDown />}
        </ToggleButton>
      </LegendHeader>
      
      {(isControlled ? expanded : isExpanded) && (
        <LegendContent>
          {items.map((item, index) => (
            <LegendItemContainer key={index}>
              <ColorIndicator color={item.color} />
              <ItemLabel>{item.label}</ItemLabel>
            </LegendItemContainer>
          ))}
        </LegendContent>
      )}
    </LegendContainer>
  );
};

export default MapLegend;