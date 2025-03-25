import React from 'react';
import styled from 'styled-components';
import Heading from '../../../shared/components/typography/Heading';
import Container from '../../../shared/components/layout/Container';
import { FlexBox } from '../../../shared/components/layout/FlexBox';
import { theme } from '../../../shared/styles/theme';

/**
 * Props for the PageHeader component
 */
interface PageHeaderProps {
  /** The title to display in the header */
  title: string;
  /** Optional subtitle to display below the title */
  subtitle?: string;
  /** Optional actions to display on the right side of the header */
  actions?: React.ReactNode;
  /** Additional class name for the header container */
  className?: string;
}

/**
 * Styled container for the page header
 */
const HeaderContainer = styled(Container)`
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

/**
 * Styled container for the title and subtitle
 */
const TitleContainer = styled.div`
  flex: 1;
  margin-right: ${theme.spacing.md};
`;

/**
 * Styled container for action buttons
 */
const ActionsContainer = styled(FlexBox)`
  gap: ${theme.spacing.sm};
  align-items: center;
  justify-content: flex-end;
`;

/**
 * Styled heading for the subtitle
 */
const SubtitleText = styled(Heading)`
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs};
  font-weight: normal;
`;

/**
 * A component that renders a page header with title, optional subtitle, and action buttons.
 * This component is used across various pages to provide a standardized header layout with
 * appropriate spacing and styling.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  actions, 
  className 
}) => {
  return (
    <HeaderContainer className={className}>
      <FlexBox alignItems="flex-start">
        <TitleContainer>
          <Heading level={2}>{title}</Heading>
          {subtitle && (
            <SubtitleText level={4}>{subtitle}</SubtitleText>
          )}
        </TitleContainer>
        {actions && (
          <ActionsContainer>
            {actions}
          </ActionsContainer>
        )}
      </FlexBox>
    </HeaderContainer>
  );
};

export default PageHeader;