import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { colors, spacing, sizes, zIndex, elevation } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import { transition } from '../../styles/mixins';

// Default dimensions for the sidebar
const DEFAULT_WIDTH = '240px';
const DEFAULT_COLLAPSED_WIDTH = '64px';

// Main sidebar container with responsive behavior
const SidebarContainer = styled.div<{
  isCollapsed: boolean;
  width: string;
  collapsedWidth: string;
}>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${props => props.isCollapsed ? props.collapsedWidth : props.width};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  box-shadow: ${({ theme }) => theme.elevation.medium};
  z-index: ${({ theme }) => theme.zIndex.overlay};
  transition: width 0.3s ease;
  overflow: hidden;
  
  ${mediaQueries.down('md')} {
    width: ${props => props.isCollapsed ? '0' : props.width};
    transform: translateX(${props => props.isCollapsed ? '-100%' : '0'});
    transition: transform 0.3s ease, width 0.3s ease;
  }
  
  ${mediaQueries.up('lg')} {
    /* Ensure sidebar is always visible on larger screens */
    transform: none;
  }
`;

// Content area within the sidebar that holds navigation items
const SidebarContent = styled.div<{ isCollapsed: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  height: calc(100% - 60px); /* Account for toggle button */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  
  ${props => props.isCollapsed && `
    padding: ${props.theme.spacing.xs};
    align-items: center;
    text-align: center;
    
    > * {
      margin-bottom: ${props.theme.spacing.md};
      width: 100%;
    }
  `}
`;

// Toggle button to expand/collapse the sidebar
const ToggleButton = styled.button<{ isCollapsed: boolean }>`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.text.accent};
  }
`;

// Arrow icon for the toggle button that rotates based on sidebar state
const ToggleIcon = styled.span<{ isCollapsed: boolean }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  position: relative;
  transform: ${props => props.isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)'};
  transition: transform 0.3s ease;
  
  &:before,
  &:after {
    content: '';
    position: absolute;
    width: 8px;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.text.secondary};
    top: 50%;
    left: 50%;
  }
  
  &:before {
    transform: translate(-50%, -50%) rotate(45deg) translateX(-2px);
  }
  
  &:after {
    transform: translate(-50%, -50%) rotate(-45deg) translateX(-2px);
  }
`;

/**
 * A reusable sidebar component that provides vertical navigation with collapsible functionality
 * for the AI-driven Freight Optimization Platform. Can be extended by specific interfaces
 * (driver app, carrier portal, shipper portal) with their own navigation items and styling.
 */
const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  children,
  width = DEFAULT_WIDTH,
  collapsedWidth = DEFAULT_COLLAPSED_WIDTH,
  className,
  ...rest
}) => {
  return (
    <SidebarContainer
      isCollapsed={isCollapsed}
      width={width}
      collapsedWidth={collapsedWidth}
      className={className}
      role="navigation"
      aria-expanded={!isCollapsed}
      {...rest}
    >
      <SidebarContent isCollapsed={isCollapsed}>
        {children}
      </SidebarContent>
      
      {onToggle && (
        <ToggleButton 
          onClick={onToggle}
          isCollapsed={isCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          <ToggleIcon isCollapsed={isCollapsed} />
        </ToggleButton>
      )}
    </SidebarContainer>
  );
};

/**
 * Props for the Sidebar component
 */
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the sidebar is currently in collapsed state */
  isCollapsed: boolean;
  /** Function to call when toggle button is clicked */
  onToggle?: () => void;
  /** Width of the expanded sidebar (default: 240px) */
  width?: string;
  /** Width of the collapsed sidebar (default: 64px) */
  collapsedWidth?: string;
  /** Optional class name for additional styling */
  className?: string;
  /** Content to render inside the sidebar */
  children: React.ReactNode;
}

export default Sidebar;