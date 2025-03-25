import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux ^8.1.1
import { useRoute, useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.1.6
import NetInfo from '@react-native-community/netinfo'; // @react-native-community/netinfo ^9.3.10
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native'; // react-native ^0.72.4
import styled from 'styled-components'; // styled-components ^5.3.6

import {
  LoadStatus,
  LoadStatusUpdateParams, // Import load status enum and status update parameters interface
} from '../../../common/interfaces/load.interface';
import {
  LoadRouteProp,
  LoadNavigationProp,
} from '../navigation/types';
import StatusUpdater from '../components/StatusUpdater';
import { StatusUpdateService } from '../services/statusUpdateService';
import { DriverLocationService } from '../services/locationService';
import { updateLoadStatusAction } from '../store/actions/loadActions';
import Header from '../../../shared/components/layout/Header';
import Container from '../../../shared/components/layout/Container';
import Alert from '../../../shared/components/feedback/Alert';

/**
 * Styled container for the entire screen
 */
const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${props => props.theme.colors.background};
`;

/**
 * Styled container for the scrollable content
 */
const ContentContainer = styled(ScrollView)`
  flex: 1;
  padding: 16px;
`;

/**
 * Styled container for network connectivity warning
 */
const NetworkWarning = styled(View)`
  margin-bottom: 16px;
  padding: 12px;
  background-color: ${props => props.theme.colors.warning.light};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.warning.main};
`;

/**
 * Screen component for updating the status of an active load
 */
const StatusUpdateScreen: React.FC = () => {
  // LD1: Get the route and navigation objects using useRoute and useNavigation hooks
  const route = useRoute<LoadRouteProp<'StatusUpdate'>>();
  const navigation = useNavigation<LoadNavigationProp>();

  // LD2: Extract loadId and currentStatus from route.params
  const { loadId, currentStatus } = route.params;

  // LD3: Get the current user/driver ID from Redux state using useSelector
  const driverId = useSelector((state: any) => state.auth.user?.id);

  // LD4: Initialize state for loading indicator
  const [loading, setLoading] = useState(false);

  // LD5: Initialize state for error message
  const [error, setError] = useState('');

  // LD6: Initialize state for network connectivity status
  const [isConnected, setIsConnected] = useState(true);

  // LD7: Create instances of StatusUpdateService and DriverLocationService
  const statusUpdateService = React.useRef(new StatusUpdateService({} as any)).current;
  const locationService = React.useRef(new DriverLocationService(driverId, '', {})).current;

  // LD8: Create a function to handle status updates
  const handleStatusUpdate = useCallback(
    async (newStatus: LoadStatus, notes: string, additionalDetails: object) => {
      // Set loading state to true
      setLoading(true);

      // Clear any previous error messages
      setError('');

      // Create status update parameters with the new status, notes, and additional details
      const statusUpdateParams: LoadStatusUpdateParams = {
        status: newStatus,
        statusDetails: { notes, ...additionalDetails },
        updatedBy: driverId,
      };

      try {
        // Determine if this is a regular status update, delay report, or exception report
        if (newStatus === LoadStatus.DELAYED) {
          // Call the reportLoadDelay method on the statusUpdateService
          await statusUpdateService.reportLoadDelay(loadId, driverId, notes, additionalDetails);
        } else if (newStatus === LoadStatus.EXCEPTION) {
          // Call the reportLoadException method on the statusUpdateService
          await statusUpdateService.reportLoadException(loadId, driverId, notes, additionalDetails);
        } else {
          // Call the updateLoadStatus method on the statusUpdateService
          await statusUpdateService.updateLoadStatus(loadId, driverId, newStatus, statusUpdateParams);

          // If the update is successful, dispatch the updateLoadStatusAction to update Redux state
          dispatch(updateLoadStatusAction(loadId, statusUpdateParams));
        }

        // Navigate back to the active load screen on success
        navigation.goBack();
      } catch (e: any) {
        // If an error occurs, set the error message state
        setError(e.message || 'An error occurred while updating the status.');
      } finally {
        // Set loading state to false when complete
        setLoading(false);
      }
    },
    [dispatch, loadId, driverId, navigation, statusUpdateService]
  );

  // LD9: Create a function to handle navigation back to the active load screen
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // LD10: Use useEffect to check network connectivity on component mount
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected || false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    
      
        
          Update Load Status
        
        
          {isConnected ? null : (
            
              You are currently offline. Status updates will be saved and submitted when you are back online.
            
          )}
          {error ? (
            
              {error}
            
          ) : null}
          
        
      
    
  );
};

export default StatusUpdateScreen;