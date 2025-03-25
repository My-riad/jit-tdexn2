import React, { useState, useEffect } from 'react'; // React, { useState, useEffect } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import Card from '../../../shared/components/cards/Card';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import Button from '../../../shared/components/buttons/Button';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Badge from '../../../shared/components/feedback/Badge';
import CarrierPerformanceMetrics from './CarrierPerformanceMetrics';
import PricingDetailsCard from './PricingDetailsCard';
import {
  Carrier,
  CarrierRecommendation,
  CarrierPerformanceMetrics as CarrierMetrics,
} from '../../../common/interfaces/carrier.interface';
import { Load } from '../../../common/interfaces/load.interface';
import {
  getCarrierDetails,
  getCarrierPerformanceMetrics,
  getCarrierNetworkStats,
} from '../../services/carrierService';
import { formatCurrency, formatPercentage } from '../../../common/utils/formatters';
import { theme } from '../../../shared/styles/theme';

// Helper function to determine color based on carrier safety rating
const getSafetyRatingColor = (rating: string) => {
  switch (rating.toLowerCase()) {
    case 'satisfactory':
      return theme.colors.success.main;
    case 'conditional':
      return theme.colors.warning.main;
    case 'unsatisfactory':
      return theme.colors.error.main;
    default:
      return theme.colors.text.secondary;
  }
};

// Styled Card component with custom styling for carrier details
const StyledCard = styled(Card)`
  border: 2px solid
    ${({ selected }) => (selected ? theme.colors.primary.main : 'transparent')};
  margin-bottom: ${theme.spacing.md};
  transition: border-color 0.2s ease;
  width: 100%;
`;

// Styled header section for the carrier card
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

// Styled content section for the carrier card
const CardContent = styled.div`
  padding: ${theme.spacing.md};
`;

// Styled section within the card content
const CardSection = styled.div`
  margin-bottom: ${theme.spacing.md};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

// Styled grid for displaying key metrics
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

// Styled container for individual metrics
const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

// Styled text for metric labels
const MetricLabel = styled(Text)`
  color: ${theme.colors.text.secondary};
  font-size: 0.875rem;
  margin-bottom: ${theme.spacing.xs};
`;

// Styled text for metric values
const MetricValue = styled(Text)`
  font-weight: bold;
  font-size: 1.125rem;
  color: ${theme.colors.text.primary};
`;

// Styled container for carrier information
const CarrierInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

// Styled heading for carrier name
const CarrierName = styled(Heading)`
  margin: 0;
  font-size: 1.25rem;
`;

// Styled badge for safety rating
const SafetyRating = styled(Badge)`
  margin-left: ${theme.spacing.sm};
`;

// Styled container for action buttons
const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  justify-content: flex-end;
`;

// Interface defining the props for the CarrierDetailCard component
interface CarrierDetailCardProps {
  carrierId: string;
  load?: Load;
  onSelect?: () => void;
  onNegotiateRate?: () => void;
  selected?: boolean;
  className?: string;
  recommendation?: CarrierRecommendation;
}

/**
 * Component that displays detailed information about a carrier
 */
const CarrierDetailCard: React.FC<CarrierDetailCardProps> = ({
  carrierId,
  load,
  onSelect,
  onNegotiateRate,
  selected,
  className,
  recommendation,
}) => {
  // State for storing carrier details
  const [carrier, setCarrier] = useState<Carrier | null>(null);
  // State for storing carrier performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState<CarrierMetrics | null>(null);
  // State for storing carrier network statistics
  const [networkStats, setNetworkStats] = useState<CarrierNetworkStatistics | null>(null);
  // State for tracking loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State for tracking errors
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to fetch carrier data when the component mounts or when the carrierId prop changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch carrier details
        const carrierData = await getCarrierDetails(carrierId);
        setCarrier(carrierData);

        // Fetch carrier performance metrics
        const performanceData = await getCarrierPerformanceMetrics(carrierId);
        setPerformanceMetrics(performanceData);

        // Fetch carrier network statistics
        const networkData = await getCarrierNetworkStats(carrierId);
        setNetworkStats(networkData);
      } catch (err) {
        setError('Failed to load carrier details. Please try again.');
        console.error('Error fetching carrier details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carrierId]);

  // Render loading state
  if (loading) {
    return <div>Loading carrier details...</div>;
  }

  // Render error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Render carrier details
  return (
    <StyledCard selected={selected} className={className} onClick={onSelect}>
      {carrier && (
        <>
          <CardHeader>
            <CarrierInfo>
              <CarrierName>{carrier.name}</CarrierName>
              <Text variant="bodySmall">DOT: {carrier.dotNumber}</Text>
            </CarrierInfo>
            <SafetyRating variant={carrier.safetyRating.toLowerCase() as any}>
              {carrier.safetyRating}
            </SafetyRating>
          </CardHeader>
          <CardContent>
            <CardSection>
              <Text>Type: {carrier.carrierType}</Text>
              <Text>Fleet Size: {carrier.fleetSize}</Text>
            </CardSection>

            {performanceMetrics && (
              <MetricsGrid>
                <MetricItem>
                  <MetricLabel>Efficiency Score</MetricLabel>
                  <MetricValue>{formatPercentage(performanceMetrics.fleetEfficiencyScore)}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>On-Time %</MetricLabel>
                  <MetricValue>{formatPercentage(performanceMetrics.onTimeDeliveryPercentage)}</MetricValue>
                </MetricItem>
              </MetricsGrid>
            )}

            {networkStats && (
              <CardSection>
                <Text>Network Contribution Score: {networkStats.networkContributionScore}</Text>
                <Text>Empty Miles Reduction: {networkStats.fuelGallonsSaved}</Text>
              </CardSection>
            )}

            {load && (
              <PricingDetailsCard load={load} carrierRecommendation={recommendation} />
            )}

            <ActionButtons>
              <Button variant="primary" onClick={onSelect}>
                Select Carrier
              </Button>
              {onNegotiateRate && (
                <Button variant="secondary" onClick={onNegotiateRate}>
                  Negotiate Rate
                </Button>
              )}
            </ActionButtons>
          </CardContent>
        </>
      )}
    </StyledCard>
  );
};

export default CarrierDetailCard;