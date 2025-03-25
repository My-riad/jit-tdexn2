import React from 'react';
import styled from 'styled-components';
import Link from '../typography/Link';
import ArrowIcon from '../../assets/icons/arrow.svg';
import { ThemeType } from '../../styles/theme';

/**
 * TypeScript interface for the Breadcrumbs component props
 */
interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items with label and href
   */
  items: Array<{
    label: string;
    href: string;
  }>;
  /**
   * Optional custom separator between breadcrumb items
   */
  separator?: React.ReactNode;
  /**
   * Optional className for styling the container
   */
  className?: string;
}

/**
 * Styled container for the breadcrumbs component
 */
const BreadcrumbsContainer = styled.div`
  margin: ${({ theme }) => theme.spacing.md} 0;
  font-family: ${({ theme }) => theme.fonts.family.primary};
`;

/**
 * Styled ordered list for breadcrumb items
 */
const BreadcrumbsList = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0;
  margin: 0;
  list-style: none;
`;

/**
 * Styled list item for individual breadcrumb entries
 */
const BreadcrumbItem = styled.li`
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  
  &:last-child {
    font-weight: ${({ theme }) => theme.fonts.weight.medium};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

/**
 * Styled separator between breadcrumb items
 */
const BreadcrumbSeparator = styled.span`
  display: flex;
  align-items: center;
  margin: 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  svg {
    width: 16px;
    height: 16px;
    transform: rotate(90deg);
  }
`;

/**
 * Styled span for the current page (last breadcrumb item)
 */
const CurrentPage = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
`;

/**
 * A component that renders a breadcrumb navigation trail
 * 
 * Provides visual indication of the current location within the application's structure
 * and allows users to navigate back to parent pages.
 * 
 * Follows WCAG 2.1 AA compliance with proper ARIA attributes and semantic HTML.
 * 
 * @example
 * ```tsx
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Loads', href: '/loads' },
 *     { label: 'Load Details', href: '/loads/123' }
 *   ]} 
 * />
 * ```
 */
const Breadcrumbs = ({
  items,
  separator = <ArrowIcon />,
  className,
  ...props
}: BreadcrumbsProps) => {
  // If no items are provided, don't render anything
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <BreadcrumbsContainer className={className} {...props}>
      <nav aria-label="Breadcrumb">
        <BreadcrumbsList>
          {items.map((item, index) => (
            <BreadcrumbItem 
              key={index}
              itemScope
              itemType="http://schema.org/ListItem"
            >
              {index === items.length - 1 ? (
                <CurrentPage aria-current="page">
                  {item.label}
                </CurrentPage>
              ) : (
                <Link href={item.href}>
                  {item.label}
                </Link>
              )}
              
              {index < items.length - 1 && (
                <BreadcrumbSeparator aria-hidden="true">
                  {separator}
                </BreadcrumbSeparator>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </BreadcrumbItem>
          ))}
        </BreadcrumbsList>
      </nav>
    </BreadcrumbsContainer>
  );
};

export default Breadcrumbs;