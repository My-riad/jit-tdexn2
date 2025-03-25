import React, { useEffect, useState } from 'react'; // version ^18.0.0
import styled from 'styled-components'; // version ^5.3.5

import Card from '../../../shared/components/cards/Card';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Button from '../../../shared/components/buttons/Button';
import Badge from '../../../shared/components/feedback/Badge';
import icons, { DriverIcon, PhoneIcon, LocationIcon, EditIcon, TruckIcon, ClockIcon, StarIcon } from '../../../shared/assets/icons';
import { Driver, DriverStatus, HOSStatus, LicenseClass, LicenseEndorsement } from '../../../common/interfaces/driver.interface';
import { getDriverWithDetails, updateDriverStatus, assignVehicleToDriver, unassignVehicleFromDriver } from '../../services/driverService';

/**
 * Interface defining the props for the DriverDetailCard component.
 * Includes driver ID, driver data, and callback functions for actions.
 */
interface DriverDetailCardProps {
  driverId: string;
  driver?: Driver;
  onEdit?: () => void;
  onStatusChange?: () => void;
  onAssignVehicle?: () => void;
  onViewPerformance?: () => void;
  isLoading?: boolean;
}

/**
 * Formats a phone number string into a readable format
 * @param phoneNumber The phone number string
 * @returns Formatted phone number
 */
const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};

/**
 * Formats an array of license endorsements into a readable string
 * @param endorsements Array of license endorsements
 * @returns Comma-separated list of endorsements
 */
const formatLicenseEndorsements = (endorsements: LicenseEndorsement[]): string => {
  return endorsements.join(', ');
};

/**
 * Returns the appropriate color for a driver status
 * @param status The driver status
 * @returns Color code for the status
 */
const getStatusColor = (status: DriverStatus): string => {
  switch (status) {
    case DriverStatus.ACTIVE:
      return 'success';
    case DriverStatus.ON_DUTY:
      return 'warning';
    case DriverStatus.DRIVING:
      return 'info';
    case DriverStatus.INACTIVE:
      return 'inactive';
    case DriverStatus.UNAVAILABLE:
      return 'error';
    default:
      return 'primary';
  }
};

/**
 * Formats minutes into hours and minutes display
 * @param minutes Number of minutes
 * @returns Formatted time string (e.g., '8h 30m')
 */
const formatHoursMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Styled Card component with custom styling for driver details
 */
const StyledCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
  height: auto;
  ${({ theme }) => theme.mediaQueries.up('md')} {
    width: 500px;
  }
`;

/**
 * Styled section container for grouping related information
 */
const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  &:last-child {
    border-bottom: none;
  }
`;

/**
 * Styled row for label-value pairs
 */
const InfoRow = styled(FlexBox)`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  ${({ theme }) => theme.mediaQueries.up('sm')} {
    flex-direction: row;
  }
`;

/**
 * Styled label component
 */
const Label = styled(Text)`
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  width: 120px;
  display: inline-block;
`;

/**
 * Styled value component
 */
const Value = styled(Text)`
  font-weight: ${({ theme }) => theme.fonts.weight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  flex-grow: 1;
`;

/**
 * Styled container for icons
 */
const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.sizes.iconSize.sm};
`;

/**
 * Styled container for efficiency score display
 */
const ScoreContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.fonts.size.md};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  color: ${({ theme }) => theme.colors.text.inverted};
  background-color: ${({ theme }) => theme.colors.semantic.success};
`;

/**
 * Styled container for action buttons
 */
const ActionButtons = styled(FlexBox)`
  margin-top: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaQueries.up('sm')} {
    flex-direction: row;
  }
`;

/**
 * Component that displays detailed information about a driver
 */
