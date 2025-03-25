import React from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import {
  Card,
  CardProps,
  CardVariant,
} from './Card';
import ScoreDisplay from '../gamification/ScoreDisplay';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';
import Text from '../typography/Text';
import FlexBox from '../layout/FlexBox';
import Badge from '../feedback/Badge';
import theme from '../../styles/theme';
import {
  LoadSummary,
  LoadRecommendation,
  LoadStatus,
} from '../../../common/interfaces/load.interface';
import {
  formatCurrency,
  formatDistance,
  formatWeight,
  formatRatePerMile,
} from '../../../common/utils/formatters';
import {
  formatDateForDisplay,
  formatTimeWindow,
} from '../../../common/utils/dateTimeUtils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'; // version ^5.11.0
import StarIcon from '@mui/icons-material/Star'; // version ^5.11.0
import StarBorderIcon from '@mui/icons-material/StarBorder'; // version ^5.11.0
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // version ^5.11.0

/**
 * TypeScript interface for LoadCard component props
 */
export interface LoadCardProps {
  load: LoadSummary;
  recommendation?: LoadRecommendation;
  variant?: CardVariant;
  onViewDetails?: () => void;
  onAccept?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showEfficiencyScore?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enum for different display variants of the load card
 */
export enum LoadCardVariant {
  DEFAULT = 'default',
  COMPACT = 'compact',
  DETAILED = 'detailed',
}

/**
 * Default props for the LoadCard component
 */
const DEFAULT_PROPS = {
  variant: LoadCardVariant.DEFAULT,
  showEfficiencyScore: true,
};

/**
 * Styled card component with load-specific styling
 */
const StyledLoadCard = styled(Card)<{ variant?: LoadCardVariant; isFavorite?: boolean }>`
  padding: ${({ variant, theme }) =>
    variant === LoadCardVariant.COMPACT ? theme.spacing.sm : theme.spacing.md};
  border-radius: ${theme.borders.radius.md};
  margin-bottom: ${theme.spacing.md};
  background-color: ${theme.colors.card.background};

  &:hover {
    /* Add hover effect for interactive cards */
  }
`;

/**
 * Styled div for the load card header section
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Styled div for the origin-destination route display
 */
const RouteContainer = styled(FlexBox)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Styled text component for origin/destination locations
 */
const LocationText = styled(Text)<{ isOrigin?: boolean }>`
  font-weight: bold;
  color: ${({ theme, isOrigin }) =>
    isOrigin ? theme.colors.text.primary : theme.colors.text.secondary};
  width: 40%; /* Adjust as needed */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Styled div for the arrow between origin and destination
 */
const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.fonts.size.md};
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled div for each row of load details
 */
const DetailRow = styled(FlexBox)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xxs};
`;

/**
 * Styled text component for detail labels
 */
const DetailLabel = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.fonts.size.sm};
  font-weight: ${theme.fonts.weight.medium};
`;

/**
 * Styled text component for detail values
 */
const DetailValue = styled(Text)`
  color: ${theme.colors.text.primary};
  font-size: ${theme.fonts.size.md};
  font-weight: normal;
`;

/**
 * Styled div for the efficiency score section
 */
const ScoreContainer = styled.div`
  padding: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  background-color: ${theme.colors.background.secondary};
  border-radius: ${theme.borders.radius.md};
`;

/**
 * Styled div for the action buttons section
 */
const ActionContainer = styled(FlexBox)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${theme.spacing.md};
`;

/**
 * Styled button for viewing load details
 */
const ViewDetailsButton = styled(Button)`
  variant: secondary;
  flex: 1;
  margin-right: ${theme.spacing.sm};
`;

/**
 * Styled button for accepting loads
 */
const AcceptButton = styled(Button)`
  variant: primary;
  flex: 1;
  background-color: ${theme.colors.button.success.background};
`;

/**
 * Styled icon button for favoriting loads
 */
const FavoriteButton = styled(IconButton)<{ isFavorite?: boolean }>`
  size: small;
  color: ${({ theme, isFavorite }) =>
    isFavorite ? theme.colors.primary.blue : theme.colors.neutral.mediumGray};
`;

