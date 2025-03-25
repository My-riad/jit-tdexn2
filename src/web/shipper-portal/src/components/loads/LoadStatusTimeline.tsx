import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LoadStatus, LoadStatusHistory } from '../../../common/interfaces/load.interface';
import { formatDateTime, formatRelativeTime } from '../../../common/utils/dateTimeUtils';
import { Badge, Tooltip } from '../../../shared/components/feedback';
import { colors, mixins, variables } from '../../../shared/styles';

interface LoadStatusTimelineProps {
  statusHistory: LoadStatusHistory[];
  currentStatus: LoadStatus;
  compact?: boolean;
  className?: string;
}

/**
 * Determines the appropriate color for a given load status
 */
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.CREATED:
    case LoadStatus.PENDING:
    case LoadStatus.OPTIMIZING:
    case LoadStatus.AVAILABLE:
      return colors.primary.blue;
    case LoadStatus.RESERVED:
    case LoadStatus.ASSIGNED:
      return colors.primary.orange;
    case LoadStatus.IN_TRANSIT:
    case LoadStatus.AT_PICKUP:
    case LoadStatus.LOADED:
    case LoadStatus.AT_DROPOFF:
      return colors.primary.blueLight;
    case LoadStatus.DELIVERED:
    case LoadStatus.COMPLETED:
      return colors.primary.green;
    case LoadStatus.CANCELLED:
    case LoadStatus.EXPIRED:
      return colors.primary.red;
    case LoadStatus.DELAYED:
    case LoadStatus.EXCEPTION:
      return colors.primary.orange;
    default:
      return colors.neutral.mediumGray;
  }
};

/**
 * Gets a human-readable label for a load status
 */
const getStatusLabel = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.CREATED:
      return 'Created';
    case LoadStatus.PENDING:
      return 'Pending';
    case LoadStatus.OPTIMIZING:
      return 'Optimizing';
    case LoadStatus.AVAILABLE:
      return 'Available';
    case LoadStatus.RESERVED:
      return 'Reserved';
    case LoadStatus.ASSIGNED:
      return 'Assigned';
    case LoadStatus.IN_TRANSIT:
      return 'In Transit';
    case LoadStatus.AT_PICKUP:
      return 'At Pickup';
    case LoadStatus.LOADED:
      return 'Loaded';
    case LoadStatus.AT_DROPOFF:
      return 'At Delivery';
    case LoadStatus.DELIVERED:
      return 'Delivered';
    case LoadStatus.COMPLETED:
      return 'Completed';
    case LoadStatus.CANCELLED:
      return 'Cancelled';
    case LoadStatus.EXPIRED:
      return 'Expired';
    case LoadStatus.DELAYED:
      return 'Delayed';
    case LoadStatus.EXCEPTION:
      return 'Exception';
    default:
      return 'Unknown Status';
  }
};

const TimelineContainer = styled.div<{ compact?: boolean }>`
  ${mixins.flexColumn}
  width: 100%;
  padding: ${({ compact }) => (compact ? variables.spacing.xs : variables.spacing.md)};
`;

const TimelineItem = styled.div`
  display: flex;
  position: relative;
  margin-bottom: ${variables.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelinePoint = styled.div<{ status: LoadStatus; compact?: boolean; isActive?: boolean }>`
  width: ${({ compact }) => (compact ? '12px' : '16px')};
  height: ${({ compact }) => (compact ? '12px' : '16px')};
  border-radius: 50%;
  background-color: ${({ status }) => getStatusColor(status)};
  border: 2px solid ${({ status }) => getStatusColor(status)};
  box-shadow: 0 0 0 2px ${colors.transparency.white20};
  z-index: 2;
  flex-shrink: 0;
  
  ${({ isActive }) => isActive && `
    width: 20px;
    height: 20px;
    border: 3px solid ${colors.neutral.white};
    box-shadow: 0 0 0 2px currentColor, 0 0 0 4px ${colors.transparency.white10};
  `}
`;

const TimelineConnector = styled.div<{ status: LoadStatus; isLast?: boolean }>`
  position: absolute;
  left: 7px;
  top: 16px;
  bottom: ${({ isLast }) => (isLast ? '0' : '-16px')};
  width: 2px;
  background-color: ${({ status, isLast }) => (isLast ? 'transparent' : getStatusColor(status))};
  z-index: 1;
`;

const StatusContent = styled.div`
  ${mixins.flexColumn}
  margin-left: ${variables.spacing.md};
  flex-grow: 1;
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimeInfo = styled.div`
  ${mixins.flexColumn}
  align-items: flex-end;
  font-size: ${({ theme }) => theme?.fonts?.size?.sm || '14px'};
`;

const Timestamp = styled.span`
  font-weight: normal;
  color: ${colors.neutral.mediumGray};
`;

const RelativeTime = styled.span`
  font-size: ${({ theme }) => theme?.fonts?.size?.xs || '12px'};
  color: ${colors.neutral.gray600};
  font-style: italic;
`;

const LocationInfo = styled.div`
  margin-top: ${variables.spacing.xs};
  font-size: ${({ theme }) => theme?.fonts?.size?.sm || '14px'};
  display: flex;
  align-items: center;
  color: ${colors.neutral.mediumGray};
`;

const StatusDetails = styled.div`
  margin-top: ${variables.spacing.xs};
  font-size: ${({ theme }) => theme?.fonts?.size?.sm || '14px'};
  color: ${colors.neutral.mediumGray};
`;

/**
 * A component that displays a visual timeline of a load's status history,
 * showing the progression of a load through various stages.
 */
const LoadStatusTimeline: React.FC<LoadStatusTimelineProps> = ({
  statusHistory,
  currentStatus,
  compact = false,
  className
}) => {
  const [sortedHistory, setSortedHistory] = useState<LoadStatusHistory[]>([]);

  useEffect(() => {
    // Sort status history by timestamp (newest first)
    const sorted = [...statusHistory].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setSortedHistory(sorted);
  }, [statusHistory]);

  return (
    <TimelineContainer compact={compact} className={className}>
      {sortedHistory.map((statusItem, index) => {
        const isLast = index === sortedHistory.length - 1;
        const isCurrentStatus = statusItem.status === currentStatus;
        
        return (
          <TimelineItem key={statusItem.id}>
            <TimelinePoint 
              status={statusItem.status} 
              compact={compact} 
              isActive={isCurrentStatus}
            />
            <TimelineConnector 
              status={statusItem.status} 
              isLast={isLast} 
            />
            <StatusContent>
              <StatusHeader>
                <Badge
                  color={getStatusColor(statusItem.status)}
                  text={getStatusLabel(statusItem.status)}
                />
                <TimeInfo>
                  <Timestamp>{formatDateTime(statusItem.timestamp)}</Timestamp>
                  <RelativeTime>{formatRelativeTime(statusItem.timestamp)}</RelativeTime>
                </TimeInfo>
              </StatusHeader>
              
              {statusItem.coordinates && statusItem.coordinates.latitude && statusItem.coordinates.longitude && (
                <Tooltip content="Click to view on map">
                  <LocationInfo>
                    {statusItem.statusDetails?.location || 
                      `${statusItem.coordinates.latitude.toFixed(6)}, ${statusItem.coordinates.longitude.toFixed(6)}`}
                  </LocationInfo>
                </Tooltip>
              )}
              
              {statusItem.statusDetails && statusItem.statusDetails.notes && (
                <StatusDetails>
                  {statusItem.statusDetails.notes}
                </StatusDetails>
              )}
            </StatusContent>
          </TimelineItem>
        );
      })}
    </TimelineContainer>
  );
};

export default LoadStatusTimeline;