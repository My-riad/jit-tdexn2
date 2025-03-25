import React, { useEffect, useState } from 'react';
import styled from 'styled-components'; // version ^5.3.6
import { ChartBarIcon, TruckIcon, GlobeAltIcon } from '@heroicons/react/24/outline'; // version ^2.0.13
import Card from '../../../shared/components/cards/Card';
import StatsCard from '../../../shared/components/cards/StatsCard';
import ProgressBar from '../../../shared/components/feedback/ProgressBar';
import Button from '../../../shared/components/buttons/Button';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { getEfficiencyMetrics } from '../../services/analyticsService';
import { theme } from '../../../shared/styles/theme';
import { EfficiencyMetricsCardProps, EfficiencyMetricsData } from '../../../shared/types/analytics';

/**
 * Styled wrapper for the efficiency metrics card
 */
const StyledEfficiencyMetricsCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

/**
 * Styled component for the card title
 */
const CardTitle = styled.h2`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.bold};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
`;

/**
 * Container for the efficiency score section
 */
const ScoreContainer = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Header for the efficiency score section
 */
const ScoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.sm};
`;

/**
 * Label for the efficiency score
 */
const ScoreLabel = styled.span`
  font-size: ${theme.typography.fontSize.md};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
`;

/**
 * Value display for the efficiency score
 */
const ScoreValue = styled.span`
  font-size: ${theme.typography.fontSize.md};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.primary.main};
`;

/**
 * Grid container for the stats cards
 */
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Footer section of the card with action button
 */
const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: ${theme.spacing.md};
`;

/**
 * Component that displays efficiency metrics for the carrier's fleet
 */
const EfficiencyMetricsCard: React.FC<EfficiencyMetricsCardProps> = ({
  className,
  carrierId,
  onViewDetails,
}) => {
  // Initialize state for efficiency metrics data with default values
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetricsData>({
    fleetScore: 0,
    emptyMiles: 0,
    networkContribution: 0,
    targetScore: 100,
    previousScore: 0,
    previousEmptyMiles: 0,
    previousNetworkContribution: 0,
  });

  // Create a loading state to handle data fetching
  const [loading, setLoading] = useState(true);

  /**
   * Use useEffect to fetch efficiency metrics data when component mounts
   */
  useEffect(() => {
    // Call getEfficiencyMetrics service function to retrieve data from API
    const fetchMetrics = async () => {
      try {
        if (carrierId) {
          const data = await getEfficiencyMetrics({ carrierId });
          // Update state with fetched data and set loading to false
          setEfficiencyMetrics(data);
          setLoading(false);
        }
      } catch (error) {
        // Handle any errors during data fetching
        console.error('Failed to fetch efficiency metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [carrierId]);

  /**
   * Helper function to format percentage values
   */
  const formatPercentage = (value: number): string => {
    // Round the value to one decimal place
    const roundedValue = Math.round(value * 10) / 10;
    // Append a % symbol
    return `${roundedValue}%`;
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <Card className={className} style={{ height: '100%' }}>
        <LoadingIndicator label="Loading Efficiency Metrics..." fullPage={false} />
      </Card>
    );
  }

  return (
    <Card className={className} style={{ height: '100%' }}>
      <StyledEfficiencyMetricsCard>
        <CardTitle>Efficiency Metrics</CardTitle>

        {/* Display the fleet efficiency score with a ProgressBar component */}
        <ScoreContainer>
          <ScoreHeader>
            <ScoreLabel>Fleet Efficiency Score</ScoreLabel>
            <ScoreValue>{efficiencyMetrics.fleetScore}</ScoreValue>
          </ScoreHeader>
          <ProgressBar
            value={efficiencyMetrics.fleetScore}
            max={efficiencyMetrics.targetScore}
            showLabel
          />
        </ScoreContainer>

        {/* Display StatsCard for empty miles percentage with appropriate icon */}
        <StatsContainer>
          <StatsCard
            title="Empty Miles"
            value={formatPercentage(efficiencyMetrics.emptyMiles)}
            trend={efficiencyMetrics.emptyMiles - efficiencyMetrics.previousEmptyMiles}
            icon={<TruckIcon />}
            higherIsBetter={false}
          />

          {/* Display StatsCard for network contribution with appropriate icon */}
          <StatsCard
            title="Network Contribution"
            value={efficiencyMetrics.networkContribution}
            trend={efficiencyMetrics.networkContribution - efficiencyMetrics.previousNetworkContribution}
            icon={<GlobeAltIcon />}
            higherIsBetter={true}
          />
        </StatsContainer>

        {/* Add a View Details button that navigates to the analytics page */}
        <CardFooter>
          <Button variant="secondary" onClick={onViewDetails}>
            View Details
          </Button>
        </CardFooter>
      </StyledEfficiencyMetricsCard>
    </Card>
  );
};

export default EfficiencyMetricsCard;