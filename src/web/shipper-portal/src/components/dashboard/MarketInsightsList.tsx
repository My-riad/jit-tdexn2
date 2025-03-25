# src/web/shipper-portal/src/components/dashboard/MarketInsightsList.tsx
```typescript
import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.10.0
import { TrendingUpIcon, TrendingDownIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline'; // version ^2.0.13

import Card from '../../../../shared/components/cards/Card';
import LoadingIndicator from '../../../../shared/components/feedback/LoadingIndicator';
import Button from '../../../../shared/components/buttons/Button';
import { getMarketInsights } from '../../services/analyticsService';
import { theme } from '../../../../shared/styles/theme';
import { SHIPPER_PORTAL_ROUTES } from '../../../../common/constants/routes';

/**
 * Interface defining the structure of market insights data
 */
interface MarketInsights {
  trends: Array<{ lane: string; trend: string; percentage: number; recommendation: string }>;
  capacityAlerts: Array<{ region: string; timeframe: string; severity: string; details: string }>;
  opportunities: Array<{ description: string; potentialSavings: number }>;
}

/**
 * Interface defining the props for the MarketInsightsList component
 */
interface MarketInsightsListProps {
  shipperId: string;
  maxItems?: number;
  className?: string;
}

/**
 * Styled component for the card header
 */
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing(2)};
  border-bottom: 1px solid ${theme.colors.divider};
`;

/**
 * Styled component for the card title
 */
const CardTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: ${theme.colors.text.primary};
`;

/**
 * Styled component for the card content
 */
const CardContent = styled.div`
  padding: ${theme.spacing(2)};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(2)};
`;

/**
 * Styled component for the section title
 */
const SectionTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing(1)};
`;

/**
 * Styled component for individual insight items
 */
const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: ${theme.spacing(1)} 0;
  border-bottom: 1px solid ${theme.colors.divider};

  &:last-child {
    border-bottom: none;
  }
`;

/**
 * Styled component for the insight icon container
 */
const InsightIcon = styled.div`
  margin-right: ${theme.spacing(1.5)};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

/**
 * Styled component for the insight content container
 */
const InsightContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/**
 * Styled component for the insight title
 */
const InsightTitle = styled.div`
  font-weight: 500;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing(0.5)};
`;

/**
 * Styled component for the insight details
 */
const InsightDetails = styled.div`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled component for the insight metric
 */
const InsightMetric = styled.div<{ color?: string }>`
  font-weight: 500;
  color: ${props => props.color || theme.colors.primary.main};
  display: flex;
  align-items: center;
  gap: ${theme.spacing(0.5)};
`;

/**
 * Styled component for the severity indicator
 */
const SeverityIndicator = styled.span<{ severity: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: ${theme.spacing(1)};
  background-color: ${props => getSeverityColor(props.severity)};
`;

/**
 * Styled component for the empty state
 */
const EmptyState = styled.div`
  padding: ${theme.spacing(3)};
  text-align: center;
  color: ${theme.colors.text.secondary};
`;

/**
 * Styled component for the error state
 */
const ErrorState = styled.div`
  padding: ${theme.spacing(2)};
  color: ${theme.colors.error.main};
  text-align: center;
`;

/**
 * Styled component for the view all button
 */
const ViewAllButton = styled.div`
  display: flex;
  justify-content: center;
  padding: ${theme.spacing(1)} 0;
`;

/**
 * Fetches market insights data from the analytics service
 * @param shipperId The ID of the shipper to fetch insights for
 */
const fetchMarketInsights = async (shipperId: string) => {
  setLoading(true);
  try {
    const data = await getMarketInsights(shipperId);
    setInsights(data);
  } catch (error: any) {
    setError(error.message || 'Failed to fetch market insights.');
  } finally {
    setLoading(false);
  }
};

/**
 * Handles navigation to the full market insights page
 */
const handleViewAllInsights = () => {
  navigate(`${SHIPPER_PORTAL_ROUTES.ANALYTICS}?tab=market-insights`);
};

/**
 * Returns the appropriate icon based on trend direction
 * @param trend The trend direction ('increasing', 'decreasing')
 */
