import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { FiTruck, FiMapPin, FiBarChart2, FiCheckCircle } from 'react-icons/fi'; // version ^4.7.1
import { Card } from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import { theme } from '../../../shared/styles/theme';
import {
  getLoadOptimizationDetails,
  applyOptimizationRecommendation,
  LoadOptimizationDetails,
} from '../../services/optimizationService';
import { Load } from '../../../common/interfaces/load.interface';

/**
 * Props for the OptimizationRecommendationsList component
 */
interface OptimizationRecommendationsListProps {
  loadId: string;
  onApplyRecommendation: (recommendationId: string) => void;
  className?: string;
}

/**
 * Function that returns a color based on the efficiency score
 * Returns green for high scores, yellow for medium scores, and red for low scores
 */
const getScoreColor = (score: number): string => {
  if (score >= 80) {
    return theme.colors.success.main;
  } else if (score >= 60) {
    return theme.colors.warning.main;
  } else {
    return theme.colors.error.main;
  }
};

/**
 * Helper function to format the impact value of a scoring factor
 */
const formatImpact = (impact: number): string => {
  const formattedImpact = (impact * 100).toFixed(1);
  return impact > 0 ? `+${formattedImpact}%` : `${formattedImpact}%`;
};

/**
 * Helper function to determine the color for an impact value
 */
const getImpactColor = (impact: number): string => {
  if (impact > 0) {
    return theme.colors.success.main;
  } else if (impact < 0) {
    return theme.colors.error.main;
  } else {
    return theme.colors.text.secondary;
  }
};

/**
 * Helper function to format numbers with commas
 */
const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Main container for the optimization recommendations list
 */
const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

/**
 * Header section of the optimization recommendations card
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Title for the optimization recommendations card
 */
const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Section displaying the efficiency score
 */
const ScoreSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background.light};
  border-radius: 8px;
`;

/**
 * Circle displaying the efficiency score value
 */
const ScoreCircle = styled.div<{ score: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: ${(props) => getScoreColor(props.score)};
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
`;

/**
 * Information about the efficiency score
 */
const ScoreInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

/**
 * Label for the efficiency score
 */
const ScoreLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Description of the efficiency score
 */
const ScoreDescription = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Title for a section in the recommendations list
 */
const SectionTitle = styled.h4`
  margin: ${theme.spacing.md} 0 ${theme.spacing.sm} 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

/**
 * List of scoring factors
 */
const FactorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * Individual scoring factor item
 */
const FactorItem = styled.div`
  padding: ${theme.spacing.sm};
  border-radius: 8px;
  background-color: ${theme.colors.background.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Information about a scoring factor
 */
const FactorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Name of a scoring factor
 */
const FactorName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Description of a scoring factor
 */
const FactorDescription = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Impact value of a scoring factor
 */
const FactorImpact = styled.span<{ impact: number }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => getImpactColor(props.impact)};
`;

/**
 * List of recommended drivers
 */
const DriversList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * Individual driver recommendation item
 */
const DriverItem = styled.div`
  padding: ${theme.spacing.sm};
  border-radius: 8px;
  background-color: ${theme.colors.background.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Information about a recommended driver
 */
const DriverInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Name of a recommended driver
 */
const DriverName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Details about a recommended driver
 */
const DriverDetails = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Efficiency score of a recommended driver
 */
const DriverScore = styled.span<{ score: number }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => getScoreColor(props.score)};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

/**
 * List of nearby Smart Hubs
 */
const HubsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * Individual Smart Hub item
 */
const HubItem = styled.div`
  padding: ${theme.spacing.sm};
  border-radius: 8px;
  background-color: ${theme.colors.background.light};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Information about a Smart Hub
 */
const HubInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * Name of a Smart Hub
 */
const HubName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Address of a Smart Hub
 */
const HubAddress = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Efficiency score of a Smart Hub
 */
const HubScore = styled.span<{ score: number }>`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${(props) => getScoreColor(props.score)};
`;

/**
 * List of relay options
 */
const RelayOptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * Individual relay option item
 */
const RelayOptionItem = styled.div`
  padding: ${theme.spacing.sm};
  border-radius: 8px;
  background-color: ${theme.colors.background.light};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

/**
 * Header for a relay option
 */
const RelayOptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

/**
 * Title for a relay option
 */
const RelayOptionTitle = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Savings for a relay option
 */
const RelayOptionSavings = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.success.main};
`;

/**
 * Details for a relay option
 */
const RelayOptionDetails = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Section displaying estimated metrics
 */
const MetricsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background.light};
  border-radius: 8px;
`;

/**
 * Individual metric item
 */
const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 150px;
`;

/**
 * Label for a metric
 */
const MetricLabel = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Value for a metric
 */
const MetricValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Container for loading state
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.lg};
  color: ${theme.colors.text.secondary};
`;

/**
 * Container for error state
 */
const ErrorContainer = styled.div`
  padding: ${theme.spacing.md};
  color: ${theme.colors.error.main};
  text-align: center;
`;

/**
 * Container for empty state
 */
const EmptyContainer = styled.div`
  padding: ${theme.spacing.md};
  color: ${theme.colors.text.secondary};
  text-align: center;
`;

/**
 * Container for action buttons
 */
