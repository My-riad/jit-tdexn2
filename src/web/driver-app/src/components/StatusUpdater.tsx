import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native'; // version ^0.72.4
import styled from 'styled-components'; // version ^5.3.6
import { useDispatch, useSelector } from 'react-redux'; // version ^8.1.1
import NetInfo from '@react-native-community/netinfo'; // version ^9.3.10

import {
  LoadStatus,
  LoadStatusUpdateParams,
} from '../../../common/interfaces/load.interface';
import {
  validateStatusTransition,
  getNextValidStatuses,
  StatusUpdateService,
} from '../services/statusUpdateService';
import { updateLoadStatusAction } from '../store/actions/loadActions';
import LoadStepsProgress from './LoadStepsProgress';
import Button, { ButtonProps } from '../../../shared/components/buttons/Button';
import Text from '../../../shared/components/typography/Text';
import TextArea from '../../../shared/components/forms/TextArea';
import FlexBox from '../../../shared/components/layout/FlexBox';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';

interface StatusUpdaterProps {
  loadId: string;
  driverId: string;
  currentStatus: LoadStatus;
  onStatusUpdate: (newStatus: LoadStatus) => void;
  onCancel: () => void;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Container = styled.View<{ compact?: boolean }>`
  padding: ${props => props.compact ? '12px' : '16px'};
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  margin-bottom: 16px;
`;

const Section = styled.View`
  margin-bottom: 16px;
  padding: 12px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
`;

const SectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 8px;
`;

const StatusOption = styled.TouchableOpacity<{ selected: boolean }>`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: ${props => props.selected ? props.theme.colors.primary.light : props.theme.colors.ui.card};
  border: 1px solid ${props => props.selected ? props.theme.colors.primary.main : props.theme.colors.ui.border};
`;

const StatusLabel = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 4px;
`;

const StatusDescription = styled(Text)`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 16px;
`;

const OfflineWarning = styled.View`
  padding: 8px;
  margin-bottom: 12px;
  background-color: ${props => props.theme.colors.warning.light};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.warning.main};
`;

const OfflineWarningText = styled(Text)`
  font-size: 12px;
  color: ${props => props.theme.colors.warning.dark};
`;

const LoadingContainer = styled.View`
  justify-content: center;
  align-items: center;
  padding: 16px;
`;

const CurrentStatusContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const CurrentStatusLabel = styled(Text)`
  font-size: 12px;
  color: ${props => props.theme.colors.text.secondary};
  margin-right: 8px;
`;

const CurrentStatusValue = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const NotesInput = styled(TextArea)`
  margin-top: 8px;
  margin-bottom: 12px;
  min-height: 80px;
`;

const StatusUpdater: React.FC<StatusUpdaterProps> = ({
  loadId,
  driverId,
  currentStatus,
  onStatusUpdate,
  onCancel,
  compact,
  className,
  style,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LoadStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [exceptionDetails, setExceptionDetails] = useState('');
  const [isConnected, setIsConnected] = useState(true);

  const dispatch = useDispatch();
  const statusUpdateService = React.useRef(new StatusUpdateService({} as any)).current;

  const nextStatuses = React.useMemo(() => getNextValidStatuses(currentStatus), [currentStatus]);

  const handleStatusSelect = (status: LoadStatus) => {
    setSelectedStatus(status);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      Alert.alert('Please select a status');
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        updateLoadStatusAction(loadId, {
          status: selectedStatus,
          statusDetails: { notes },
        })
      );
      onStatusUpdate(selectedStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleReportDelay = async () => {
    setLoading(true);
    try {
      await statusUpdateService.reportLoadDelay(loadId, driverId, delayReason, { notes });
      onStatusUpdate(LoadStatus.DELAYED);
    } finally {
      setLoading(false);
    }
  };

  const handleReportException = async () => {
    setLoading(true);
    try {
      await statusUpdateService.reportLoadException(loadId, driverId, exceptionDetails, { notes });
      onStatusUpdate(LoadStatus.EXCEPTION);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Container className={className} style={style} compact={compact}>
      {loading && (
        <LoadingContainer>
          <LoadingIndicator />
        </LoadingContainer>
      )}

      <CurrentStatusContainer>
        <CurrentStatusLabel>Current Status:</CurrentStatusLabel>
        <CurrentStatusValue>{getStatusLabel(currentStatus)}</CurrentStatusValue>
      </CurrentStatusContainer>

      <LoadStepsProgress currentStatus={currentStatus} compact={compact} />

      <Section>
        <SectionTitle>Update Status</SectionTitle>
        {nextStatuses.map(status => (
          <StatusOption
            key={status}
            onPress={() => handleStatusSelect(status)}
            selected={selectedStatus === status}
          >
            <StatusLabel>{getStatusLabel(status)}</StatusLabel>
            <StatusDescription>
              {getStatusDescription(status)}
            </StatusDescription>
          </StatusOption>
        ))}
      </Section>

      <Section>
        <SectionTitle>Add Notes</SectionTitle>
        <NotesInput
          placeholder="Add any notes about this status update"
          value={notes}
          onChange={handleNotesChange}
        />
      </Section>

      {currentStatus !== LoadStatus.DELIVERED && (
        <Section>
          <SectionTitle>Report Delay</SectionTitle>
          <TextArea
            placeholder="Reason for delay"
            value={delayReason}
            onChange={e => setDelayReason(e.target.value)}
          />
          <Button onPress={handleReportDelay}>Report Delay</Button>
        </Section>
      )}

      <Section>
        <SectionTitle>Report Exception</SectionTitle>
        <TextArea
          placeholder="Exception details"
          value={exceptionDetails}
          onChange={e => setExceptionDetails(e.target.value)}
        />
        <Button onPress={handleReportException}>Report Exception</Button>
      </Section>

      <ButtonContainer>
        <Button variant="secondary" onPress={handleCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} disabled={!selectedStatus}>
          Submit
        </Button>
      </ButtonContainer>

      {!isConnected && (
        <OfflineWarning>
          <OfflineWarningText>
            You are currently offline. Status update will be saved and
            submitted when you are back online.
          </OfflineWarningText>
        </OfflineWarning>
      )}
    </Container>
  );
};

const getStatusLabel = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.IN_TRANSIT:
      return 'In Transit';
    case LoadStatus.AT_PICKUP:
      return 'At Pickup';
    case LoadStatus.LOADED:
      return 'Loaded';
    case LoadStatus.AT_DROPOFF:
      return 'At Dropoff';
    case LoadStatus.DELIVERED:
      return 'Delivered';
    default:
      return 'Unknown Status';
  }
};

const getStatusDescription = (status: LoadStatus): string => {
  switch (status) {
    case LoadStatus.IN_TRANSIT:
      return 'En route to the next location';
    case LoadStatus.AT_PICKUP:
      return 'Arrived at the pickup location';
    case LoadStatus.LOADED:
      return 'Load has been picked up';
    case LoadStatus.AT_DROPOFF:
      return 'Arrived at the delivery location';
    case LoadStatus.DELIVERED:
      return 'Load has been delivered';
    default:
      return 'No description available';
  }
};

const checkNetworkStatus = async (): Promise<boolean> => {
  const netInfoState = await NetInfo.fetch();
  return netInfoState.isConnected === true;
};

export default StatusUpdater;

export type { StatusUpdaterProps };