const DriverDetailCard: React.FC<DriverDetailCardProps> = ({ driverId, driver, onEdit, onStatusChange, onAssignVehicle, onViewPerformance, isLoading }) => {
  const [driverDetails, setDriverDetails] = useState<Driver | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect hook to fetch driver details when the component mounts or the driverId changes
   */
  useEffect(() => {
    const fetchDriverDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await getDriverWithDetails(driverId);
        setDriverDetails(details);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch driver details');
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchDriverDetails();
    }
  }, [driverId]);

  /**
   * Render method for the DriverDetailCard component
   */
  return (
    <StyledCard>
      {loading && <Text>Loading driver details...</Text>}
      {error && <Text color="error">Error: {error}</Text>}
      {driverDetails && (
        <>
          <FlexBox justifyContent="space-between" alignItems="center" margin="0 0 md 0">
            <Heading level={3}>
              <IconWrapper><DriverIcon /></IconWrapper>
              {driverDetails.firstName} {driverDetails.lastName}
            </Heading>
            <Badge variant={getStatusColor(driverDetails.status)}>{driverDetails.status}</Badge>
          </FlexBox>

          <ActionButtons justifyContent="flex-end">
            {onEdit && <Button variant="secondary" startIcon={<EditIcon />} onClick={onEdit}>Edit</Button>}
            {onStatusChange && <Button variant="secondary" onClick={onStatusChange}>Change Status</Button>}
            {onAssignVehicle && <Button variant="secondary" onClick={onAssignVehicle}>Assign Vehicle</Button>}
            {onViewPerformance && <Button variant="secondary" onClick={onViewPerformance}>View Performance</Button>}
          </ActionButtons>

          <Section>
            <Heading level={4}>Personal Information</Heading>
            <InfoRow>
              <Label>Email:</Label>
              <Value>{driverDetails.email}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Phone:</Label>
              <Value>{formatPhoneNumber(driverDetails.phone)}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Address:</Label>
              <Value>{driverDetails.homeAddress.street1}, {driverDetails.homeAddress.city}, {driverDetails.homeAddress.state} {driverDetails.homeAddress.zipCode}</Value>
            </InfoRow>
          </Section>

          <Section>
            <Heading level={4}>License Information</Heading>
            <InfoRow>
              <Label>License Number:</Label>
              <Value>{driverDetails.licenseNumber}</Value>
            </InfoRow>
            <InfoRow>
              <Label>License State:</Label>
              <Value>{driverDetails.licenseState}</Value>
            </InfoRow>
            <InfoRow>
              <Label>License Class:</Label>
              <Value>{driverDetails.licenseClass}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Endorsements:</Label>
              <Value>{formatLicenseEndorsements(driverDetails.licenseEndorsements)}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Expiration Date:</Label>
              <Value>{new Date(driverDetails.licenseExpiration).toLocaleDateString()}</Value>
            </InfoRow>
          </Section>

          <Section>
            <Heading level={4}>Current Status</Heading>
            <InfoRow>
              <Label>Status:</Label>
              <Value><Badge variant={getStatusColor(driverDetails.status)}>{driverDetails.status}</Badge></Value>
            </InfoRow>
            <InfoRow>
              <Label>Location:</Label>
              <Value>
                <IconWrapper><LocationIcon /></IconWrapper>
                {driverDetails.currentLocation.latitude}, {driverDetails.currentLocation.longitude}
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>Current Load:</Label>
              <Value>
                <IconWrapper><TruckIcon /></IconWrapper>
                {driverDetails.currentLoadId || 'No active load'}
              </Value>
            </InfoRow>
          </Section>

          <Section>
            <Heading level={4}>Hours of Service</Heading>
            <InfoRow>
              <Label>Driving:</Label>
              <Value>
                <IconWrapper><ClockIcon /></IconWrapper>
                {formatHoursMinutes(driverDetails.drivingMinutesRemaining)}
              </Value>
            </InfoRow>
            <InfoRow>
              <Label>On Duty:</Label>
              <Value>{formatHoursMinutes(driverDetails.dutyMinutesRemaining)}</Value>
            </InfoRow>
            <InfoRow>
              <Label>Cycle:</Label>
              <Value>{formatHoursMinutes(driverDetails.cycleMinutesRemaining)}</Value>
            </InfoRow>
          </Section>

          <Section>
            <Heading level={4}>Efficiency Score</Heading>
            <FlexBox alignItems="center">
              <ScoreContainer>
                <IconWrapper><StarIcon /></IconWrapper>
                {driverDetails.efficiencyScore}
              </ScoreContainer>
              <Text marginLeft="md">
                This score reflects the driver's contribution to network optimization.
              </Text>
            </FlexBox>
          </Section>
        </>
      )}
    </StyledCard>
  );
};

export default DriverDetailCard;

/**
 * Styled Card component with custom styling for driver details
 */
const StyledCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
  height: auto;
  ${({ theme }) => theme.mediaQueries.up('md')} {
    width: 500px;
  }
`;

/**
 * Styled section container for grouping related information
 */
const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  &:last-child {
    border-bottom: none;
  }
`;

/**
 * Styled row for label-value pairs
 */
const InfoRow = styled(FlexBox)`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  ${({ theme }) => theme.mediaQueries.up('sm')} {
    flex-direction: row;
  }
`;

/**
 * Styled label component
 */
const Label = styled(Text)`
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  width: 120px;
  display: inline-block;
`;

/**
 * Styled value component
 */
const Value = styled(Text)`
  font-weight: ${({ theme }) => theme.fonts.weight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  flex-grow: 1;
`;

/**
 * Styled container for icons
 */
const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.sizes.iconSize.sm};
`;

/**
 * Styled container for efficiency score display
 */
const ScoreContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: ${({ theme }) => theme.fonts.size.md};
  font-weight: ${({ theme }) => theme.fonts.weight.medium};
  color: ${({ theme }) => theme.colors.text.inverted};
  background-color: ${({ theme }) => theme.colors.semantic.success};
`;

/**
 * Styled container for action buttons
 */
const ActionButtons = styled(FlexBox)`
  margin-top: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaQueries.up('sm')} {
    flex-direction: row;
  }
`;