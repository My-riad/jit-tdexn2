import React, { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { lightTheme, darkTheme, ThemeType } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import { transition, focusOutline } from '../../styles/mixins';

// Constants
const DEFAULT_VARIANT = 'default';
const DEFAULT_ORIENTATION = 'horizontal';

// Interfaces
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[];
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'contained' | 'text' | 'pills';
  orientation?: 'horizontal' | 'vertical';
}

// Helper functions for styling
const getTabBackgroundColor = (props: any) => {
  const { isActive, variant, theme } = props;
  
  if (isActive) {
    switch (variant) {
      case 'contained':
        return theme.colors.background.accent;
      case 'pills':
        return theme.colors.button.primary.background;
      case 'text':
        return 'transparent';
      default:
        return 'transparent';
    }
  }
  
  switch (variant) {
    case 'contained':
      return theme.colors.background.secondary;
    case 'pills':
      return 'transparent';
    default:
      return 'transparent';
  }
};

const getTabTextColor = (props: any) => {
  const { isActive, variant, theme } = props;
  
  if (isActive) {
    switch (variant) {
      case 'pills':
        return theme.colors.button.primary.text;
      default:
        return theme.colors.text.accent;
    }
  }
  
  return theme.colors.text.primary;
};

const getTabBorderBottom = (props: any) => {
  const { isActive, variant, orientation, theme } = props;
  
  if (orientation !== 'horizontal' || variant === 'pills') {
    return 'none';
  }
  
  if (isActive) {
    return variant === 'contained'
      ? 'none'
      : `2px solid ${theme.colors.text.accent}`;
  }
  
  return variant === 'contained' ? `1px solid ${theme.colors.border.light}` : 'none';
};

const getTabBorderRight = (props: any) => {
  const { isActive, variant, orientation, theme } = props;
  
  if (orientation !== 'vertical' || variant === 'pills') {
    return 'none';
  }
  
  if (isActive) {
    return variant === 'contained'
      ? 'none'
      : `2px solid ${theme.colors.text.accent}`;
  }
  
  return variant === 'contained' ? `1px solid ${theme.colors.border.light}` : 'none';
};

const getTabBorderRadius = (props: any) => {
  const { variant, theme } = props;
  
  switch (variant) {
    case 'pills':
      return theme.borders.radius.md;
    case 'contained':
      return `${theme.borders.radius.sm} ${theme.borders.radius.sm} 0 0`;
    default:
      return '0';
  }
};

const getTabHoverBackgroundColor = (props: any) => {
  const { isActive, variant, theme } = props;
  
  if (isActive) {
    return getTabBackgroundColor(props);
  }
  
  switch (variant) {
    case 'contained':
      return theme.colors.background.tertiary;
    case 'pills':
      return theme.colors.button.primary.hoverBackground;
    default:
      return theme.colors.background.tertiary;
  }
};

const getTabHoverTextColor = (props: any) => {
  const { isActive, variant, theme } = props;
  
  if (isActive) {
    return getTabTextColor(props);
  }
  
  switch (variant) {
    case 'pills':
      return theme.colors.button.primary.text;
    default:
      return theme.colors.text.accent;
  }
};

// Styled components
const TabsContainer = styled.div<{ orientation: string }>`
  display: flex;
  flex-direction: ${props => props.orientation === 'vertical' ? 'row' : 'column'};
  width: 100%;
  height: 100%;
`;

const TabList = styled.div<{ orientation: string; variant: string }>`
  display: flex;
  flex-direction: ${props => props.orientation === 'horizontal' ? 'row' : 'column'};
  border-bottom: ${props => props.orientation === 'horizontal' && props.variant !== 'pills' 
    ? `1px solid ${props.theme.colors.border.light}` 
    : 'none'};
  border-right: ${props => props.orientation === 'vertical' && props.variant !== 'pills' 
    ? `1px solid ${props.theme.colors.border.light}` 
    : 'none'};
  overflow-x: ${props => props.orientation === 'horizontal' ? 'auto' : 'visible'};
  overflow-y: ${props => props.orientation === 'vertical' ? 'auto' : 'visible'};
  scrollbar-width: thin;
  margin-bottom: ${props => props.orientation === 'horizontal' ? props.theme.spacing.md : '0'};
  margin-right: ${props => props.orientation === 'vertical' ? props.theme.spacing.md : '0'};
`;

