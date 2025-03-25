import React from 'react'; // React ^18.2.0
import styled from 'styled-components'; // styled-components
import Text from '../../../shared/components/typography/Text'; // Typography component for consistent text styling
import ProgressBar from '../../../shared/components/feedback/ProgressBar'; // Visual representation of remaining hours as progress bars
import useEldIntegration from '../hooks/useEldIntegration'; // Hook to access driver's HOS data from ELD integration
import { formatHoursMinutes } from '../../../common/utils/dateTimeUtils'; // Utility function to format hours and minutes in a consistent way

// Define the props for the HoursDisplay component
interface HoursDisplayProps {
  title?: string; // Optional custom title for the component
  showTitle?: boolean; // Whether to show the title
  compact?: boolean; // Whether to use a compact layout
  className?: string; // Additional CSS class name
  style?: React.CSSProperties; // Additional inline styles
}

// Define styled components for the HoursDisplay component
const Container = styled.div<{ compact?: boolean }>`
  width: 100%;
  padding: ${props => props.compact ? '10px' : '15px'};
  background-color: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borders.radius.md};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Title = styled.div`
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: ${props => props.theme.fonts.weight.medium};
`;

const HoursSection = styled.div<{ compact?: boolean }>`
  margin-bottom: ${props => props.compact ? props.theme.spacing.xs : props.theme.spacing.sm};
`;

const HoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Label = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.fonts.size.sm};
`;

const TimeValue = styled.span`
  font-family: ${props => props.theme.fonts.family.mono};
  font-weight: ${props => props.theme.fonts.weight.medium};
  font-size: ${props => props.theme.fonts.size.md};
`;

// Define constants for thresholds and maximum hours
const HOURS_THRESHOLDS = [
  { value: 20, color: 'error.main' },
  { value: 40, color: 'warning.main' },
  { value: 100, color: 'success.main' },
];

const MAX_DRIVING_HOURS = 660; // Maximum driving hours in minutes (11 hours)
const MAX_DUTY_HOURS = 840; // Maximum duty hours in minutes (14 hours)
const MAX_CYCLE_HOURS = 3600; // Maximum cycle hours in minutes (60 hours)

/**
 * Component that displays a driver's available Hours of Service (HOS) information
 */
export const HoursDisplay: React.FC<HoursDisplayProps> = ({
  title = 'AVAILABLE DRIVING HOURS',
  showTitle = true,
  compact = false,
  className,
  style,
}) => {
  // Get HOS data from the useEldIntegration hook
  const { hosData } = useEldIntegration();

  // Calculate hours and minutes from driving_minutes_remaining
  const drivingHours = hosData?.drivingMinutesRemaining ? Math.floor(hosData.drivingMinutesRemaining / 60) : 0;
  const drivingMinutes = hosData?.drivingMinutesRemaining ? hosData.drivingMinutesRemaining % 60 : 0;

  // Calculate hours and minutes from duty_minutes_remaining
  const dutyHours = hosData?.dutyMinutesRemaining ? Math.floor(hosData.dutyMinutesRemaining / 60) : 0;
  const dutyMinutes = hosData?.dutyMinutesRemaining ? hosData.dutyMinutesRemaining % 60 : 0;

  // Calculate hours and minutes from cycle_minutes_remaining
  const cycleHours = hosData?.cycleMinutesRemaining ? Math.floor(hosData.cycleMinutesRemaining / 60) : 0;
  const cycleMinutes = hosData?.cycleMinutesRemaining ? hosData.cycleMinutesRemaining % 60 : 0;

  // Format the time values using formatHoursMinutes
  const formattedDrivingTime = formatHoursMinutes(drivingHours, drivingMinutes);
  const formattedDutyTime = formatHoursMinutes(dutyHours, dutyMinutes);
  const formattedCycleTime = formatHoursMinutes(cycleHours, cycleMinutes);

  // Calculate progress percentages for each category
  const drivingProgress = hosData?.drivingMinutesRemaining ? (hosData.drivingMinutesRemaining / MAX_DRIVING_HOURS) * 100 : 0;
  const dutyProgress = hosData?.dutyMinutesRemaining ? (hosData.dutyMinutesRemaining / MAX_DUTY_HOURS) * 100 : 0;
  const cycleProgress = hosData?.cycleMinutesRemaining ? (hosData.cycleMinutesRemaining / MAX_CYCLE_HOURS) * 100 : 0;

  // Render the container with title
  return (
    <Container compact={compact} className={className} style={style}>
      {showTitle && (
        <Title>
          <Text variant="label" noMargin>
            {title}
          </Text>
        </Title>
      )}

      {/* Render driving hours section with label, formatted time, and progress bar */}
      <HoursSection compact={compact}>
        <HoursRow>
          <Label>Driving</Label>
          <TimeValue>{formattedDrivingTime}</TimeValue>
        </HoursRow>
        <ProgressBar
          value={drivingProgress}
          thresholds={HOURS_THRESHOLDS}
          size={compact ? 'small' : 'medium'}
          showLabel={false}
        />
      </HoursSection>

      {/* Render duty hours section with label, formatted time, and progress bar */}
      <HoursSection compact={compact}>
        <HoursRow>
          <Label>Duty</Label>
          <TimeValue>{formattedDutyTime}</TimeValue>
        </HoursRow>
        <ProgressBar
          value={dutyProgress}
          thresholds={HOURS_THRESHOLDS}
          size={compact ? 'small' : 'medium'}
          showLabel={false}
        />
      </HoursSection>

      {/* Render cycle hours section with label, formatted time, and progress bar */}
      <HoursSection compact={compact}>
        <HoursRow>
          <Label>Cycle</Label>
          <TimeValue>{formattedCycleTime}</TimeValue>
        </HoursRow>
        <ProgressBar
          value={cycleProgress}
          thresholds={HOURS_THRESHOLDS}
          size={compact ? 'small' : 'medium'}
          showLabel={false}
        />
      </HoursSection>
    </Container>
  );
};