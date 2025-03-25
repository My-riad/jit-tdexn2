/**
 * Layout Components Barrel
 *
 * This file exports all layout-related components and interfaces from the shared
 * components library. It provides a centralized place to import layout components,
 * promoting consistency and reducing import statements across the application.
 */

// Container component for layout structure
export { default as Container } from './Container';

// FlexBox component for flexible layouts
export { default as FlexBox } from './FlexBox';

// Grid components for grid-based layouts
export { default as Grid, GridItem } from './Grid';

// Section component for content sections
export { default as Section } from './Section';

// Sidebar component for navigation
export { default as Sidebar, type SidebarProps } from './Sidebar';

// Header component for page headers
export { default as Header, type HeaderProps, type UserMenuItem } from './Header';

// Footer component for page footers
export { default as Footer, type FooterProps, type FooterLink } from './Footer';