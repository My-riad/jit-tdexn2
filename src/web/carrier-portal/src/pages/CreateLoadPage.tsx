import React, { useState, useEffect } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNavigate } from 'react-router-dom'; // version ^6.8.0
import { useDispatch } from 'react-redux'; // version ^8.0.5

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import LoadForm from '../components/loads/LoadForm';
import useAuth from '../../../common/hooks/useAuth';
import { createLoad } from '../store/actions/loadActions';
import { createCarrierLoad } from '../services/loadService';

// Styled component for the page container with padding and max-width
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

// Styled component for displaying error messages
const ErrorMessage = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
`;

// Styled component for displaying a loading overlay
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

/**
 * Page component for creating a new load in the carrier portal
 * @returns {JSX.Element} Rendered create load page component
 */
const CreateLoadPage: React.FC = () => {
  // Get navigation function from useNavigate hook
  const navigate = useNavigate();

  // Get dispatch function from useDispatch hook
  const dispatch = useDispatch();

  // Get authentication state from useAuth hook
  const { authState } = useAuth();

  // Extract carrier ID from auth state
  const carrierId = authState.user?.carrierId;

  // Initialize loading state with useState(false)
  const [loading, setLoading] = useState(false);

  // Initialize error state with useState(null)
  const [error, setError] = useState<string | null>(null);

  // Define handleSubmit function to handle form submission
  const handleSubmit = async (loadData: any) => {
    // In handleSubmit, set loading to true
    setLoading(true);
    setError(null);

    try {
      if (!carrierId) {
        throw new Error('Carrier ID is missing.');
      }
      // Try to create the load using createCarrierLoad service
      const createdLoad = await createCarrierLoad(carrierId, loadData);

      // Dispatch createLoad action with the created load
      dispatch(createLoad({ carrierId, loadData: createdLoad }));

      // Navigate to the loads list page on success
      navigate('/loads');
    } catch (error: any) {
      // Catch and handle any errors during submission
      setError(error.message || 'Failed to create load');
    } finally {
      // Set loading to false
      setLoading(false);
    }
  };

  // Define handleCancel function to navigate back to loads list
  const handleCancel = () => {
    navigate('/loads');
  };

  // Render MainLayout as the page container
  return (
    <MainLayout>
      {/* Render PageHeader with title 'Create Load' and breadcrumb navigation */}
      <PageHeader
        title="Create Load"
        breadcrumbItems={[
          { label: 'Loads', href: '/loads' },
          { label: 'Create Load', href: '/loads/create' },
        ]}
      />
      <PageContainer>
        {/* Display error message when error exists */}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Render LoadForm with carrierId and submission handlers */}
        <LoadForm carrierId={carrierId} onSubmit={handleSubmit} onCancel={handleCancel} />

        {/* Display loading indicator when loading is true */}
        {loading && (
          <LoadingOverlay>
            <div>Loading...</div>
          </LoadingOverlay>
        )}
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the CreateLoadPage component as the default export
export default CreateLoadPage;