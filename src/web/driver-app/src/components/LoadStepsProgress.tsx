import React from 'react';
import styled from 'styled-components';
import { LoadStatus } from '../../../common/interfaces/load.interface';
import { colors } from '../styles/colors';

/**
 * Props for the LoadStepsProgress component
 */
interface LoadStepsProgressProps {
  currentStatus: LoadStatus;
  compact?: boolean;
  showLabels?: boolean;
}

/**
 * The ordered sequence of load statuses for the progress visualization
 */
const LOAD_STATUS_SEQUENCE = [
  LoadStatus.ASSIGNED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.AT_PICKUP,
  LoadStatus.LOADED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.AT_DROPOFF,
  LoadStatus.DELIVERED,
  LoadStatus.COMPLETED
];

/**
 * Mapping of load statuses to user-friendly labels
 */
const STATUS_LABELS: Record<LoadStatus, string> = {
  [LoadStatus.ASSIGNED]: 'Assigned',
  [LoadStatus.IN_TRANSIT]: 'In Transit',
  [LoadStatus.AT_PICKUP]: 'At Pickup',
  [LoadStatus.LOADED]: 'Loaded',
  [LoadStatus.AT_DROPOFF]: 'At Delivery',
  [LoadStatus.DELIVERED]: 'Delivered',
  [LoadStatus.COMPLETED]: 'Completed'
};

/**
 * Helper function to get a user-friendly label for each load status
 */
const getStatusLabel = (status: LoadStatus): string => {
  return STATUS_LABELS[status] || status;
};

/**
 * Helper function to determine the color for a step based on its state
 */
const getStatusColor = (isCompleted: boolean, isCurrent: boolean): string => {
  if (isCompleted) {
    return colors.semantic.success;
  }
  if (isCurrent) {
    return colors.primary.blue;
  }
  return colors.ui.border;
};

/**
 * Container for the entire progress steps component
 */
const ProgressContainer = styled.View`
  padding: 16px;
  margin-vertical: 8px;
  background-color: ${props => props.theme.colors.ui.card};
  border-radius: 8px;
`;

/**
 * Container for the steps and connecting lines
 */
const StepsContainer = styled.View<{ showLabels?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.showLabels ? '12px' : '0'};
`;

/**
 * Individual step indicator
 */
const Step = styled.View<{ isCompleted: boolean; isCurrent: boolean }>`
  width: ${props => props.isCurrent ? '24px' : '20px'};
  height: ${props => props.isCurrent ? '24px' : '20px'};
  border-radius: ${props => props.isCurrent ? '12px' : '10px'};
  background-color: ${props => getStatusColor(props.isCompleted, props.isCurrent)};
  justify-content: center;
  align-items: center;
  z-index: 2;
`;

/**
 * Line connecting steps
 */
const StepLine = styled.View<{ isCompleted: boolean }>`
  flex: 1;
  height: 2px;
  background-color: ${props => props.isCompleted ? props.theme.colors.semantic.success : props.theme.colors.ui.border};
  margin-horizontal: 4px;
  z-index: 1;
`;

/**
 * Container for step labels
 */
const StepLabelContainer = styled.View<{ compact?: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  padding-horizontal: ${props => props.compact ? '4px' : '8px'};
`;

/**
 * Text label for each step
 */
const StepLabel = styled.Text<{ isCompleted: boolean; isCurrent: boolean; compact?: boolean }>`
  font-size: ${props => props.compact ? '10px' : '12px'};
  color: ${props => props.isCurrent ? props.theme.colors.text.primary : props.isCompleted ? props.theme.colors.semantic.success : props.theme.colors.text.secondary};
  font-weight: ${props => props.isCurrent ? 'bold' : 'normal'};
  text-align: center;
  max-width: ${props => props.compact ? '40px' : '60px'};
`;

/**
 * Icon inside the step indicator
 */
const StepIcon = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

/**
 * Component that displays the load status progress as a series of steps
 */
const LoadStepsProgress: React.FC<LoadStepsProgressProps> = ({ 
  currentStatus, 
  compact = false, 
  showLabels = true 
}) => {
  // Find the current step index based on the current status
  let currentStepIndex = -1;
  
  // Handle special case for IN_TRANSIT which appears twice in the sequence
  if (currentStatus === LoadStatus.IN_TRANSIT) {
    // For simplicity, use the first occurrence
    // In a real implementation, we would need additional context
    currentStepIndex = LOAD_STATUS_SEQUENCE.indexOf(LoadStatus.IN_TRANSIT);
  } else {
    currentStepIndex = LOAD_STATUS_SEQUENCE.indexOf(currentStatus);
  }
  
  if (currentStepIndex === -1) {
    // If status isn't in the sequence, don't render anything
    return null;
  }
  
  return (
    <ProgressContainer>
      <StepsContainer showLabels={showLabels}>
        {LOAD_STATUS_SEQUENCE.map((status, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <React.Fragment key={`${status}-${index}`}>
              {index > 0 && (
                <StepLine isCompleted={index <= currentStepIndex} />
              )}
              <Step 
                isCompleted={isCompleted}
                isCurrent={isCurrent}
              >
                {isCompleted && <StepIcon>✓</StepIcon>}
              </Step>
            </React.Fragment>
          );
        })}
      </StepsContainer>
      
      {showLabels && (
        <StepLabelContainer compact={compact}>
          {LOAD_STATUS_SEQUENCE.map((status, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            // Adjust label for the second IN_TRANSIT occurrence
            let label = getStatusLabel(status);
            if (status === LoadStatus.IN_TRANSIT && index > 3) { // If it's the second IN_TRANSIT
              label = 'To Delivery';
            } else if (status === LoadStatus.IN_TRANSIT && index <= 3) { // If it's the first IN_TRANSIT
              label = 'To Pickup';
            }
            
            return (
              <StepLabel 
                key={`label-${status}-${index}`}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                compact={compact}
              >
                {label}
              </StepLabel>
            );
          })}
        </StepLabelContainer>
      )}
    </ProgressContainer>
  );
};

export default LoadStepsProgress;