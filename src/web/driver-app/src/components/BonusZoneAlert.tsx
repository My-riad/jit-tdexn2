import React from 'react';
import styled from 'styled-components';
import { Alert } from '../../shared/components/feedback/Alert';
import { Button } from '../../shared/components/buttons/Button';
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { formatDateTime } from '../../../common/utils/dateTimeUtils';
import { formatCurrency } from '../../../common/utils/formatters';
import { colors } from '../styles/colors';

/**
 * Props for the BonusZoneAlert component
 */
interface BonusZoneAlertProps {
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

// Styled components for enhanced visual presentation
const StyledAlert = styled(Alert)`
  margin-bottom: 16px;
  border-left: 4px solid ${colors.semantic.warning};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const BonusDetails = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BonusMultiplier = styled.span`
  font-weight: bold;
  color: ${colors.semantic.warning};
  font-size: 16px;
`;

const BonusAmount = styled.div`
  margin-top: 4px;
  font-weight: bold;
  font-size: 15px;
`;

const BonusReason = styled.div`
  margin-top: 4px;
  font-size: 14px;
`;

const BonusTimeframe = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${colors.text.secondary};
`;

const BonusDistance = styled.div`
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  gap: 8px;
`;

/**
 * A specialized alert component for the driver mobile application that displays notifications about nearby or active bonus zones.
 * Provides drivers with information about potential bonus earnings opportunities,
 * including the multiplier, reason, and timeframe for the bonus zone.
 */
const BonusZoneAlert: React.FC<BonusZoneAlertProps> = ({
  bonusZone,
  distance,
  baseAmount,
  onViewMap,
  onDismiss,
  className,
}) => {
  // Return null if no bonus zone is provided
  if (!bonusZone) return null;

  // Format multiplier as a percentage (e.g., 1.25 -> 25%)
  const multiplierPercentage = ((bonusZone.multiplier - 1) * 100).toFixed(0);
  
  // Format start and end times
  const formattedStartTime = formatDateTime(bonusZone.startTime);
  const formattedEndTime = formatDateTime(bonusZone.endTime);
  
  // Calculate potential bonus amount
  const potentialBonus = baseAmount * (bonusZone.multiplier - 1);

  // Create formatted message with bonus details
  const bonusMessage = (
    <>
      <BonusDetails>
        <BonusMultiplier>Bonus Zone: {multiplierPercentage}% Bonus</BonusMultiplier>
        <BonusAmount>Potential earnings: {formatCurrency(potentialBonus)}</BonusAmount>
        <BonusReason>{bonusZone.reason}</BonusReason>
        <BonusTimeframe>Valid from {formattedStartTime} to {formattedEndTime}</BonusTimeframe>
        <BonusDistance>{distance.toFixed(1)} miles away</BonusDistance>
      </BonusDetails>
      
      {onViewMap && (
        <ActionButtons>
          <Button 
            onClick={onViewMap} 
            variant="primary" 
            size="small"
          >
            View on Map
          </Button>
        </ActionButtons>
      )}
    </>
  );

  return (
    <StyledAlert 
      severity="warning" 
      message={bonusMessage}
      onClose={onDismiss}
      className={className}
    />
  );
};

export default BonusZoneAlert;
export type { BonusZoneAlertProps };