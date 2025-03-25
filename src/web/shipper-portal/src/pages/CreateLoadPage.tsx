# src/web/shipper-portal/src/pages/CreateLoadPage.tsx
```typescript
import React, { useState, useCallback } from 'react'; // React v18.2.0
import { useNavigate } from 'react-router-dom'; // React Router v6.10.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useDispatch } from 'react-redux'; // react-redux v8.0.5

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import LoadForm from '../components/loads/LoadForm';
import Button from '../../shared/components/buttons/Button';
import Card from '../../shared/components/cards/Card';
import Container from '../../shared/components/layout/Container';
import useNotification from '../../common/hooks/useNotification';
import { LoadCreationParams } from '../../common/interfaces/load.interface';
import { createLoad } from '../services/loadService';
import { createLoad as createLoadAction } from '../store/actions/loadActions';

/**
 * Styled component for the main content area
 */
const ContentArea = styled.div`
  padding: ${theme.spacing.lg};
`;

/**
 * Styled container for buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

/**
 * Main component for the load creation page
 */
const CreateLoadPage: React.FC = () => {
  // LD1: Initialize navigate function from useNavigate hook
  const navigate = useNavigate();

  // LD1: Initialize dispatch function from useDispatch hook
  const dispatch = useDispatch();

  // LD1: Initialize notification hook for displaying success/error messages
  const { showNotification } = useNotification();

  // LD1: Set up loading state using useState(false)
  const [isLoading, setIsLoading] = useState(false);

  // LD1: Define handleSubmit function to process form submission
  const handleSubmit = useCallback(async (values: LoadCreationParams) => {
    setIsLoading(true);
    try {
      // LD1: Dispatch the createLoad action to Redux store
      await dispatch(createLoadAction(values));

      // LD1: Call the createLoad service function to create the load
      await createLoad(values);

      // LD1: Show success notification
      showNotification({ type: 'success', message: 'Load created successfully!' });

      // LD1: Navigate back to the loads list page
      navigate('/loads');
    } catch (error: any) {
      // LD1: Show error notification
      showNotification({ type: 'error', message: error.message || 'Failed to create load. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, navigate, showNotification]);

  // LD1: Define handleCancel function to navigate back to loads list
  const handleCancel = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  // LD1: Define initialValues object with default values for the form
  const initialValues: Partial<LoadCreationParams> = {
    referenceNumber: '',
    description: '',
    equipmentType: 'dry_van',
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    volume: 0,
    pallets: 0,
    commodity: '',
    pickupEarliest: '',
    pickupLatest: '',
    deliveryEarliest: '',
    deliveryLatest: '',
    offeredRate: 0,
    specialInstructions: '',
    isHazardous: false,
    temperatureRequirements: null,
    locations: [],
  };

  // LD1: Render MainLayout component as the page container
  return (
    <MainLayout>
      {/* LD1: Render PageHeader with title and cancel button */}
      <PageHeader
        title="Create New Load"
        actions={
          <ButtonContainer>
            <Button type="button" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
          </ButtonContainer>
        }
      />
      <ContentArea>
        <Card>
          {/* LD1: Render LoadForm component with props for handling submission */}
          <LoadForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
            isLoading={isLoading}
          />
        </Card>
      </ContentArea>
    </MainLayout>
  );
};

// IE3: Export the CreateLoadPage component as the default export
export default CreateLoadPage;