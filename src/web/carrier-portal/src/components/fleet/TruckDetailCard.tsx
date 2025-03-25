import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.6
import {
  Vehicle,
  VehicleType,
  VehicleStatus,
  VehicleWithDetails,
  VehiclePerformanceMetrics,
} from '../../../common/interfaces/vehicle.interface';
import Card from '../../../shared/components/cards/Card';
import Button from '../../../shared/components/buttons/Button';
import IconButton from '../../../shared/components/buttons/IconButton';
import Badge from '../../../shared/components/feedback/Badge';
import {
  EditIcon,
  TruckIcon,
  DriverIcon,
  CalendarIcon,
  GaugeIcon,
  RulerIcon,
  WeightIcon,
  GasIcon,
} from '../../../shared/assets/icons';
import {
  getVehicleById,
  getVehiclePerformance,
  getVehicleMaintenanceHistory,
} from '../../services/fleetService';
import { formatDate, formatNumber, formatCurrency } from '../../../common/utils/formatters';

/**
 * Props for the TruckDetailCard component
 */
interface TruckDetailCardProps {
  /**
   * Vehicle data to display
   */
  vehicle: VehicleWithDetails;
  /**
   * Callback function when edit button is clicked
   */
  onEdit?: () => void;
  /**
   * Callback function when assign driver button is clicked
   */
  onAssignDriver?: () => void;
  /**
   * Callback function when schedule maintenance button is clicked
   */
  onScheduleMaintenance?: () => void;
  /**
   * Callback function when view history button is clicked
   */
  onViewHistory?: () => void;
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Helper function to determine badge color based on vehicle status
 * @param status Vehicle status
 * @returns CSS color value
 */
const getStatusBadgeColor = (status: VehicleStatus): string => {
  switch (status) {
    case VehicleStatus.ACTIVE:
      return '#34A853'; // Green
    case VehicleStatus.AVAILABLE:
      return '#1A73E8'; // Blue
    case VehicleStatus.MAINTENANCE:
      return '#FBBC04'; // Orange
    case VehicleStatus.OUT_OF_SERVICE:
      return '#EA4335'; // Red
    default:
      return '#9AA0A6'; // Gray
  }
};

/**
 * Helper function to determine color based on maintenance status
 * @param nextMaintenanceDate Date of next maintenance
 * @returns CSS color value
 */
const getMaintenanceStatusColor = (nextMaintenanceDate: Date): string => {
  const now = new Date();
  const timeDiff = nextMaintenanceDate.getTime() - now.getTime();
  const daysUntilMaintenance = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysUntilMaintenance < 0) {
    return '#EA4335'; // Red - Overdue
  } else if (daysUntilMaintenance <= 7) {
    return '#FBBC04'; // Orange - Due Soon
  } else {
    return '#34A853'; // Green - Up-to-date
  }
};

/**
 * Helper function to format vehicle type enum to readable string
 * @param type Vehicle type
 * @returns Formatted vehicle type string
 */
const formatVehicleType = (type: VehicleType): string => {
  const formattedType = type.replace(/_/g, ' ').toLowerCase();
  return formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
};

/**
 * Component that displays detailed information about a truck/vehicle in a card format
 */
