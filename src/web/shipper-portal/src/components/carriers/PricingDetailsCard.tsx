import React from 'react';
import styled from 'styled-components';
import Card from '../../../shared/components/cards/Card';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import Button from '../../../shared/components/buttons/Button';
import FlexBox from '../../../shared/components/layout/FlexBox';
import { Load } from '../../../common/interfaces/load.interface';
import { CarrierRecommendation } from '../../../common/interfaces/carrier.interface';
import { formatCurrency } from '../../../common/utils/formatters';
import { theme } from '../../../shared/styles/theme';

// Interface for the component props
interface PricingDetailsCardProps {
  load: Load;
  carrierRecommendation: CarrierRecommendation;
  onNegotiateRate?: () => void;
  className?: string;
}

// Interface for rate breakdown
interface RateBreakdown {
  baseRate: number;
  fuelSurcharge: number;
  accessorials: number;
}

// Helper function to calculate rate breakdown
const calculateRateBreakdown = (totalRate: number): RateBreakdown => {
  // Calculate approximate breakdown based on industry averages
  const baseRate = totalRate * 0.85; // ~85% of total rate
  const fuelSurcharge = totalRate * 0.12; // ~12% of total rate
  const accessorials = totalRate * 0.03; // ~3% of total rate
  
  return {
    baseRate,
    fuelSurcharge,
    accessorials
  };
};

// Helper function to calculate market rate range
const calculateMarketRateRange = (baseRate: number): { min: number; max: number } => {
  // Calculate market rate range based on base rate
  const min = baseRate * 0.9; // 10% below base rate
  const max = baseRate * 1.1; // 10% above base rate
  
  return { min, max };
};

// Styled components
const StyledCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  background-color: ${({ theme }) => theme.colors.background.light};
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const PriceRow = styled(FlexBox)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const PriceLabel = styled(Text)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const PriceValue = styled(Text)`
  font-weight: bold;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const MarketRateRange = styled.div`
  background-color: ${({ theme }) => theme.colors.background.light};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const RateBreakdownSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const PricingDetailsCard: React.FC<PricingDetailsCardProps> = ({
  load,
  carrierRecommendation,
  onNegotiateRate,
  className
}) => {
  // Calculate market rate range based on load data
  const marketRateRange = calculateMarketRateRange(load.offeredRate);
  
  // Calculate rate breakdown
  const rateBreakdown = calculateRateBreakdown(carrierRecommendation.price);
  
  // Calculate distance based on load information
  // In a real implementation, this would be calculated using the coordinates or provided directly
  let distanceEstimate = 0;
  
  // Try to get distance from carrier recommendation if available
  if (carrierRecommendation.distance && typeof carrierRecommendation.distance === 'number') {
    distanceEstimate = carrierRecommendation.distance;
  }
  // If not available, could calculate from load origin/destination (simplified here)
  else {
    // In a real implementation, would use a mapping service or haversine formula
    // For now, just use a placeholder distance
    distanceEstimate = 300; // Placeholder: 300 miles
  }
  
  // Calculate rate per mile
  const ratePerMile = distanceEstimate > 0 
    ? formatCurrency(carrierRecommendation.price / distanceEstimate) 
    : 'N/A';

  return (
    <StyledCard className={className}>
      <CardHeader>
        <Heading level={4} noMargin>PRICING DETAILS</Heading>
      </CardHeader>
      
      <CardContent>
        <MarketRateRange>
          <PriceLabel>Market Rate</PriceLabel>
          <PriceValue>
            {formatCurrency(marketRateRange.min)} - {formatCurrency(marketRateRange.max)}
          </PriceValue>
        </MarketRateRange>
        
        <PriceRow>
          <PriceLabel>Carrier Quote</PriceLabel>
          <PriceValue>{formatCurrency(carrierRecommendation.price)}</PriceValue>
        </PriceRow>
        
        <RateBreakdownSection>
          <Heading level={5}>Rate Breakdown</Heading>
          
          <PriceRow>
            <PriceLabel>Base Rate</PriceLabel>
            <PriceValue>{formatCurrency(rateBreakdown.baseRate)}</PriceValue>
          </PriceRow>
          
          <PriceRow>
            <PriceLabel>Fuel Surcharge</PriceLabel>
            <PriceValue>{formatCurrency(rateBreakdown.fuelSurcharge)}</PriceValue>
          </PriceRow>
          
          <PriceRow>
            <PriceLabel>Accessorials</PriceLabel>
            <PriceValue>{formatCurrency(rateBreakdown.accessorials)}</PriceValue>
          </PriceRow>
          
          <PriceRow>
            <PriceLabel>Rate per Mile</PriceLabel>
            <PriceValue>{ratePerMile}</PriceValue>
          </PriceRow>
        </RateBreakdownSection>
        
        {onNegotiateRate && (
          <ActionButtons>
            <Button variant="secondary" onClick={onNegotiateRate}>
              Negotiate Rate
            </Button>
          </ActionButtons>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default PricingDetailsCard;