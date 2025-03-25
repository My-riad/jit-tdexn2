import React from 'react'; // version 18.2+
import styled from 'styled-components'; // version 5.3+

import Card from '../../../shared/components/cards/Card';
import Text from '../../../shared/components/typography/Text';
import EfficiencyScore from './EfficiencyScore';
import {
  LoadSummary,
  LoadStatus,
} from '../../../common/interfaces/load.interface';
import {
  formatCurrency,
  formatDistance,
  formatLoadStatus,
  formatDateForDisplay,
} from '../../../common/utils/formatters';
import { formatDateForDisplay as formatDateForDisplayUtil } from '../../../common/utils/dateTimeUtils';
import { colors } from '../styles/colors';

/**
 * Props for the LoadHistoryItem component
 */
interface LoadHistoryItemProps {
  /** Load summary data to display */
  load: LoadSummary;
  /** Function to call when the item is pressed */
  onPress: (load: LoadSummary) => void;
  /** Whether to show the efficiency score */
  showEfficiencyScore?: boolean;
  /** Additional styles to apply to the component */
  style?: React.CSSProperties;
}

/**
 * Styled Card component with history item specific styling
 */
const StyledCard = styled(Card)`
  margin-bottom: ${(props) => props.theme.spacing.md};
  width: 100%;
  box-shadow: ${(props) => props.theme.elevation.medium};
  border-radius: ${(props) => props.theme.borders.radius.md};
`;

/**
 * Container for the card content with flex layout
 */
const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.sm};
`;

/**
 * Row container for the card header with reference number and status
 */
const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

/**
 * Text component for the load reference number
 */
const ReferenceNumber = styled(Text)`
  font-weight: bold;
  font-size: 14px;
  color: ${(props) => props.theme.colors.text.primary};
`;

/**
 * Badge component for displaying load status
 */
const StatusBadge = styled.div<{ statusColor: string }>`
  background-color: ${(props) => props.statusColor};
  padding: ${(props) => props.theme.spacing.xxs} ${(props) => props.theme.spacing.sm};
  border-radius: ${(props) => props.theme.borders.radius.sm};
  font-size: 12px;
  font-weight: medium;
  color: white;
`;

/**
 * Container for the origin and destination information
 */
const RouteContainer = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.sm};
  display: flex;
  flex-direction: column;
`;

/**
 * Text component for route information
 */
const RouteText = styled(Text)`
  font-size: 16px;
  font-weight: medium;
  color: ${(props) => props.theme.colors.text.primary};
  margin-bottom: ${(props) => props.theme.spacing.xxs};
`;

/**
 * Row container for load details
 */
const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

/**
 * Container for individual detail items
 */
const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Label for detail items
 */
const DetailLabel = styled(Text)`
  font-size: 12px;
  color: ${(props) => props.theme.colors.text.secondary};
  margin-bottom: ${(props) => props.theme.spacing.xxs};
`;

/**
 * Value for detail items
 */
const DetailValue = styled(Text)`
  font-size: 14px;
  font-weight: medium;
  color: ${(props) => props.theme.colors.text.primary};
`;

/**
 * Container for payment information
 */
const PaymentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => props.theme.spacing.sm};
`;

/**
 * Text component for payment amount
 */
const PaymentAmount = styled(Text)`
  font-size: 18px;
  font-weight: bold;
  color: ${(props) => props.theme.colors.primary.blue};
`;

/**
 * Mapping of load statuses to their corresponding colors for visual indication
 */
const STATUS_COLORS = {
  COMPLETED: colors.semantic.success,
  DELIVERED: colors.semantic.success,
  CANCELLED: colors.semantic.error,
  IN_TRANSIT: colors.semantic.info,
  DELAYED: colors.semantic.warning,
  EXCEPTION: colors.semantic.error,
  DEFAULT: colors.neutral.gray500,
};

/**
 * A component that displays a single load history item
 */
const LoadHistoryItem: React.FC<LoadHistoryItemProps> = ({
  load,
  onPress,
  showEfficiencyScore = true,
  style,
}) => {
  // Destructure load data from props
  const {
    id,
    referenceNumber,
    origin,
    destination,
    status,
    pickupDate,
    deliveryDate,
    rate,
    distance,
    efficiencyScore,
  } = load;

  // Format load details using formatter utilities
  const formattedRate = formatCurrency(rate);
  const formattedDistance = formatDistance(distance);
  const formattedStatus = formatLoadStatus(status);

  // Format dates using dateTimeUtils
  const formattedPickupDate = formatDateForDisplayUtil(pickupDate);
  const formattedDeliveryDate = formatDateForDisplayUtil(deliveryDate);

  // Determine status color based on load status
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;

  // Render the card with formatted load information
  return (
    <StyledCard onClick={() => onPress(load)} style={style}>
      <CardContent>
        <HeaderRow>
          {/* Display load reference number */}
          <ReferenceNumber>{referenceNumber}</ReferenceNumber>
          {/* Display load status */}
          <StatusBadge statusColor={statusColor}>{formattedStatus}</StatusBadge>
        </HeaderRow>

        {/* Show origin and destination locations */}
        <RouteContainer>
          <RouteText>{`${origin} → ${destination}`}</RouteText>
        </RouteContainer>

        {/* Display pickup and delivery dates */}
        <DetailRow>
          <DetailItem>
            <DetailLabel>Pickup</DetailLabel>
            <DetailValue>{formattedPickupDate}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Delivery</DetailLabel>
            <DetailValue>{formattedDeliveryDate}</DetailValue>
          </DetailItem>
        </DetailRow>

        {/* Show payment information and distance */}
        <PaymentContainer>
          <PaymentAmount>{formattedRate}</PaymentAmount>
          <Text>{formattedDistance}</Text>
        </PaymentContainer>

        {/* Include efficiency score if available */}
        {showEfficiencyScore && (
          <EfficiencyScore score={efficiencyScore} showChange={false} />
        )}
      </CardContent>
    </StyledCard>
  );
};

export default LoadHistoryItem;