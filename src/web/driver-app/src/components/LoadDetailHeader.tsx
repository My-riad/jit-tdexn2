import React from 'react';
import styled from 'styled-components';
import {
  LoadWithDetails,
  LoadStatus,
  LoadLocationType,
  LoadRecommendation,
  LoadLocation,
} from '../../../common/interfaces/load.interface';
import EfficiencyScore from './EfficiencyScore';
import { colors } from '../styles/colors'; // version: Specified in the file JSON specification
import { TouchableOpacity, View, Text } from 'react-native';

interface LoadDetailHeaderProps {
  load: LoadWithDetails;
  recommendation?: LoadRecommendation;
  showEfficiencyScore?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

/**
 * Function to get the appropriate color for a load status
 */
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.AVAILABLE:
      return colors.status.available;
    case LoadStatus.ASSIGNED:
      return colors.status.assigned;
    case LoadStatus.IN_TRANSIT:
    case LoadStatus.AT_PICKUP:
    case LoadStatus.AT_DROPOFF:
      return colors.status.inTransit;
    case LoadStatus.COMPLETED:
      return colors.status.completed;
    case LoadStatus.CANCELLED:
      return colors.status.cancelled;
    default:
      return colors.status.issue;
  }
};

/**
 * Container for the entire header section
 */
const HeaderContainer = styled.View`
  padding: 16px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
  margin-bottom: 16px;
  elevation: 2;
  shadow-color: ${props => props.theme.colors.ui.shadow};
  shadow-offset: { width: 0, height: 2 };
  shadow-opacity: 0.1;
  shadow-radius: 4;
`;

/**
 * Container for the origin-destination route information
 */
const RouteContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

/**
 * Text displaying the origin to destination route
 */
const RouteText = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.theme.colors.text.primary};
  flex: 1;
`;

/**
 * Container for the load status indicator
 */
const StatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

/**
 * Visual indicator for the load status
 */
const StatusIndicator = styled.View<{ status: LoadStatus }>`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${props => getStatusColor(props.status)};
  margin-right: 8px;
`;

/**
 * Text displaying the load status
 */
const StatusText = styled.Text<{ status: LoadStatus }>`
  font-size: 14px;
  color: ${props => getStatusColor(props.status)};
  font-weight: 500;
`;

/**
 * Container for the efficiency score section
 */
const ScoreContainer = styled.View`
  align-items: center;
  margin-top: 8px;
`;

/**
 * Container for the efficiency score factors
 */
const ScoreFactorsContainer = styled.View`
  margin-top: 12px;
  padding: 12px;
  background-color: ${props => props.theme.colors.ui.background};
  border-radius: 8px;
`;

/**
 * Item displaying a single score factor
 */
const ScoreFactorItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

/**
 * Text displaying the score factor description
 */
const ScoreFactorText = styled.Text`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  flex: 1;
`;

/**
 * Text displaying the score factor impact
 */
const ScoreFactorImpact = styled.Text<{ impact: number }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.impact > 0 ? props.theme.colors.semantic.success : props.theme.colors.semantic.error};
`;

/**
 * Button for toggling favorite status
 */
const FavoriteButton = styled.TouchableOpacity`
  padding: 8px;
  margin-left: 8px;
`;

/**
 * Component that displays the header section of the load detail screen
 */
export const LoadDetailHeader: React.FC<LoadDetailHeaderProps> = ({
  load,
  recommendation,
  showEfficiencyScore = true,
  isFavorite = false,
  onToggleFavorite,
}) => {
  // Destructure props to get load data, recommendation data, and other props
  const { id, status, locations, efficiencyScore } = load;

  // Extract origin and destination locations from load data
  const originLocation: LoadLocation | undefined = locations.find(loc => loc.locationType === LoadLocationType.PICKUP);
  const destinationLocation: LoadLocation | undefined = locations.find(loc => loc.locationType === LoadLocationType.DELIVERY);

  // Format origin and destination city/state for display
  const origin = originLocation ? `${originLocation.address.city}, ${originLocation.address.state}` : 'Unknown Origin';
  const destination = destinationLocation ? `${destinationLocation.address.city}, ${destinationLocation.address.state}` : 'Unknown Destination';

  // Get the load status and efficiency score
  const loadStatus: LoadStatus = status;
  const score: number = efficiencyScore;

  // Render the header container with appropriate styling
  return (
    <HeaderContainer>
      {/* Display the origin to destination route information */}
      <RouteContainer>
        <RouteText>{`${origin} → ${destination}`}</RouteText>
        {onToggleFavorite && (
          <FavoriteButton onPress={onToggleFavorite}>
            <Text>{isFavorite ? '★' : '☆'}</Text>
          </FavoriteButton>
        )}
      </RouteContainer>

      {/* Show the current load status with appropriate color coding */}
      <StatusContainer>
        <StatusIndicator status={loadStatus} />
        <StatusText status={loadStatus}>{loadStatus}</StatusText>
      </StatusContainer>

      {/* Display the efficiency score using the EfficiencyScore component */}
      {showEfficiencyScore && (
        <ScoreContainer>
          <EfficiencyScore score={score} />
        </ScoreContainer>
      )}

      {/* If recommendation data is available, show scoring factors that contribute to the efficiency score */}
      {recommendation && recommendation.scoringFactors && (
        <ScoreFactorsContainer>
          {recommendation.scoringFactors.map((factor, index) => (
            <ScoreFactorItem key={index}>
              <ScoreFactorText>{factor.description}</ScoreFactorText>
              <ScoreFactorImpact impact={factor.impact}>{factor.impact > 0 ? `+${factor.impact}` : factor.impact}</ScoreFactorImpact>
            </ScoreFactorItem>
          ))}
        </ScoreFactorsContainer>
      )}
    </HeaderContainer>
  );
};

export default LoadDetailHeader;