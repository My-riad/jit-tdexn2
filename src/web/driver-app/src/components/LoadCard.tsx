import React from 'react';
import styled from 'styled-components'; // version 5.3.6

import Card from '../../../shared/components/cards/Card';
import Text from '../../../shared/components/typography/Text';
import EfficiencyScore from './EfficiencyScore';
import {
  LoadRecommendation,
  LoadSummary,
  EquipmentType,
} from '../../../common/interfaces/load.interface';
import {
  formatCurrency,
  formatDistance,
  formatWeight,
  formatRatePerMile,
  formatDateForDisplay,
} from '../../../common/utils/formatters';
import { colors } from '../styles/colors';

/**
 * @description Default value for showing efficiency score
 */
const DEFAULT_SHOW_EFFICIENCY_SCORE = true;

/**
 * @description TypeScript interface for LoadCard component props
 */
export interface LoadCardProps {
  /**
   * @description Load data to display in the card
   */
  load: LoadRecommendation | LoadSummary;
  /**
   * @description Function to handle card press
   */
  onPress: (load: LoadRecommendation | LoadSummary) => void;
  /**
   * @description Flag to show or hide the efficiency score
   */
  showEfficiencyScore?: boolean;
  /**
   * @description Flag indicating if the load is a favorite
   */
  isFavorite?: boolean;
  /**
   * @description Function to toggle the favorite status of the load
   */
  onToggleFavorite?: (loadId: string) => void;
}

/**
 * @description Styled Card component with load card specific styling
 */
const StyledCard = styled(Card)`
  margin-bottom: ${(props) => props.theme.spacing.md}; /* Margin bottom for spacing between cards */
  width: 100%; /* Width set to 100% for responsive layout */
  box-shadow: ${(props) => props.theme.elevation.medium}; /* Shadow elevation for visual hierarchy */
  border-radius: ${(props) => props.theme.borders.radius.md}; /* Border radius for consistent styling */
`;

/**
 * @description Container for the card content with flex layout
 */
const CardContent = styled.div`
  display: flex; /* Display flex for layout */
  flex-direction: column; /* Flex direction column for vertical stacking */
  gap: ${(props) => props.theme.spacing.sm}; /* Gap for consistent spacing between elements */
`;

/**
 * @description Row container for the card header with route information
 */
const HeaderRow = styled.div`
  display: flex; /* Display flex for horizontal layout */
  justify-content: space-between; /* Justify content space-between for alignment */
  align-items: center; /* Align items center for vertical centering */
  margin-bottom: ${(props) => props.theme.spacing.sm}; /* Margin bottom for spacing */
`;

/**
 * @description Container for the origin and destination information
 */
const RouteContainer = styled.div`
  flex-grow: 1; /* Flex grow 1 to take available space */
  margin-right: ${(props) => props.theme.spacing.md}; /* Margin right for spacing from efficiency score */
`;

/**
 * @description Row container for load details
 */
const DetailRow = styled.div`
  display: flex; /* Display flex for horizontal layout */
  justify-content: space-between; /* Justify content space-between for alignment */
  margin-bottom: ${(props) => props.theme.spacing.xs}; /* Margin bottom for spacing between rows */
`;

/**
 * @description Container for individual detail items
 */
const DetailItem = styled.div`
  display: flex; /* Display flex for layout */
  flex-direction: column; /* Flex direction column for vertical stacking */
  margin-right: ${(props) => props.theme.spacing.md}; /* Margin right for spacing between items */
`;

/**
 * @description Container for rate information
 */
const RateContainer = styled.div`
  display: flex; /* Display flex for layout */
  flex-direction: column; /* Flex direction column for vertical stacking */
  align-items: flex-end; /* Align items flex-end for right alignment */
`;

/**
 * @description A card component that displays load information in a consistent format
 * @param props - The LoadCardProps containing load data and event handlers
 * @returns Rendered load card component
 */
export const LoadCard: React.FC<LoadCardProps> = ({
  load,
  onPress,
  showEfficiencyScore = DEFAULT_SHOW_EFFICIENCY_SCORE,
  isFavorite,
  onToggleFavorite,
}) => {
  // Extract load details from the load object
  const {
    loadId,
    origin,
    destination,
    equipmentType,
    weight,
    pickupDate,
    deliveryDate,
    distance,
    rate,
    ratePerMile,
  } = load;

  // Format load details using formatter utilities
  const formattedWeight = formatWeight(weight);
  const formattedDistance = formatDistance(distance);
  const formattedRate = formatCurrency(rate);
  const formattedRatePerMile = ratePerMile ? formatRatePerMile(rate, distance) : '';
  const formattedPickupDate = formatDateForDisplay(pickupDate);
  const formattedDeliveryDate = formatDateForDisplay(deliveryDate);

  return (
    <StyledCard onClick={() => onPress(load)}>
      <CardContent>
        <HeaderRow>
          <RouteContainer>
            <Text variant="label">{origin} → {destination}</Text> {/* Include origin and destination locations */}
          </RouteContainer>
          {showEfficiencyScore && 'efficiencyScore' in load && (
            <EfficiencyScore score={load.efficiencyScore} /> /* Display efficiency score using the EfficiencyScore component */
          )}
        </HeaderRow>

        <DetailRow>
          <DetailItem>
            <Text variant="bodySmall">
              {equipmentType} {/* Display equipment type */}
            </Text>
          </DetailItem>
          <DetailItem>
            <Text variant="bodySmall">
              {formattedWeight} {/* Display weight */}
            </Text>
          </DetailItem>
        </DetailRow>

        <DetailRow>
          <DetailItem>
            <Text variant="bodySmall">
              Pickup: {formattedPickupDate} {/* Show pickup date */}
            </Text>
          </DetailItem>
          <DetailItem>
            <Text variant="bodySmall">
              Delivery: {formattedDeliveryDate} {/* Show delivery date */}
            </Text>
          </DetailItem>
        </DetailRow>

        <DetailRow>
          <DetailItem>
            <Text variant="bodySmall">
              {formattedDistance} {/* Include distance */}
            </Text>
          </DetailItem>
          <RateContainer>
            <Text variant="bodySmall">
              {formattedRate} {/* Include rate */}
            </Text>
            {formattedRatePerMile && (
              <Text variant="caption">{formattedRatePerMile}</Text> /* Include rate per mile */
            )}
          </RateContainer>
        </DetailRow>
      </CardContent>
    </StyledCard>
  );
};