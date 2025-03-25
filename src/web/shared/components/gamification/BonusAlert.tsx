import React from 'react';
import styled from 'styled-components';
import { Alert, AlertProps } from '../feedback/Alert';
import { Button } from '../buttons/Button';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { formatDateTime } from '../../../common/utils/dateTimeUtils';
import { colors } from '../../styles/colors';

/**
 * Props for the BonusAlert component
 */
export interface BonusAlertProps {
  /** The bonus zone to display information about */
  bonusZone: BonusZone;
  /** Distance to the bonus zone in miles */
  distance: number;
  /** Base amount for calculating potential bonus earnings */
  baseAmount: number;
  /** Callback function to view the bonus zone on the map */
  onViewMap?: () => void;
  /** Callback function when the alert is dismissed */
  onDismiss?: () => void;
  /** Additional CSS class name */
  className?: string;
}

const StyledAlert = styled(Alert)`
  margin-bottom: 16px;
  border-left: 4px solid ${colors.semantic.warning};
`;

const BonusDetails = styled.div`
  margin-top: 8px;
`;

const BonusMultiplier = styled.span`
  font-weight: bold;
  color: ${colors.semantic.warning};
  font-size: 16px;
`;

const BonusAmount = styled.div`
  margin-top: 4px;
  font-weight: bold;
`;

const BonusReason = styled.div`
  margin-top: 4px;
`;

const BonusTimeframe = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${props => props.theme.colors.neutral.mediumGray};
`;

const BonusDistance = styled.div`
  margin-top: 4px;
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
`;

/**
 * A component that displays an alert notification for a bonus zone,
 * providing information about the bonus opportunity.
 */
const BonusAlert: React.FC<BonusAlertProps> = ({
  bonusZone,
  distance,
  baseAmount,
  onViewMap,
  onDismiss,
  className
}) => {
  // If no bonus zone is provided, return null
  if (!bonusZone) return null;

  // Format the multiplier as a percentage
  const multiplierPercentage = Math.round((bonusZone.multiplier - 1) * 100);

  // Format the start and end times
  const formattedStartTime = formatDateTime(bonusZone.startTime);
  const formattedEndTime = formatDateTime(bonusZone.endTime);

  // Calculate the potential bonus amount
  const potentialBonus = baseAmount * bonusZone.multiplier - baseAmount;

  return (
    <StyledAlert
      severity="warning"
      onClose={onDismiss}
      className={className}
      message={
        <>
          <BonusDetails>
            <BonusMultiplier>Bonus: {multiplierPercentage}%</BonusMultiplier>
            <BonusAmount>Potential earnings: ${potentialBonus.toFixed(2)}</BonusAmount>
            <BonusReason>{bonusZone.reason}</BonusReason>
            <BonusTimeframe>Valid from {formattedStartTime} to {formattedEndTime}</BonusTimeframe>
            <BonusDistance>{distance.toFixed(1)} miles away</BonusDistance>
          </BonusDetails>
          {onViewMap && (
            <ActionButtons>
              <Button onClick={onViewMap} variant="primary" size="small">
                View on Map
              </Button>
            </ActionButtons>
          )}
        </>
      }
    />
  );
};

export default BonusAlert;