const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
`;

interface OptimizationRecommendationsListProps {
  loadId: string;
  onApplyRecommendation: (recommendationId: string) => void;
  className?: string;
}

/**
 * Component that displays a list of AI-generated optimization recommendations for a specific load
 */
const OptimizationRecommendationsList: React.FC<OptimizationRecommendationsListProps> = ({
  loadId,
  onApplyRecommendation,
  className,
}) => {
  // Initialize state for optimization details, loading state, and error state
  const [optimizationDetails, setOptimizationDetails] = useState<LoadOptimizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch load optimization details when component mounts or loadId changes
  useEffect(() => {
    const fetchOptimizationDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await getLoadOptimizationDetails(loadId);
        setOptimizationDetails(details);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch optimization details.');
      } finally {
        setIsLoading(false);
      }
    };

    if (loadId) {
      fetchOptimizationDetails();
    }
  }, [loadId]);

  // Handle applying a recommendation when user clicks the Apply button
  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      await applyOptimizationRecommendation(recommendationId);
      onApplyRecommendation(recommendationId);
    } catch (err: any) {
      setError(err.message || 'Failed to apply recommendation.');
    }
  };

  // Render a Card component with a header and list of recommendations
  return (
    <Container className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>

        {isLoading && (
          <LoadingContainer>
            Loading optimization recommendations...
          </LoadingContainer>
        )}

        {error && (
          <ErrorContainer>
            Error: {error}
          </ErrorContainer>
        )}

        {optimizationDetails ? (
          <>
            {/* Display the load's efficiency score prominently */}
            <ScoreSection>
              <ScoreCircle score={optimizationDetails.efficiencyScore}>
                {optimizationDetails.efficiencyScore}
              </ScoreCircle>
              <ScoreInfo>
                <ScoreLabel>Efficiency Score</ScoreLabel>
                <ScoreDescription>
                  A higher score means more efficient load planning.
                </ScoreDescription>
              </ScoreInfo>
            </ScoreSection>

            {/* For each scoring factor, display the factor name, description, and impact */}
            <SectionTitle>
              <FiBarChart2 /> Scoring Factors
            </SectionTitle>
            <FactorsList>
              {optimizationDetails.scoringFactors.map((factor) => (
                <FactorItem key={factor.factor}>
                  <FactorInfo>
                    <FactorName>{factor.factor}</FactorName>
                    <FactorDescription>{factor.description}</FactorDescription>
                  </FactorInfo>
                  <FactorImpact impact={factor.impact}>
                    {formatImpact(factor.impact)}
                  </FactorImpact>
                </FactorItem>
              ))}
            </FactorsList>

            {/* Show recommended drivers with their efficiency scores */}
            {optimizationDetails.recommendedDrivers && optimizationDetails.recommendedDrivers.length > 0 && (
              <>
                <SectionTitle>
                  <FiTruck /> Recommended Drivers
                </SectionTitle>
                <DriversList>
                  {optimizationDetails.recommendedDrivers.map((driver) => (
                    <DriverItem key={driver.id}>
                      <DriverInfo>
                        <DriverName>{driver.name}</DriverName>
                        <DriverDetails>
                          {driver.carrierName} - {driver.status}
                        </DriverDetails>
                      </DriverInfo>
                      <DriverScore score={driver.efficiencyScore}>
                        {driver.efficiencyScore}
                      </DriverScore>
                    </DriverItem>
                  ))}
                </DriversList>
              </>
            )}

            {/* Display nearby Smart Hubs if available */}
            {optimizationDetails.nearbySmartHubs && optimizationDetails.nearbySmartHubs.length > 0 && (
              <>
                <SectionTitle>
                  <FiMapPin /> Nearby Smart Hubs
                </SectionTitle>
                <HubsList>
                  {optimizationDetails.nearbySmartHubs.map((hub) => (
                    <HubItem key={hub.id}>
                      <HubInfo>
                        <HubName>{hub.name}</HubName>
                        <HubAddress>{hub.address}</HubAddress>
                      </HubInfo>
                      <HubScore score={hub.efficiencyScore}>
                        {hub.efficiencyScore}
                      </HubScore>
                    </HubItem>
                  ))}
                </HubsList>
              </>
            )}

            {/* Show relay options if the load is relay eligible */}
            {optimizationDetails.relayEligible && optimizationDetails.relayOptions && optimizationDetails.relayOptions.length > 0 && (
              <>
                <SectionTitle>
                  <FiTruck /> Relay Options
                </SectionTitle>
                <RelayOptionsList>
                  {optimizationDetails.relayOptions.map((option) => (
                    <RelayOptionItem key={option.optionId}>
                      <RelayOptionHeader>
                        <RelayOptionTitle>Relay Option {option.optionId}</RelayOptionTitle>
                        <RelayOptionSavings>
                          Savings: ${formatNumber(option.estimatedSavings)}
                        </RelayOptionSavings>
                      </RelayOptionHeader>
                      <RelayOptionDetails>
                        {option.segmentCount} Segments - {option.exchangePoints.length} Exchange Points
                      </RelayOptionDetails>
                    </RelayOptionItem>
                  ))}
                </RelayOptionsList>
              </>
            )}

            {/* Include estimated empty miles, fuel consumption, and CO2 emissions */}
            <MetricsSection>
              <MetricItem>
                <MetricLabel>Estimated Empty Miles</MetricLabel>
                <MetricValue>{formatNumber(optimizationDetails.estimatedEmptyMiles)} miles</MetricValue>
              </MetricItem>
              <MetricItem>
                <MetricLabel>Estimated Fuel Consumption</MetricLabel>
                <MetricValue>{formatNumber(optimizationDetails.estimatedFuelConsumption)} gallons</MetricValue>
              </MetricItem>
            </MetricsSection>

            <ActionContainer>
              <Button variant="secondary">Dismiss</Button>
              <Button
                variant="primary"
                startIcon={<FiCheckCircle />}
                onClick={() => handleApplyRecommendation(optimizationDetails.loadId)}
              >
                Apply Recommendation
              </Button>
            </ActionContainer>
          </>
        ) : (
          <EmptyContainer>
            No optimization recommendations available for this load.
          </EmptyContainer>
        )}
      </Card>
    </Container>
  );
};

export default OptimizationRecommendationsList;