import React from 'react';
import styled, { css } from 'styled-components'; // styled-components ^5.3.10
import {
  LoadStatus,
  LoadStatusHistory,
} from '../../../common/interfaces/load.interface';
import {
  formatDateTime,
  formatRelativeTime,
} from '../../../common/utils/dateTimeUtils';
import { formatLoadStatus } from '../../../common/utils/formatters';
import { Badge } from '../../../shared/components/feedback';
import { Tooltip } from '../../../shared/components/feedback';
import { Skeleton } from '../../../shared/components/feedback';
import { colors, spacing, sizes } from '../../../shared/styles';
import { mixins } from '../../../shared/styles';
import { FaCircle, FaCheck, FaTruck, FaWarehouse, FaExclamationTriangle, FaClock } from 'react-icons/fa'; // react-icons/fa ^4.10.0

/**
 * @StyledTimelineContainer
 * Styled container for the entire timeline
 */
const StyledTimelineContainer = styled.div<{ compact: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ compact }) => (compact ? '0' : spacing.md)};
`;

/**
 * @StyledTimelineItem
 * Styled container for each timeline item
 */
const StyledTimelineItem = styled.div<{ isLast: boolean }>`
  display: flex;
  position: relative;
  margin-bottom: ${({ isLast }) => (isLast ? '0' : spacing.lg)};
  padding-bottom: ${({ isLast }) => (isLast ? '0' : spacing.lg)};
`;

/**
 * @StyledTimelineLine
 * Styled vertical line connecting timeline nodes
 */
const StyledTimelineLine = styled.div<{ isLast: boolean; status: LoadStatus }>`
  position: absolute;
  left: 12px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background: ${({ status, theme }) => getStatusColor(status)};
  display: ${({ isLast }) => (isLast ? 'none' : 'block')};
`;

/**
 * @StyledTimelineIcon
 * Styled container for the status icon
 */
const StyledTimelineIcon = styled.div<{ status: LoadStatus }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ status, theme }) => getStatusColor(status)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: ${spacing.md};
  flex-shrink: 0;
  z-index: 1;
`;

/**
 * @StyledTimelineContent
 * Styled container for the timeline item content
 */
const StyledTimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

/**
 * @StyledTimelineHeader
 * Styled header for each timeline item
 */
const StyledTimelineHeader = styled.div<{ compact: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ compact }) => (compact ? spacing.xs : spacing.sm)};
`;

/**
 * @StyledTimelineStatus
 * Styled status label
 */
const StyledTimelineStatus = styled.div`
  font-weight: bold;
  margin-right: ${spacing.sm};
`;

/**
 * @StyledTimelineTime
 * Styled timestamp display
 */
const StyledTimelineTime = styled.div<{ compact: boolean }>`
  color: ${colors.neutral.dark};
  font-size: ${({ compact }) => (compact ? sizes.xs : sizes.sm)};
`;

/**
 * @StyledTimelineDetails
 * Styled container for additional status details
 */
const StyledTimelineDetails = styled.div<{ compact: boolean }>`
  font-size: ${({ compact }) => (compact ? sizes.xs : sizes.sm)};
  color: ${colors.neutral.main};
  display: ${({ compact }) => (compact ? 'none' : 'block')};
`;

/**
 * @StyledTimelineLocation
 * Styled container for location information
 */
const StyledTimelineLocation = styled.div<{ hasLocation: boolean; compact: boolean }>`
  font-size: ${({ compact }) => (compact ? sizes.xs : sizes.sm)};
  color: ${colors.neutral.dark};
  margin-top: ${spacing.xxs};
  display: ${({ hasLocation, compact }) => (hasLocation && !compact ? 'block' : 'none')};
