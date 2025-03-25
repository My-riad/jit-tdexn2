# src/web/carrier-portal/src/components/loads/LoadDetailCard.tsx
```typescript
import React from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import {
  Card,
} from '../../../shared/components/cards/Card';
import LoadStatusTimeline from './LoadStatusTimeline';
import {
  LoadWithDetails,
  LoadStatus,
  EquipmentType,
} from '../../../common/interfaces/load.interface';
import {
  Driver,
} from '../../../common/interfaces/driver.interface';
import {
  Vehicle,
} from '../../../common/interfaces/vehicle.interface';
import {
  Badge,
} from '../../../shared/components/feedback';
import {
  Button,
} from '../../../shared/components/buttons';
import {
  Heading,
  Text,
} from '../../../shared/components/typography';
import {
  formatDateTime,
} from '../../../common/utils/dateTimeUtils';
import {
  formatCurrency,
  formatWeight,
  formatDistance,
} from '../../../common/utils/formatters';
import {
  FaTruck,
  FaWarehouse,
  FaUser,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa'; // react-icons/fa ^4.10.0

// Define the props for the LoadDetailCard component
export interface LoadDetailCardProps {
  load: LoadWithDetails;
  onEdit: () => void;
  onAssign: () => void;
  onUpdateStatus: () => void;
  onViewDocuments: () => void;
  onViewMap: () => void;
  className?: string;
}

// Helper function to convert equipment type enum value to a human-readable label
const getEquipmentTypeLabel = (EquipmentType: EquipmentType): string => {
  switch (EquipmentType) {
    case EquipmentType.DRY_VAN:
      return 'Dry Van';
    case EquipmentType.REFRIGERATED:
      return 'Refrigerated';
    case EquipmentType.FLATBED:
      return 'Flatbed';
    default:
      return EquipmentType;
  }
};

// Helper function to format a load location into a readable address string
const getLoadLocationLabel = (location: any): string => {
  const { city, state, zipCode } = location.address;
  return `${city}, ${state} ${zipCode}`;
};

// Styled div for card content with consistent padding
const StyledCardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

// Styled header section with load ID and status
const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

// Styled section for grouping related information
const StyledSection = styled.div`
  margin-bottom: 1.5rem;
`;

// Styled title for each section
const StyledSectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.primary.dark};
`;

// Styled grid for displaying load information in columns
const StyledInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

// Styled container for individual info items
const StyledInfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

// Styled label for info items
const StyledInfoLabel = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.neutral.dark};
  margin-bottom: 0.25rem;
`;

// Styled value for info items
const StyledInfoValue = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

// Styled card for location information
const StyledLocationCard = styled.div`
  padding: 1rem;
  border: 1px solid ${props => props.theme.colors.neutral.light};
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

// Styled container for location icon
const StyledLocationIcon = styled.div<{ type: string }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${props => props.type === 'pickup' ? props.theme.colors.semantic.success : props.theme.colors.primary.main};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

// Styled container for location content
const StyledLocationContent = styled.div`
  flex: 1;
`;

// Styled container for driver information
const StyledDriverInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid ${props => props.theme.colors.neutral.light};
  border-radius: 0.5rem;
`;

// Styled container for driver avatar
const StyledDriverAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: ${props => props.theme.colors.neutral.light};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.neutral.dark};
`;

// Styled container for driver details
const StyledDriverDetails = styled.div`
  flex: 1;
`;

// Styled container for driver contact information
const StyledDriverContact = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

