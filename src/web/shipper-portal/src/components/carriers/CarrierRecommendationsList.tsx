import React from 'react'; // React v18.2.0
import { useState, useEffect } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import Card from '../../../shared/components/cards/Card';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import CarrierDetailCard from './CarrierDetailCard';
import { CarrierRecommendation } from '../../../common/interfaces/carrier.interface';
import { getRecommendedCarriersForLoad } from '../../services/carrierService';
import { theme } from '../../../shared/styles/theme';

// Interface defining the props for the CarrierRecommendationsList component
interface CarrierRecommendationsListProps {
  loadId: string;
  onSelectCarrier: (carrierId: string) => void;
  onNegotiateRate?: (carrierId: string) => void;
  selectedCarrierId?: string;
  className?: string;
}

// Styled Card component for the recommendations list
const StyledCard = styled(Card)`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
  overflow: hidden;
`;

// Styled header for the recommendations list
const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

// Styled content container for the recommendations list
const ListContent = styled.div`
  padding: ${theme.spacing.md};
`;

// Styled container for empty state message
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${theme.colors.text.secondary};
`;

// Styled container for each recommendation item
const RecommendationItem = styled.div`
  margin-bottom: ${theme.spacing.md};
  border: 2px solid transparent;
  border-radius: ${theme.borders.radius.md};
  transition: border-color 0.2s ease;

  &.selected {
    border-color: ${theme.colors.primary.main};
  }
`;

// Sorting options for carrier recommendations
const SORT_OPTIONS = {
  NETWORK_SCORE: 'networkScore',
  PRICE: 'price',
  ON_TIME: 'onTimePercentage',
  AVAILABILITY: 'availableTrucks',
};

/**
 * Formats the availability information for display
 */
const formatAvailability = (availableTrucks: number, location: string): string => {
  if (availableTrucks === 0) {
    return 'No trucks available';
  }
  return `${availableTrucks} trucks in ${location}`;
};

/**
 * Component that displays a list of recommended carriers for a specific load
 */
const CarrierRecommendationsList: React.FC<CarrierRecommendationsListProps> = ({
  loadId,
  onSelectCarrier,
  onNegotiateRate,
  selectedCarrierId,
  className,
}) => {
  // Initialize state for recommendations data
  const [recommendations, setRecommendations] = useState<CarrierRecommendation[]>([]);
  // Initialize loading state
  const [loading, setLoading] = useState<boolean>(true);
  // Initialize error state
  const [error, setError] = useState<string | null>(null);

  // Fetch recommended carriers when component mounts or loadId changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call getRecommendedCarriersForLoad service function with the loadId
        const { recommendations } = await getRecommendedCarriersForLoad(loadId);
        // Update state with the fetched recommendations
        setRecommendations(recommendations);
      } catch (err: any) {
        // Handle error states appropriately
        setError(err.message || 'Failed to load carrier recommendations. Please try again.');
      } finally {
        // Set loading state to false after fetching data or encountering an error
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [loadId]);

  // Render a loading indicator while data is being fetched
  if (loading) {
    return <LoadingIndicator fullPage={false} label="Loading Carrier Recommendations..." />;
  }

  // Render an error alert if there's an error fetching data
  if (error) {
    return <Alert severity="error" message={error} />;
  }

  // Render a message if no recommendations are available
  if (recommendations.length === 0) {
    return (
      <StyledCard>
        <EmptyState>
          <Heading level={4}>No Carrier Recommendations Available</Heading>
          <Text>There are currently no recommended carriers for this load.</Text>
        </EmptyState>
      </StyledCard>
    );
  }

  // Render the list of recommended carriers with their details
  return (
    <StyledCard className={className}>
      <ListHeader>
        <Heading level={5}>Recommended Carriers</Heading>
      </ListHeader>
      <ListContent>
        {recommendations.map((recommendation) => (
          <RecommendationItem
            key={recommendation.carrierId}
            className={selectedCarrierId === recommendation.carrierId ? 'selected' : ''}
          >
            {/* For each carrier, render a CarrierDetailCard component with carrier data */}
            <CarrierDetailCard
              carrierId={recommendation.carrierId}
              loadId={loadId}
              recommendation={recommendation}
              onSelect={() => onSelectCarrier(recommendation.carrierId)}
              onNegotiateRate={onNegotiateRate ? () => onNegotiateRate(recommendation.carrierId) : undefined}
              selected={selectedCarrierId === recommendation.carrierId}
            />
          </RecommendationItem>
        ))}
      </ListContent>
    </StyledCard>
  );
};

export default CarrierRecommendationsList;