export const TruckDetailCard: React.FC<TruckDetailCardProps> = React.memo(({
  vehicle,
  onEdit,
  onAssignDriver,
  onScheduleMaintenance,
  onViewHistory,
  className,
}) => {
  // LD1: Destructure vehicle and callback props
  const {
    vehicle_id,
    type,
    make,
    model,
    year,
    plate_number,
    plate_state,
    status,
    vin,
    dimensions,
    weight_capacity,
    volume_capacity,
    current_driver,
    current_load,
    next_maintenance_date,
  } = vehicle;

  // LD2: Set up state for performance metrics and maintenance history
  const [performanceMetrics, setPerformanceMetrics] = useState<VehiclePerformanceMetrics | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState<string>('');

  // LD3: Fetch performance metrics and maintenance history on component mount and when vehicle ID changes
  useEffect(() => {
    const fetchPerformance = async () => {
      const metrics = await getVehiclePerformance(vehicle_id);
      setPerformanceMetrics(metrics);
    };

    const calculateMaintenanceStatus = () => {
      if (next_maintenance_date) {
        const maintenanceColor = getMaintenanceStatusColor(new Date(next_maintenance_date));
        setMaintenanceStatus(maintenanceColor);
      }
    };

    fetchPerformance();
    calculateMaintenanceStatus();
  }, [vehicle_id, next_maintenance_date]);

  // LD4: Format vehicle data for display (type, make, model, status, etc.)
  const formattedVehicleType = formatVehicleType(type);
  const vehicleStatusColor = getStatusBadgeColor(status);

  // LD5: Calculate maintenance status (up-to-date, due soon, overdue)
  const maintenanceStatusText = next_maintenance_date
    ? new Date(next_maintenance_date) < new Date()
      ? 'Overdue'
      : 'Up-to-date'
    : 'Not Scheduled';

  // LD6: Format performance metrics for display (utilization, empty miles, etc.)
  const utilization = performanceMetrics ? formatNumber(performanceMetrics.utilization_percentage, 1) + '%' : 'N/A';
  const emptyMiles = performanceMetrics ? formatNumber(performanceMetrics.empty_miles_percentage, 1) + '%' : 'N/A';

  // LD7: Render the Card component with vehicle information sections
  return (
    <Card className={className}>
      <CardContent>
        {/* LD8: Render vehicle header with ID, type, status badge, and edit button */}
        <CardHeader>
          <VehicleTitle>
            <TruckIcon />
            {vehicle_id} - {formattedVehicleType}
            <StatusBadge status={status}>{status}</StatusBadge>
          </VehicleTitle>
          <IconButton ariaLabel="Edit Vehicle" onClick={onEdit}>
            <EditIcon />
          </IconButton>
        </CardHeader>

        {/* LD9: Render vehicle specifications section (make, model, year, dimensions, capacity) */}
        <Section>
          <SectionTitle>Vehicle Specifications</SectionTitle>
          <InfoRow>
            <IconWrapper><TruckIcon /></IconWrapper>
            <InfoLabel>Make/Model:</InfoLabel>
            <InfoValue>{make} {model} ({year})</InfoValue>
          </InfoRow>
          <InfoRow>
            <IconWrapper><RulerIcon /></IconWrapper>
            <InfoLabel>Dimensions:</InfoLabel>
            <InfoValue>{dimensions?.length}ft x {dimensions?.width}ft x {dimensions?.height}ft</InfoValue>
          </InfoRow>
          <InfoRow>
            <IconWrapper><WeightIcon /></IconWrapper>
            <InfoLabel>Capacity:</InfoLabel>
            <InfoValue>{formatNumber(weight_capacity)} lbs / {formatNumber(volume_capacity)} cu ft</InfoValue>
          </InfoRow>
        </Section>

        {/* LD10: Render vehicle registration section (VIN, plate number, etc.) */}
        <Section>
          <SectionTitle>Registration</SectionTitle>
          <InfoRow>
            <IconWrapper><TruckIcon /></IconWrapper>
            <InfoLabel>VIN:</InfoLabel>
            <InfoValue>{vin}</InfoValue>
          </InfoRow>
          <InfoRow>
            <IconWrapper><TruckIcon /></IconWrapper>
            <InfoLabel>Plate:</InfoLabel>
            <InfoValue>{plate_number}, {plate_state}</InfoValue>
          </InfoRow>
        </Section>

        {/* LD11: Render current assignment section if vehicle is assigned to a driver or load */}
        {current_driver && current_load && (
          <Section>
            <SectionTitle>Current Assignment</SectionTitle>
            <InfoRow>
              <IconWrapper><DriverIcon /></IconWrapper>
              <InfoLabel>Driver:</InfoLabel>
              <InfoValue>{current_driver.first_name} {current_driver.last_name}</InfoValue>
            </InfoRow>
            {/* <InfoRow>
              <IconWrapper><TruckIcon /></IconWrapper>
              <InfoLabel>Load:</InfoLabel>
              <InfoValue>{current_load.origin} to {current_load.destination} ({current_load.status})</InfoValue>
            </InfoRow> */}
          </Section>
        )}

        {/* LD12: Render maintenance section with status and upcoming maintenance */}
        <Section>
          <SectionTitle>Maintenance</SectionTitle>
          <InfoRow>
            <IconWrapper><CalendarIcon /></IconWrapper>
            <InfoLabel>Status:</InfoLabel>
            <InfoValue>
              {maintenanceStatusText}
              <MaintenanceStatus status={maintenanceStatus}>{maintenanceStatusText}</MaintenanceStatus>
            </InfoValue>
          </InfoRow>
          {next_maintenance_date && (
            <InfoRow>
              <IconWrapper><CalendarIcon /></IconWrapper>
              <InfoLabel>Next:</InfoLabel>
              <InfoValue>{formatDate(new Date(next_maintenance_date))}</InfoValue>
            </InfoRow>
          )}
        </Section>

        {/* LD13: Render performance metrics section with utilization and efficiency data */}
        <Section>
          <SectionTitle>Performance Metrics</SectionTitle>
          <MetricsContainer>
            <MetricItem>
              <MetricValue>{utilization}</MetricValue>
              <MetricLabel>Utilization</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{emptyMiles}</MetricValue>
              <MetricLabel>Empty Miles</MetricLabel>
            </MetricItem>
          </MetricsContainer>
        </Section>

        {/* LD14: Render action buttons for managing the vehicle */}
        <ActionButtons>
          <Button variant="secondary" onClick={onAssignDriver}>Assign Driver</Button>
          <Button variant="secondary" onClick={onScheduleMaintenance}>Schedule Maintenance</Button>
          <Button variant="secondary" onClick={onViewHistory}>View History</Button>
        </ActionButtons>
      </CardContent>
    </Card>
  );
});

/**
 * Styled components for the TruckDetailCard
 */
const CardContent = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const VehicleTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.text.secondary};
  min-width: 120px;
`;

const InfoValue = styled.span`
  font-weight: 400;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${props => props.theme.colors.primary.main};
`;

interface StatusBadgeProps {
  status: VehicleStatus;
}

const StatusBadge = styled.div<StatusBadgeProps>`
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  background-color: ${props => getStatusBadgeColor(props.status)};
  color: white;
  display: inline-block;
`;

interface MaintenanceStatusProps {
  status: string;
}

const MaintenanceStatus = styled.span<MaintenanceStatusProps>`
  color: ${props => props.status};
  font-weight: 500;
  margin-left: 0.5rem;
`;

const MetricsContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
`;

const MetricValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.colors.primary.main};
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

export type { TruckDetailCardProps };
export default TruckDetailCard;