// Styled container for contact item
const StyledContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
`;

// Styled container for efficiency score display
const StyledEfficiencyScore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Helper function to determine the color of the score circle based on the score value
const getScoreColor = (score: number): string => {
    if (score >= 90) return '#34A853'; // Green for excellent
    if (score >= 80) return '#FBBC04'; // Yellow for good
    return '#EA4335'; // Red for poor
};

// Styled circle for efficiency score
const StyledScoreCircle = styled.div<{ score: number }>`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: ${props => getScoreColor(props.score)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
`;

// Styled container for action buttons
const StyledActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
`;

// LoadDetailCard component definition
export const LoadDetailCard: React.FC<LoadDetailCardProps> = ({
  load,
  onEdit,
  onAssign,
  onUpdateStatus,
  onViewDocuments,
  onViewMap,
  className,
}) => {
  // Render the LoadDetailCard component
  return (
    <Card className={className}>
      <StyledCardContent>
        <StyledHeader>
          <Heading level={4}>Load ID: {load.id}</Heading>
          <Badge variant="info">{load.status}</Badge>
        </StyledHeader>

        <StyledSection>
          <StyledSectionTitle>Load Information</StyledSectionTitle>
          <StyledInfoGrid>
            <StyledInfoItem>
              <StyledInfoLabel>Reference Number</StyledInfoLabel>
              <StyledInfoValue>{load.referenceNumber}</StyledInfoValue>
            </StyledInfoItem>
            <StyledInfoItem>
              <StyledInfoLabel>Equipment Type</StyledInfoLabel>
              <StyledInfoValue>{getEquipmentTypeLabel(load.equipmentType)}</StyledInfoValue>
            </StyledInfoItem>
            <StyledInfoItem>
              <StyledInfoLabel>Weight</StyledInfoLabel>
              <StyledInfoValue>{formatWeight(load.weight)}</StyledInfoValue>
            </StyledInfoItem>
            <StyledInfoItem>
              <StyledInfoLabel>Dimensions</StyledInfoLabel>
              <StyledInfoValue>{load.dimensions ? `${load.dimensions.length}x${load.dimensions.width}x${load.dimensions.height}` : 'N/A'}</StyledInfoValue>
            </StyledInfoItem>
          </StyledInfoGrid>
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Locations</StyledSectionTitle>
          {load.locations.map(location => (
            <StyledLocationCard key={location.id} type={location.locationType}>
              <StyledLocationIcon type={location.locationType}>
                {location.locationType === 'pickup' ? <FaTruck /> : <FaWarehouse />}
              </StyledLocationIcon>
              <StyledLocationContent>
                <Heading level={5}>{location.facilityName}</Heading>
                <Text>{getLoadLocationLabel(location)}</Text>
                <Text>{formatDateTime(location.earliestTime)} - {formatDateTime(location.latestTime)}</Text>
              </StyledLocationContent>
            </StyledLocationCard>
          ))}
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Assignment</StyledSectionTitle>
          {load.assignments && load.assignments.length > 0 ? (
            load.assignments.map(assignment => (
              <StyledDriverInfo key={assignment.id}>
                <StyledDriverAvatar>
                  <FaUser />
                </StyledDriverAvatar>
                <StyledDriverDetails>
                  <Heading level={5}>Driver Name</Heading>
                  <StyledDriverContact>
                    <StyledContactItem>
                      <FaPhone />
                      (123) 456-7890
                    </StyledContactItem>
                    <StyledContactItem>
                      <FaEnvelope />
                      driver@example.com
                    </StyledContactItem>
                  </StyledDriverContact>
                </StyledDriverDetails>
              </StyledDriverInfo>
            ))
          ) : (
            <Text>No driver assigned</Text>
          )}
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Efficiency Score</StyledSectionTitle>
          <StyledEfficiencyScore>
            <StyledScoreCircle score={load.efficiencyScore}>{load.efficiencyScore}</StyledScoreCircle>
            <Text>This load has an efficiency score of {load.efficiencyScore}.</Text>
          </StyledEfficiencyScore>
        </StyledSection>

        <StyledSection>
          <StyledSectionTitle>Status Timeline</StyledSectionTitle>
          <LoadStatusTimeline statusHistory={load.statusHistory} isLoading={false} compact={false} />
        </StyledSection>

        <StyledActionButtons>
          <Button variant="secondary" onClick={onEdit}>Edit</Button>
          <Button variant="primary" onClick={onAssign}>Assign</Button>
        </StyledActionButtons>
      </StyledCardContent>
    </Card>
  );
};