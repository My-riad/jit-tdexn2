import React, { useState, useCallback } from 'react'; // React v18.2.0
import { useNavigate } from 'react-router-dom'; // react-router-dom ^6.8.0
import { useDispatch } from 'react-redux'; // react-redux ^8.0.5
import styled from 'styled-components'; // styled-components ^5.3.6

import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import TruckForm from '../../components/fleet/TruckForm';
import { useAuthContext } from '../../../common/hooks/useAuth';
import { Vehicle } from '../../../common/interfaces/vehicle.interface';
import { createNewVehicle } from '../../store/actions/fleetActions';

/**
 * Container for the page content with proper spacing and layout
 */
const PageContent = styled.div`
  padding: 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
`;

/**
 * Styled component for displaying error messages
 */
const ErrorMessage = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #f5c6cb;
`;

/**
 * Container for the loading indicator
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

/**
 * Component for creating a new vehicle in the carrier portal
 * @returns Rendered page component
 */
const CreateVehiclePage: React.FC = () => {
  // Initialize navigate function from useNavigate hook
  const navigate = useNavigate();

  // Initialize dispatch function from useDispatch hook
  const dispatch = useDispatch();

  // Get authentication state from useAuth hook
  const { authState } = useAuthContext();

  // Extract carrier ID from authenticated user
  const carrierId = authState.user?.carrierId || '';

  // Set up loading state with useState
  const [loading, setLoading] = useState(false);

  // Set up error state with useState
  const [error, setError] = useState<string | null>(null);

  // Define handleSuccess function to handle successful vehicle creation
  const handleSuccess = useCallback(
    (vehicle: Vehicle) => {
      // Dispatch createNewVehicle action to update Redux store
      dispatch(createNewVehicle(vehicle));

      // Navigate back to the fleet page
      navigate('/carrier/fleet');
    },
    [dispatch, navigate]
  );

  // Define handleCancel function to navigate back to fleet page
  const handleCancel = useCallback(() => {
    navigate('/carrier/fleet');
  }, [navigate]);

  // Render MainLayout component as the page wrapper
  return (
    <MainLayout>
      {/* Render PageHeader with title 'Add New Vehicle' and breadcrumbs */}
      <PageHeader
        title="Add New Vehicle"
        breadcrumbItems={[
          { label: 'Fleet', href: '/carrier/fleet' },
          { label: 'Add New Vehicle', href: '/carrier/fleet/vehicles/create' },
        ]}
      />

      {/* Render PageContent container */}
      <PageContent>
        {/* Render TruckForm component with carrier ID and callback functions */}
        <TruckForm
          carrierId={carrierId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </PageContent>

      {/* Display loading indicator when loading is true */}
      {loading && (
        <LoadingContainer>
          {/* TODO: Replace with actual loading indicator component */}
          Loading...
        </LoadingContainer>
      )}

      {/* Display error message when error exists */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </MainLayout>
  );
};

// IE3: Export the CreateVehiclePage component as the default export
export default CreateVehiclePage;