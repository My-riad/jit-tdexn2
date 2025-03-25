import React, { useEffect } from 'react'; //  ^18.2.0
import { useSelector } from 'react-redux'; //  ^8.0.5
import styled from 'styled-components'; //  ^5.3.6
import { View, Text, TouchableOpacity } from 'react-native'; //  ^0.70.6

import theme from '../styles/theme'; // Theme variables for consistent styling
import {
  DriverStatus,
  HOSStatus,
} from '../../../common/interfaces/driver.interface'; // Enum for driver status values
import { formatHoursMinutes } from '../../../common/utils/dateTimeUtils'; // Utility function for formatting hours and minutes
import useDriverLocation from '../hooks/useDriverLocation'; // Hook to access driver location and online status

// Define the interface for the component's props
interface StatusBarProps {
  driverId: string;
  onStatusPress?: () => void;
  compact?: boolean;
}

// Styled components for consistent styling
const Container = styled(View)<{ compact?: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.compact ? '8px 12px' : '12px 16px'};
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: ${props => props.theme.borders.radius.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatusSection = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const StatusIndicator = styled(View)<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${props => props.color};
  margin-right: ${props => props.theme.spacing.xs};
`;

const StatusText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const OnlineIndicator = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-left: ${props => props.theme.spacing.md};
`;

const OnlineDot = styled(View)<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  margin-right: ${props => props.theme.spacing.xxs};
`;

const OnlineText = styled(Text)`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
`;

const HOSSection = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const HOSItem = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-left: ${props => props.theme.spacing.sm};
`;

const HOSLabel = styled(Text)`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  margin-right: ${props => props.theme.spacing.xxs};
`;

const HOSValue = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const LoadingText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  font-style: italic;
`;

const ErrorText = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.semantic.error};
  font-style: italic;
`;

/**
 * Component that displays the driver's current status and HOS information
 */
const StatusBar: React.FC<StatusBarProps> = ({ driverId, onStatusPress, compact }) => {
  // Extract driverId and onStatusPress from props
  // Get driver data from Redux store using useSelector
  const driver = useSelector((state: any) => state.driver.driver);

  // Get online status from useDriverLocation hook
  const { isOnline, loading: locationLoading, error: locationError } = useDriverLocation(driverId, driver?.vehicleId);

  // Extract status, hosStatus, drivingMinutesRemaining, and dutyMinutesRemaining from driver data
  const status = driver?.status || DriverStatus.INACTIVE;
  const hosStatus = driver?.hosStatus || HOSStatus.OFF_DUTY;
  const drivingMinutesRemaining = driver?.drivingMinutesRemaining || 0;
  const dutyMinutesRemaining = driver?.dutyMinutesRemaining || 0;

  // Format driving and duty hours using formatHoursMinutes utility
  const drivingHours = formatHoursMinutes(drivingMinutesRemaining / 60, drivingMinutesRemaining % 60);
  const dutyHours = formatHoursMinutes(dutyMinutesRemaining / 60, dutyMinutesRemaining % 60);

  // Determine status color based on driver status
  let statusColor = theme.colors.status.inactive;
  if (status === DriverStatus.AVAILABLE) {
    statusColor = theme.colors.status.available;
  } else if (status === DriverStatus.ON_DUTY || status === DriverStatus.DRIVING) {
    statusColor = theme.colors.status.inTransit;
  }

  // Determine online indicator color based on online status
  const onlineColor = isOnline ? theme.colors.status.available : theme.colors.status.inactive;

  // Render the Container component with status information
  return (
    <TouchableOpacity onPress={onStatusPress} disabled={!onStatusPress}>
      <Container compact={compact}>
        {/* Render driver status with appropriate color indicator */}
        <StatusSection>
          <StatusIndicator color={statusColor} />
          <StatusText>{status}</StatusText>
        </StatusSection>

        {/* Render online/offline indicator */}
        <OnlineIndicator>
          <OnlineDot color={onlineColor} />
          <OnlineText>{isOnline ? 'Online' : 'Offline'}</OnlineText>
        </OnlineIndicator>

        {/* Render HOS information with remaining driving and duty hours */}
        <HOSSection>
          {locationLoading ? (
            <LoadingText>Loading HOS...</LoadingText>
          ) : locationError ? (
            <ErrorText>HOS Error</ErrorText>
          ) : (
            <>
              <HOSItem>
                <HOSLabel>Drive:</HOSLabel>
                <HOSValue>{drivingHours}</HOSValue>
              </HOSItem>
              <HOSItem>
                <HOSLabel>Duty:</HOSLabel>
                <HOSValue>{dutyHours}</HOSValue>
              </HOSItem>
            </>
          )}
        </HOSSection>
      </Container>
    </TouchableOpacity>
  );
};

export default StatusBar;
export type { StatusBarProps };