const getTrendIcon = (trend: string): JSX.Element | null => {
  if (trend === 'increasing') {
    return <TrendingUpIcon style={{ color: theme.colors.semantic.success }} />;
  }
  if (trend === 'decreasing') {
    return <TrendingDownIcon style={{ color: theme.colors.semantic.error }} />;
  }
  return null;
};

/**
 * Returns the appropriate color based on alert severity
 * @param severity The alert severity ('critical', 'high', 'medium', 'low')
 */
const getSeverityColor = (severity: string): string => {
  if (severity === 'critical') {
    return theme.colors.error.main;
  }
  if (severity === 'high') {
    return theme.colors.warning.main;
  }
  if (severity === 'medium') {
    return theme.colors.warning.light;
  }
  if (severity === 'low') {
    return theme.colors.info.main;
  }
  return theme.colors.text.secondary;
};

/**
 * Component that displays market insights and trends for the shipper
 * @param props The component props
 */
const MarketInsightsList: React.FC<MarketInsightsListProps> = ({ shipperId, maxItems = 3, className }) => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipperId) {
      fetchMarketInsights(shipperId);
    }
  }, [shipperId]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Market Insights</CardTitle>
        <Button variant="text" onClick={handleViewAllInsights}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {loading && <LoadingIndicator />}
        {error && <ErrorState>{error}</ErrorState>}
        {insights && (
          <>
            {insights.trends && insights.trends.length > 0 && (
              <>
                <SectionTitle>Rate Trends</SectionTitle>
                {insights.trends.slice(0, maxItems).map((trend, index) => (
                  <InsightItem key={`trend-${index}`}>
                    <InsightIcon>{getTrendIcon(trend.trend)}</InsightIcon>
                    <InsightContent>
                      <InsightTitle>{trend.lane}</InsightTitle>
                      <InsightDetails>{trend.recommendation}</InsightDetails>
                      <InsightMetric>
                        {trend.trend === 'increasing' ? '+' : '-'}
                        {trend.percentage}%
                      </InsightMetric>
                    </InsightContent>
                  </InsightItem>
                ))}
                {insights.trends.length > maxItems && (
                  <ViewAllButton>
                    <Button variant="text" onClick={handleViewAllInsights}>
                      View All Rate Trends
                    </Button>
                  </ViewAllButton>
                )}
              </>
            )}

            {insights.capacityAlerts && insights.capacityAlerts.length > 0 && (
              <>
                <SectionTitle>Capacity Alerts</SectionTitle>
                {insights.capacityAlerts.slice(0, maxItems).map((alert, index) => (
                  <InsightItem key={`alert-${index}`}>
                    <InsightIcon>
                      <ExclamationTriangleIcon style={{ color: getSeverityColor(alert.severity) }} />
                    </InsightIcon>
                    <InsightContent>
                      <InsightTitle>{alert.region}</InsightTitle>
                      <InsightDetails>
                        <SeverityIndicator severity={alert.severity} />
                        {alert.details}
                      </InsightDetails>
                    </InsightContent>
                  </InsightItem>
                ))}
                {insights.capacityAlerts.length > maxItems && (
                  <ViewAllButton>
                    <Button variant="text" onClick={handleViewAllInsights}>
                      View All Capacity Alerts
                    </Button>
                  </ViewAllButton>
                )}
              </>
            )}

            {insights.opportunities && insights.opportunities.length > 0 && (
              <>
                <SectionTitle>Optimization Opportunities</SectionTitle>
                {insights.opportunities.slice(0, maxItems).map((opportunity, index) => (
                  <InsightItem key={`opportunity-${index}`}>
                    <InsightIcon>
                      <LightBulbIcon style={{ color: theme.colors.semantic.info }} />
                    </InsightIcon>
                    <InsightContent>
                      <InsightTitle>Potential Savings: ${opportunity.potentialSavings}</InsightTitle>
                      <InsightDetails>{opportunity.description}</InsightDetails>
                    </InsightContent>
                  </InsightItem>
                ))}
                {insights.opportunities.length > maxItems && (
                  <ViewAllButton>
                    <Button variant="text" onClick={handleViewAllInsights}>
                      View All Optimization Opportunities
                    </Button>
                  </ViewAllButton>
                )}
              </>
            )}

            {!insights.trends?.length &&
              !insights.capacityAlerts?.length &&
              !insights.opportunities?.length && (
                <EmptyState>No market insights available.</EmptyState>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketInsightsList;