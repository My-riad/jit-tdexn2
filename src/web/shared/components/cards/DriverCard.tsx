import React from 'react';
import styled from 'styled-components';
import Card from './Card';
import Badge from '../feedback/Badge';
import ScoreDisplay from '../gamification/ScoreDisplay';
import Text from '../typography/Text';
import Heading from '../typography/Heading';
import { LocationIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Driver, DriverStatus } from '../../common/interfaces/driver.interface';
import { theme } from '../../styles/theme';

/**
 * Enum for different driver card style variants
 */
export enum DriverCardVariant {
  DEFAULT = 'default',
  COMPACT = 'compact',
  DETAILED = 'detailed'
}

/**
 * Enum for different driver card size options
 */
export enum DriverCardSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

/**
 * Props interface for the DriverCard component
 */
export interface DriverCardProps {
  /** Driver data to display */
  driver: Driver;
  /** Visual style variant of the card */
  variant?: DriverCardVariant;
  /** Size of the card */
  size?: DriverCardSize;
  /** Optional click handler for the card */
  onClick?: () => void;
  /** Whether to show the efficiency score */
  showScore?: boolean;
  /** Whether to show the driver's location */
  showLocation?: boolean;
  /** Whether to show the driver's available hours */
  showHours?: boolean;
  /** Additional CSS class name */
  className?: string;
}

// Styled components for layout
const DriverInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const DriverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const DriverDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.xs};
`;

/**
 * Helper function to determine badge color based on driver status
 */
const getStatusColor = (status: DriverStatus): string => {
  switch (status) {
    case DriverStatus.AVAILABLE:
      return 'success';
    case DriverStatus.DRIVING:
      return 'primary';
    case DriverStatus.ON_DUTY:
      return 'info';
    case DriverStatus.OFF_DUTY:
      return 'secondary';
    case DriverStatus.SLEEPER_BERTH:
      return 'secondary';
    case DriverStatus.INACTIVE:
    case DriverStatus.SUSPENDED:
      return 'error';
    default:
      return 'info';
  }
};

/**
 * Helper function to format hours of service time
 */
const formatHoursMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

/**
 * A card component for displaying driver information with consistent styling
 * and interactive capabilities. Shows driver details including name, status,
 * efficiency score, location, and available hours in a standardized format.
 */
const DriverCard: React.FC<DriverCardProps> = ({
  driver,
  variant = DriverCardVariant.DEFAULT,
  size = DriverCardSize.MEDIUM,
  onClick,
  showScore = true,
  showLocation = true,
  showHours = true,
  className
}) => {
  // Format driver name
  const driverName = `${driver.firstName} ${driver.lastName}`;
  
  // Format location if available
  let locationText = '';
  if (showLocation && driver.currentLocation) {
    // In a real implementation, we might have city/state information
    // For now, we'll just use the coordinates
    locationText = `${driver.currentLocation.latitude.toFixed(2)}, ${driver.currentLocation.longitude.toFixed(2)}`;
  }
  
  // Format hours if available
  let hoursText = '';
  if (showHours && driver.drivingMinutesRemaining !== undefined) {
    hoursText = formatHoursMinutes(driver.drivingMinutesRemaining);
  }
  
  // Card layout based on variant
  const isCompact = variant === DriverCardVariant.COMPACT;
  const isDetailed = variant === DriverCardVariant.DETAILED;
  
  return (
    <Card
      onClick={onClick}
      className={className}
      padding={
        size === DriverCardSize.SMALL ? 'sm' : 
        size === DriverCardSize.LARGE ? 'lg' : 
        'md'
      }
      elevation={size === DriverCardSize.SMALL ? 'low' : 'medium'}
      variant={isDetailed ? Card.CardVariant.OUTLINED : Card.CardVariant.DEFAULT}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: isCompact ? 'row' : 'column',
        gap: theme.spacing.sm
      }}>
        <DriverHeader>
          <Heading 
            level={size === DriverCardSize.SMALL ? 5 : size === DriverCardSize.LARGE ? 3 : 4}
            noMargin
          >
            {driverName}
          </Heading>
          <Badge 
            variant={getStatusColor(driver.status) as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'}
            content={driver.status}
            size={size === DriverCardSize.SMALL ? 'small' : 'medium'}
          />
        </DriverHeader>
        
        <DriverInfo>
          {showScore && driver.efficiencyScore !== undefined && (
            <ScoreDisplay 
              score={driver.efficiencyScore}
              variant="compact"
              size={size === DriverCardSize.SMALL ? 'small' : size === DriverCardSize.LARGE ? 'large' : 'medium'}
            />
          )}
          
          {showLocation && locationText && (
            <DriverDetail>
              <LocationIcon width={size === DriverCardSize.SMALL ? 16 : 20} height={size === DriverCardSize.SMALL ? 16 : 20} />
              <Text 
                variant={size === DriverCardSize.SMALL ? 'caption' : 'bodySmall'} 
                noMargin
              >
                {locationText}
              </Text>
            </DriverDetail>
          )}
          
          {showHours && hoursText && (
            <DriverDetail>
              <ClockIcon width={size === DriverCardSize.SMALL ? 16 : 20} height={size === DriverCardSize.SMALL ? 16 : 20} />
              <Text 
                variant={size === DriverCardSize.SMALL ? 'caption' : 'bodySmall'} 
                noMargin
              >
                Drive time: {hoursText}
              </Text>
            </DriverDetail>
          )}
          
          {isDetailed && (
            <div style={{ marginTop: theme.spacing.md }}>
              <Text variant="caption" color="secondary">
                Driver ID: {driver.id.substring(0, 8)}
                {driver.eldDeviceId && ` • ELD: ${driver.eldProvider}`}
              </Text>
            </div>
          )}
        </DriverInfo>
      </div>
    </Card>
  );
};

export default DriverCard;