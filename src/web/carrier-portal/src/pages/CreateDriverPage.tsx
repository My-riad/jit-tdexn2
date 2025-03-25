import React, { useState, useCallback } from 'react'; // version ^18.2.0
import { useNavigate } from 'react-router-dom'; // version ^6.4.0
import styled from 'styled-components'; // version ^5.3.6

import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import DriverForm from '../../components/drivers/DriverForm';
import { createDriver } from '../../services/driverService';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import { useNotification } from '../../../common/hooks/useNotification';
import { DriverCreationParams } from '../../../common/interfaces/driver.interface';

// LD1: Breadcrumb navigation items for the page header
const BREADCRUMB_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Drivers', href: '/drivers' },
  { label: 'Create Driver', href: '/drivers/create' }
];

// LD1: Styled component for the page content with appropriate padding and spacing
const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

// LD1: Styled component for the driver form with appropriate styling and layout
const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

/**
 * LD1: Page component for creating a new driver
 * @returns {JSX.Element} Rendered page component
 */
const CreateDriverPage: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD1: Initialize notification functions using useNotification hook
  const { showSuccessNotification, showErrorNotification } = useNotification();

  // LD1: Get current carrier ID from authentication context
  const { authState } = useAuthContext();
  const carrierId = authState.user?.carrierId;

  // LD1: Set up loading state with useState
  const [loading, setLoading] = useState(false);

  // LD1: Define handleSubmit function to process form submission
  const handleSubmit = useCallback(async (driverData: DriverCreationParams) => {
    // LD1: Check if carrierId exists, show error if not
    if (!carrierId) {
      showErrorNotification({
        message: 'Carrier ID is missing. Please contact support.',
        type: 'error',
        title: 'Missing Information'
      });
      return;
    }

    try {
      // LD1: Set loading state to true
      setLoading(true);

      // LD1: Call createDriver service with form data and carrier ID
      await createDriver({ ...driverData, carrierId });

      // LD1: Show success notification on successful creation
      showSuccessNotification({
        message: 'Driver created successfully!',
        type: 'success',
        title: 'Success'
      });

      // LD1: Navigate to driver list page after successful creation
      navigate('/drivers');
    } catch (error: any) {
      // LD1: Show error notification if creation fails
      showErrorNotification({
        message: error.message || 'Failed to create driver. Please try again.',
        type: 'error',
        title: 'Error'
      });
    } finally {
      // LD1: Set loading state to false
      setLoading(false);
    }
  }, [carrierId, navigate, showSuccessNotification, showErrorNotification]);

  // LD1: Define handleCancel function to navigate back to driver list
  const handleCancel = useCallback(() => {
    navigate('/drivers');
  }, [navigate]);

  // LD1: Render MainLayout as the page container
  return (
    <MainLayout>
      {/* LD1: Render PageHeader with title and breadcrumb navigation */}
      <PageHeader title="Create New Driver" breadcrumbItems={BREADCRUMB_ITEMS} />

      {/* LD1: Render PageContainer for content spacing */}
      <PageContainer>
        {/* LD1: Render FormContainer for form layout */}
        <FormContainer>
          {/* LD1: Render DriverForm with submission and cancel handlers */}
          <DriverForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
        </FormContainer>
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the CreateDriverPage component as the default export
export default CreateDriverPage;