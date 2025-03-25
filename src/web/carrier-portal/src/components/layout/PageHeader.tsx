import React from 'react';
import styled from 'styled-components';
import Heading from '../../../../shared/components/typography/Heading';
import Breadcrumbs from '../../../../shared/components/navigation/Breadcrumbs';
import Button from '../../../../shared/components/buttons/Button';
import FlexBox from '../../../../shared/components/layout/FlexBox';
import { theme } from '../../../../shared/styles/theme';
import { mediaQueries } from '../../../../shared/styles/mediaQueries';

interface PageHeaderProps {
  /**
   * The title of the page
   */
  title: string;
  
  /**
   * Optional subtitle for the page
   */
  subtitle?: string;
  
  /**
   * Optional breadcrumb items for navigation
   */
  breadcrumbItems?: Array<{
    label: string;
    href: string;
  }>;
  
  /**
   * Optional action buttons for the page header
   */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: string;
    icon?: React.ReactNode;
  }>;
  
  /**
   * Optional children to render below the header
   */
  children?: React.ReactNode;
  
  /**
   * Optional className for styling
   */
  className?: string;
}

const HeaderContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  
  ${mediaQueries.down('sm')} {
    flex-direction: column;
  }
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  
  ${mediaQueries.down('sm')} {
    width: 100%;
    justify-content: flex-start;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
`;

/**
 * A reusable page header component for the carrier management portal that provides
 * a consistent header structure with title, optional subtitle, breadcrumbs, and action buttons.
 * This component is used across various pages to maintain a consistent layout and navigation experience.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbItems,
  actions,
  children,
  className,
}) => {
  return (
    <HeaderContainer className={className}>
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumbs items={breadcrumbItems} />
      )}
      
      <TitleSection>
        <TitleContainer>
          <Heading level={1}>{title}</Heading>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </TitleContainer>
        
        {actions && actions.length > 0 && (
          <ActionsContainer>
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant as any || 'primary'}
                startIcon={action.icon}
              >
                {action.label}
              </Button>
            ))}
          </ActionsContainer>
        )}
      </TitleSection>
      
      {children}
    </HeaderContainer>
  );
};

export default PageHeader;