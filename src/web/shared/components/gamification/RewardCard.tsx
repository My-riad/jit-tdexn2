import React from 'react';
import styled, { useTheme } from 'styled-components'; // version ^5.3.6
import { ThemeType } from '../../styles/theme';
import Card from '../cards/Card';
import Button from '../buttons/Button';
import Text from '../typography/Text';
import ProgressBar from '../feedback/ProgressBar';
import { FaCoins, FaGasPump, FaTruck, FaTools, FaHeadset } from 'react-icons/fa'; // version ^4.7.1

/**
 * Props for the RewardCard component
 */
export interface RewardCardProps {
  /**
   * Reward data to display
   */
  reward: Reward;
  
  /**
   * Current driver efficiency score
   */
  currentScore: number;
  
  /**
   * Driver's relationship with this reward (if any)
   */
  driverReward?: DriverReward;
  
  /**
   * Callback function when redeem button is clicked
   */
  onRedeem?: () => void;
  
  /**
   * Additional CSS class name
   */
  className?: string;
  
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * Returns the appropriate icon component based on reward type
 */
const getRewardTypeIcon = (rewardType: RewardType): React.ReactNode => {
  switch (rewardType) {
    case RewardType.FUEL_DISCOUNT:
      return <FaGasPump />;
    case RewardType.PREMIUM_LOAD_ACCESS:
      return <FaTruck />;
    case RewardType.CASH_BONUS:
      return <FaCoins />;
    case RewardType.MAINTENANCE_DISCOUNT:
      return <FaTools />;
    case RewardType.PRIORITY_SUPPORT:
      return <FaHeadset />;
    default:
      return <FaCoins />;
  }
};

/**
 * Formats the reward value based on reward type
 */
const formatRewardValue = (rewardType: RewardType, value: number): string => {
  switch (rewardType) {
    case RewardType.FUEL_DISCOUNT:
      return `$${value.toFixed(2)}/gal`;
    case RewardType.PREMIUM_LOAD_ACCESS:
      return 'Premium';
    case RewardType.CASH_BONUS:
      return `$${value}`;
    case RewardType.MAINTENANCE_DISCOUNT:
      return `${value}% off`;
    case RewardType.PRIORITY_SUPPORT:
      return 'Priority';
    default:
      return `$${value}`;
  }
};

/**
 * Helper function to get background color based on reward status
 */
const getStatusBackgroundColor = (status: RewardStatus, theme: ThemeType) => {
  switch (status) {
    case RewardStatus.AVAILABLE:
      return theme.colors.semantic.success;
    case RewardStatus.REDEEMED:
      return theme.colors.semantic.info;
    case RewardStatus.EXPIRED:
      return theme.colors.semantic.error;
    case RewardStatus.PENDING:
      return theme.colors.semantic.warning;
    default:
      return theme.colors.background.secondary;
  }
};

/**
 * Helper function to get text color based on reward status
 */
const getStatusTextColor = (status: RewardStatus, theme: ThemeType) => {
  switch (status) {
    case RewardStatus.AVAILABLE:
    case RewardStatus.REDEEMED:
    case RewardStatus.EXPIRED:
    case RewardStatus.PENDING:
      return theme.colors.text.inverted;
    default:
      return theme.colors.text.primary;
  }
};

/**
 * Helper function to get display text based on reward status
 */
const getStatusText = (status: RewardStatus) => {
  switch (status) {
    case RewardStatus.AVAILABLE:
      return 'Available';
    case RewardStatus.REDEEMED:
      return 'Redeemed';
    case RewardStatus.EXPIRED:
      return 'Expired';
    case RewardStatus.PENDING:
      return 'Pending';
    default:
      return '';
  }
};

// Styled components
const StyledCard = styled(Card)`
  width: 100%;
  overflow: hidden;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.elevation.medium};
  }
`;

const RewardHeader = styled.div<{ isEligible: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.isEligible ? props.theme.colors.semantic.success : props.theme.colors.background.secondary};
  color: ${props => props.isEligible ? props.theme.colors.text.inverted : props.theme.colors.text.primary};
`;

const RewardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const RewardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const RewardValue = styled.div`
  font-weight: ${props => props.theme.fonts.weight.bold};
  font-size: ${props => props.theme.fonts.size.lg};
`;

const RewardContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const RewardDescription = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
`;

const ScoreRequirement = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const ScoreText = styled.div<{ isEligible: boolean }>`
  font-size: ${props => props.theme.fonts.size.sm};
  color: ${props => props.isEligible ? props.theme.colors.semantic.success : props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const RewardStatus = styled.div<{ status: RewardStatus }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borders.radius.sm};
  font-size: ${props => props.theme.fonts.size.sm};
  font-weight: ${props => props.theme.fonts.weight.medium};
  text-align: center;
  background-color: ${props => getStatusBackgroundColor(props.status, props.theme)};
  color: ${props => getStatusTextColor(props.status, props.theme)};
`;

const RewardFooter = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: ${props => props.theme.borders.width.thin} ${props => props.theme.borders.style.solid} ${props => props.theme.colors.border.light};
  display: flex;
  justify-content: center;
`;

/**
 * A component that displays reward information with eligibility status and redemption option
 */
const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  currentScore,
  driverReward,
  onRedeem,
  className,
  style,
}) => {
  const theme = useTheme();
  
  // Determine if the driver is eligible for the reward
  const isEligible = currentScore >= reward.requiredScore;
  
  // Get the appropriate icon for the reward type
  const icon = getRewardTypeIcon(reward.type);
  
  // Format the reward value
  const formattedValue = formatRewardValue(reward.type, reward.value);
  
  // Calculate progress percentage toward required score
  const progressPercentage = Math.min(100, (currentScore / reward.requiredScore) * 100);
  
  return (
    <StyledCard className={className} style={style}>
      <RewardHeader isEligible={isEligible}>
        <RewardTitle>
          <RewardIcon>{icon}</RewardIcon>
          <Text variant="label" noMargin>{reward.title}</Text>
        </RewardTitle>
        <RewardValue>{formattedValue}</RewardValue>
      </RewardHeader>
      
      <RewardContent>
        <RewardDescription>
          <Text variant="bodySmall" noMargin>{reward.description}</Text>
        </RewardDescription>
        
        <ScoreRequirement>
          <ScoreText isEligible={isEligible}>
            {isEligible 
              ? 'You qualify for this reward!' 
              : `Required Score: ${reward.requiredScore}`}
          </ScoreText>
          <ProgressBar 
            value={currentScore} 
            max={reward.requiredScore}
            size="small" 
            color={isEligible ? "semantic.success" : "primary.blue"}
            showLabel
            label={`${currentScore} / ${reward.requiredScore}`}
          />
        </ScoreRequirement>
        
        {driverReward && (
          <RewardStatus status={driverReward.status}>
            {getStatusText(driverReward.status)}
          </RewardStatus>
        )}
      </RewardContent>
      
      {isEligible && (!driverReward || driverReward.status === RewardStatus.AVAILABLE) && (
        <RewardFooter>
          <Button 
            onClick={onRedeem}
            disabled={!onRedeem}
            variant="success"
            size="small"
          >
            Redeem Reward
          </Button>
        </RewardFooter>
      )}
    </StyledCard>
  );
};

export default RewardCard;