`;

/**
 * @LoadStatusTimelineProps
 */
export interface LoadStatusTimelineProps {
  statusHistory: LoadStatusHistory[];
  isLoading: boolean;
  compact: boolean;
  maxItems?: number;
}

/**
 * @getStatusColor
 * Returns the appropriate color for a given load status
 */
const getStatusColor = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.COMPLETED:
    case LoadStatus.DELIVERED:
      return colors.semantic.success;
    case LoadStatus.DELAYED:
    case LoadStatus.EXCEPTION:
      return colors.semantic.warning;
    case LoadStatus.CANCELLED:
    case LoadStatus.EXPIRED:
      return colors.semantic.error;
    case LoadStatus.IN_TRANSIT:
    case LoadStatus.LOADED:
      return colors.primary.blue;
    case LoadStatus.AT_PICKUP:
    case LoadStatus.AT_DROPOFF:
      return colors.primary.lightBlue;
    default:
      return colors.neutral.mediumGray;
  }
};

/**
 * @getStatusIcon
 * Returns the appropriate icon component for a given load status
 */
const getStatusIcon = (status: LoadStatus): React.ReactNode => {
  switch (status) {
    case LoadStatus.COMPLETED:
    case LoadStatus.DELIVERED:
      return <FaCheck />;
    case LoadStatus.IN_TRANSIT:
    case LoadStatus.LOADED:
      return <FaTruck />;
    case LoadStatus.AT_PICKUP:
    case LoadStatus.AT_DROPOFF:
      return <FaWarehouse />;
    case LoadStatus.DELAYED:
    case LoadStatus.EXCEPTION:
    case LoadStatus.CANCELLED:
    case LoadStatus.EXPIRED:
      return <FaExclamationTriangle />;
    case LoadStatus.PENDING:
    case LoadStatus.OPTIMIZING:
    case LoadStatus.AVAILABLE:
    case LoadStatus.RESERVED:
      return <FaClock />;
    default:
      return <FaCircle />;
  }
};

/**
 * @getStatusLabel
 * Returns a user-friendly label for a given load status
 */
const getStatusLabel = (status: LoadStatus): string => {
  return formatLoadStatus(status);
};

/**
 * @LoadStatusTimeline
 * A component that displays a timeline of load status changes
 */
export const LoadStatusTimeline: React.FC<LoadStatusTimelineProps> = ({
  statusHistory,
  isLoading,
  compact,
  maxItems,
}) => {
  // Sort status history by timestamp in descending order
  const sortedStatusHistory = statusHistory
    ? [...statusHistory].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  // Limit the number of items displayed if maxItems is provided
  const limitedStatusHistory = maxItems
    ? sortedStatusHistory.slice(0, maxItems)
    : sortedStatusHistory;

  if (isLoading) {
    return (
      <StyledTimelineContainer compact={compact}>
        {Array.from({ length: 3 }).map((_, index) => (
          <StyledTimelineItem key={index} isLast={index === 2}>
            <StyledTimelineIcon status={LoadStatus.PENDING}>
              <FaCircle />
            </StyledTimelineIcon>
            <StyledTimelineContent>
              <StyledTimelineHeader compact={compact}>
                <StyledTimelineStatus>
                  <Skeleton width={100} />
                </StyledTimelineStatus>
                <StyledTimelineTime compact={compact}>
                  <Skeleton width={50} />
                </StyledTimelineTime>
              </StyledTimelineHeader>
              <StyledTimelineDetails compact={compact}>
                <Skeleton width={150} />
              </StyledTimelineDetails>
              <StyledTimelineLocation hasLocation={false} compact={compact}>
                <Skeleton width={120} />
              </StyledTimelineLocation>
            </StyledTimelineContent>
            <StyledTimelineLine isLast={index === 2} status={LoadStatus.PENDING} />
          </StyledTimelineItem>
        ))}
      </StyledTimelineContainer>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return <StyledTimelineContainer compact={compact}>No status updates yet.</StyledTimelineContainer>;
  }

  return (
    <StyledTimelineContainer compact={compact}>
      {limitedStatusHistory.map((item, index) => {
        const isLast = index === limitedStatusHistory.length - 1;
        const hasLocation = item.coordinates && item.coordinates.latitude && item.coordinates.longitude;

        return (
          <StyledTimelineItem key={item.id} isLast={isLast}>
            <StyledTimelineIcon status={item.status}>
              {getStatusIcon(item.status)}
            </StyledTimelineIcon>
            <StyledTimelineContent>
              <StyledTimelineHeader compact={compact}>
                <StyledTimelineStatus>
                  <Badge variant="info">{getStatusLabel(item.status)}</Badge>
                </StyledTimelineStatus>
                <StyledTimelineTime compact={compact}>
                  {formatRelativeTime(item.timestamp)} ({formatDateTime(item.timestamp)})
                </StyledTimelineTime>
              </StyledTimelineHeader>
              <StyledTimelineDetails compact={compact}>
                {item.statusDetails && Object.keys(item.statusDetails).length > 0 && (
                  <Tooltip content={JSON.stringify(item.statusDetails, null, 2)}>
                    <span>Details</span>
                  </Tooltip>
                )}
              </StyledTimelineDetails>
              <StyledTimelineLocation hasLocation={hasLocation} compact={compact}>
                {hasLocation && (
                  <span>
                    Location: {item.coordinates.latitude}, {item.coordinates.longitude}
                  </span>
                )}
              </StyledTimelineLocation>
            </StyledTimelineContent>
            <StyledTimelineLine isLast={isLast} status={item.status} />
          </StyledTimelineItem>
        );
      })}
    </StyledTimelineContainer>
  );
};