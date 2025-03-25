import React from 'react';
import styled from 'styled-components';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Card, { CardVariant } from './Card';
import Heading from '../typography/Heading';
import Text from '../typography/Text';
import { theme } from '../../styles/theme';

/**
 * Enum for different info card style variants
 */
export enum InfoCardVariant {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

/**
 * Props for the InfoCard component
 */
export interface InfoCardProps {
  /** Title displayed at the top of the card */
  title: string;
  /** Description content of the card */
  description: string | React.ReactNode;
  /** Optional icon to display in the card header */
  icon?: React.ReactNode;
  /** Visual style variant of the card */
  variant?: InfoCardVariant;
  /** Optional click handler to make the card interactive */
  onClick?: () => void;
  /** Additional class name for custom styling */
  className?: string;
}

/**
 * Mapping of variants to their corresponding theme colors
 */
const VARIANT_COLORS: Record<InfoCardVariant, string> = {
  [InfoCardVariant.INFO]: theme.colors.semantic.info,
  [InfoCardVariant.SUCCESS]: theme.colors.semantic.success,
  [InfoCardVariant.WARNING]: theme.colors.semantic.warning,
  [InfoCardVariant.ERROR]: theme.colors.semantic.error
};

/**
 * Default variant for info cards
 */
const DEFAULT_VARIANT = InfoCardVariant.INFO;

/**
 * Styled wrapper for the info card
 */
const StyledInfoCard = styled(Card)<{ onClick?: () => void, variant?: InfoCardVariant }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  cursor: ${({ onClick }) => onClick ? 'pointer' : 'default'};
  
  ${({ onClick }) => onClick && `
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  `}
`;

/**
 * Header section of the info card
 */
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Container for the card icon
 */
const IconContainer = styled.div<{ variant: InfoCardVariant }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ variant }) => `${VARIANT_COLORS[variant]}1a`}; // 10% opacity
  margin-right: ${theme.spacing.sm};
  color: ${({ variant }) => VARIANT_COLORS[variant]};
`;

/**
 * Container for the card content
 */
const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

/**
 * A card component for displaying informational content with title, description, and optional icon.
 * 
 * This component is used throughout the application to present explanatory information,
 * tips, and contextual help in a consistent format.
 */
const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  icon,
  variant = DEFAULT_VARIANT,
  onClick,
  className
}) => {
  return (
    <StyledInfoCard
      variant={CardVariant.DEFAULT}
      elevation="medium"
      padding="md"
      onClick={onClick}
      className={className}
    >
      <CardHeader>
        <IconContainer variant={variant}>
          {icon || <InformationCircleIcon width={20} height={20} />}
        </IconContainer>
        <Heading level={4} noMargin>{title}</Heading>
      </CardHeader>
      <ContentContainer>
        <Text variant="bodyRegular" noMargin={true}>
          {description}
        </Text>
      </ContentContainer>
    </StyledInfoCard>
  );
};

export default InfoCard;