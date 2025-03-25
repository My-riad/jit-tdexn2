import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import Card from '../../../../shared/components/cards/Card';
import Button from '../../../../shared/components/buttons/Button';
import { theme } from '../../../../shared/styles/theme';
import {
  getOptimizationRecommendations,
  applyOptimizationRecommendation,
  OptimizationRecommendation,
} from '../../services/optimizationService';

/**
 * Props for the OptimizationOpportunitiesList component
 */
interface OptimizationOpportunitiesListProps {
  carrierId: string;
  limit: number;
  onViewAllClick: () => void;
  onApplyRecommendation: (recommendationId: string) => void;
}

/**
 * Header section of the optimization opportunities card
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Title for the optimization opportunities card
 */
const CardTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * Container for the list of optimization opportunities
 */
const OpportunityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

/**
 * Individual optimization opportunity item
 */
const OpportunityItem = styled.div`
  padding: ${theme.spacing.sm};
  border-radius: 8px;
  background-color: ${theme.colors.background.light};
  border-left: 3px solid ${theme.colors.primary.main};
`;

/**
 * Description text for an optimization opportunity
 */
const OpportunityDescription = styled.p`
  margin: 0 0 ${theme.spacing.sm} 0;
  font-size: 0.9rem;
  color: ${theme.colors.text.primary};
`;

/**
 * Container for displaying estimated savings
 */
const OpportunitySavings = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Label for estimated savings
 */
const SavingsLabel = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
`;

/**
 * Amount text for estimated savings
 */
const SavingsAmount = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.success.main};
`;

/**
 * Text for empty miles reduction
 */
const EmptyMilesReduction = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.text.secondary};
  margin-left: ${theme.spacing.sm};
`;

/**
 * Container for opportunity action buttons
 */
const OpportunityActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
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
 * Container for the View All button
 */
const ViewAllContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${theme.spacing.md};
`;

/**
 * Component that displays a list of AI-generated optimization opportunities for carriers
 */
const OptimizationOpportunitiesList: React.FC<OptimizationOpportunitiesListProps> = ({
  carrierId,
  limit,
  onViewAllClick,
  onApplyRecommendation,
}) => {
  // Initialize state for recommendations, loading state, and error state
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch optimization recommendations when component mounts or carrierId changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOptimizationRecommendations(carrierId);
        setRecommendations(data.slice(0, limit));
      } catch (e: any) {
        setError(e.message || 'Failed to fetch optimization recommendations.');
      } finally {
        setLoading(false);
      }
    };

    if (carrierId) {
      fetchRecommendations();
    }
  }, [carrierId, limit]);

  // Handle applying a recommendation when user clicks the Apply button
  const handleApply = async (recommendationId: string) => {
    try {
      await applyOptimizationRecommendation(recommendationId);
      // Refresh recommendations after applying
      const data = await getOptimizationRecommendations(carrierId);
      setRecommendations(data.slice(0, limit));
      onApplyRecommendation(recommendationId);
    } catch (e: any) {
      setError(e.message || 'Failed to apply optimization recommendation.');
    }
  };

  // Render a Card component with a header and list of recommendations
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimization Opportunities</CardTitle>
      </CardHeader>
      {loading && (
        <LoadingContainer>
          Loading recommendations...
        </LoadingContainer>
      )}
      {error && (
        <ErrorContainer>
          Error: {error}
        </ErrorContainer>
      )}
      {!loading && !error && recommendations.length === 0 && (
        <EmptyContainer>
          No optimization opportunities available at this time.
        </EmptyContainer>
      )}
      {!loading && !error && recommendations.length > 0 && (
        <OpportunityList>
          {recommendations.map((recommendation) => (
            <OpportunityItem key={recommendation.id}>
              <OpportunityDescription>{recommendation.description}</OpportunityDescription>
              <OpportunitySavings>
                <SavingsLabel>Estimated Savings:</SavingsLabel>
                <SavingsAmount>${recommendation.estimatedSavings.toFixed(2)}</SavingsAmount>
                <EmptyMilesReduction>
                  Reduces empty miles by {recommendation.estimatedEmptyMilesReduction}%
                </EmptyMilesReduction>
              </OpportunitySavings>
              <OpportunityActions>
                <Button variant="secondary" onClick={() => handleApply(recommendation.id)}>
                  Apply
                </Button>
              </OpportunityActions>
            </OpportunityItem>
          ))}
        </OpportunityList>
      )}
      <ViewAllContainer>
        <Button variant="text" onClick={onViewAllClick}>
          View All Opportunities
        </Button>
      </ViewAllContainer>
    </Card>
  );
};

export default OptimizationOpportunitiesList;