const Tab = styled.button<{ 
  isActive: boolean; 
  disabled?: boolean; 
  variant: string;
  orientation: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${getTabBackgroundColor};
  color: ${getTabTextColor};
  border: none;
  border-bottom: ${getTabBorderBottom};
  border-right: ${getTabBorderRight};
  border-radius: ${getTabBorderRadius};
  font-family: ${props => props.theme.fonts.family.primary};
  font-size: ${props => props.theme.fonts.size.md};
  font-weight: ${props => props.isActive ? props.theme.fonts.weight.medium : props.theme.fonts.weight.regular};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? props.theme.opacity.disabled : 1};
  white-space: nowrap;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: ${getTabHoverBackgroundColor};
    color: ${getTabHoverTextColor};
  }

  &:focus {
    outline: none;
    ${focusOutline}
  }
`;

const TabIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.theme.spacing.xs};
`;

const TabContent = styled.div`
  flex: 1;
  overflow: auto;
`;

/**
 * A reusable tabbed navigation component that allows users to switch between
 * different content sections. Supports horizontal and vertical orientations,
 * different visual variants, and can include icons alongside labels.
 */
const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTabId, 
  onChange, 
  variant = DEFAULT_VARIANT, 
  orientation = DEFAULT_ORIENTATION,
  className,
  ...rest
}) => {
  // Use the provided activeTabId or default to the first tab
  const [activeTab, setActiveTab] = useState(activeTabId || (tabs.length > 0 ? tabs[0].id : ''));

  // Update the active tab when the activeTabId prop changes
  useEffect(() => {
    if (activeTabId && activeTabId !== activeTab) {
      setActiveTab(activeTabId);
    }
  }, [activeTabId, activeTab]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  }, [onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(tabId);
    } else if (orientation === 'horizontal' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      const direction = e.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      
      // Skip disabled tabs
      if (nextTab && !nextTab.disabled) {
        handleTabChange(nextTab.id);
      } else {
        // Try the next tab in the sequence
        const nextNextIndex = (nextIndex + direction + tabs.length) % tabs.length;
        const nextNextTab = tabs[nextNextIndex];
        if (nextNextTab && !nextNextTab.disabled) {
          handleTabChange(nextNextTab.id);
        }
      }
    } else if (orientation === 'vertical' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      
      // Skip disabled tabs
      if (nextTab && !nextTab.disabled) {
        handleTabChange(nextTab.id);
      } else {
        // Try the next tab in the sequence
        const nextNextIndex = (nextIndex + direction + tabs.length) % tabs.length;
        const nextNextTab = tabs[nextNextIndex];
        if (nextNextTab && !nextNextTab.disabled) {
          handleTabChange(nextNextTab.id);
        }
      }
    }
  }, [tabs, activeTab, orientation, handleTabChange]);

  // Find the active tab
  const activeTabItem = tabs.find(tab => tab.id === activeTab);

  return (
    <TabsContainer 
      orientation={orientation}
      className={className}
      {...rest}
    >
      <TabList 
        role="tablist"
        aria-orientation={orientation}
        orientation={orientation}
        variant={variant}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            isActive={activeTab === tab.id}
            disabled={tab.disabled}
            variant={variant}
            orientation={orientation}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
          >
            {tab.icon && <TabIcon>{tab.icon}</TabIcon>}
            {tab.label}
          </Tab>
        ))}
      </TabList>
      <TabContent
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabItem?.content}
      </TabContent>
    </TabsContainer>
  );
};

export default Tabs;