/**
 * Styled badge for load status
 */
const StatusBadge = styled(Badge)<{ status: LoadStatus }>`
  color: ${({ theme, status }) => {
    switch (status) {
      case LoadStatus.AVAILABLE:
        return theme.colors.status.active;
      case LoadStatus.IN_TRANSIT:
        return theme.colors.status.info;
      case LoadStatus.DELAYED:
        return theme.colors.status.warning;
      case LoadStatus.CANCELLED:
        return theme.colors.status.error;
      default:
        return theme.colors.status.inactive;
    }
  }};
`;

/**
 * A reusable card component for displaying load information
 */
export const LoadCard: React.FC<LoadCardProps> = React.memo((props) => {
  const {
    load,
    recommendation,
    variant = DEFAULT_PROPS.variant,
    onViewDetails,
    onAccept,
    isFavorite,
    onToggleFavorite,
    showEfficiencyScore = DEFAULT_PROPS.showEfficiencyScore,
    className,
    style,
  } = props;

  // Determine if this is a recommendation card
  const isRecommendation = !!recommendation;

  // Extract efficiency score from recommendation data
  const efficiencyScore = recommendation?.efficiencyScore;

  // Format load data for display
  const formattedRate = formatCurrency(load.rate);
  const formattedDistance = formatDistance(load.distance);
  const formattedPickupDate = formatDateForDisplay(load.pickupDate);
  const formattedDeliveryDate = formatDateForDisplay(load.deliveryDate);
  const formattedWeight = formatWeight(load.weight);
  const formattedRatePerMile = formatRatePerMile(load.rate, load.distance);

  // Format pickup and delivery time windows
  const pickupTimeWindow = formatTimeWindow(load.pickupDate, load.pickupDate);
  const deliveryTimeWindow = formatTimeWindow(load.deliveryDate, load.deliveryDate);

  return (
    <StyledLoadCard variant={variant} className={className} style={style}>
      <CardHeader>
        <FlexBox alignItems="center" justifyContent="space-between">
          <FlexBox alignItems="center">
            <LocalShippingIcon style={{ marginRight: theme.spacing.xs }} />
            <Text variant="label" noMargin>
              Load ID: {load.referenceNumber}
            </Text>
          </FlexBox>
          <StatusBadge status={load.status}>{load.status}</StatusBadge>
        </FlexBox>
      </CardHeader>

      <RouteContainer>
        <LocationText isOrigin>{load.origin}</LocationText>
        <ArrowContainer>
          <ArrowForwardIcon />
        </ArrowContainer>
        <LocationText>{load.destination}</LocationText>
      </RouteContainer>

      <DetailRow>
        <DetailLabel>Equipment</DetailLabel>
        <DetailValue>{load.equipmentType}</DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>Weight</DetailLabel>
        <DetailValue>{formattedWeight}</DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>Pickup</DetailLabel>
        <DetailValue>{formattedPickupDate}</DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>Delivery</DetailLabel>
        <DetailValue>{formattedDeliveryDate}</DetailValue>
      </DetailRow>

      <DetailRow>
        <DetailLabel>Rate</DetailLabel>
        <DetailValue>{formattedRate}</DetailValue>
      </DetailRow>

      {showEfficiencyScore && efficiencyScore && (
        <ScoreContainer>
          <ScoreDisplay score={efficiencyScore} />
        </ScoreContainer>
      )}

      <ActionContainer>
        {onViewDetails && (
          <ViewDetailsButton onClick={onViewDetails}>
            View Details
          </ViewDetailsButton>
        )}
        {onAccept && (
          <AcceptButton onClick={onAccept}>Accept Load</AcceptButton>
        )}
        {onToggleFavorite && (
          <FavoriteButton
            ariaLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={onToggleFavorite}
            isFavorite={isFavorite}
          >
            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
          </FavoriteButton>
        )}
      </ActionContainer>
    </StyledLoadCard>
  );
});