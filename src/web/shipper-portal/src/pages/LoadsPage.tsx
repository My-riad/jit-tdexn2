import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import { useNavigate } from 'react-router-dom'; // version ^6.8.1
import styled from 'styled-components'; // version ^5.3.6
import { format, subDays } from 'date-fns'; // version ^2.29.3

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import LoadList from '../components/loads/LoadList';
import Button from '../../shared/components/buttons/Button';
import Card from '../../shared/components/cards/Card';
import { LoadStatus, EquipmentType } from '../../common/interfaces/load.interface';
import useNotification from '../../common/hooks/useNotification';
import { SHIPPER_PORTAL_ROUTES } from '../../common/constants/routes';
import { theme } from '../../shared/styles/theme';

// LD1: Define default filter options for the load list
const DEFAULT_FILTER_OPTIONS = {
  status: [],
  equipmentType: [],
  dateRange: [subDays(new Date(), 30), new Date()],
};

// LD1: Define breadcrumb configuration for the loads page
const BREADCRUMBS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Loads', path: '/loads' },
];

// LD1: Styled component for the page content container
const PageContainer = styled.div`
  padding: ${theme.spacing.md};
  max-width: 1200px;
  margin: 0 auto;
`;

// LD1: Styled Card component for the load list
const LoadListCard = styled(Card)`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// LD1: Styled container for filter controls
const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * LD1: Main component for the loads page that displays a list of loads with filtering and creation capabilities
 * @returns {JSX.Element} Rendered loads page component
 */
const LoadsPage: React.FC = () => {
  // LD1: Initialize navigate function with useNavigate hook for programmatic navigation
  const navigate = useNavigate();

  // LD1: Initialize notification functionality with useNotification hook
  const useNotificationHook = useNotification();

  // LD1: Set up state for filter options using useState
  const [filterOptions, setFilterOptions] = useState(DEFAULT_FILTER_OPTIONS);

  /**
   * LD1: Handler function to navigate to the load creation page
   * @returns {void} No return value
   */
  const handleCreateLoad = useCallback(() => {
    // LD1: Use navigate function to redirect to the create load route
    navigate(SHIPPER_PORTAL_ROUTES.CREATE_LOAD);
  }, [navigate]);

  /**
   * LD1: Handler function to navigate to the load detail page when a load is selected
   * @param {string} loadId - The ID of the selected load
   * @returns {void} No return value
   */
  const handleLoadSelect = useCallback((loadId: string) => {
    // LD1: Use navigate function to redirect to the load detail route with the selected load ID
    navigate(SHIPPER_PORTAL_ROUTES.LOAD_DETAIL.replace(':loadId', loadId));
  }, [navigate]);

  /**
   * LD1: Handler function to update the filter options state
   * @param {object} newFilters - The new filter values
   * @returns {void} No return value
   */
  const handleFilterChange = useCallback((newFilters: any) => {
    // LD1: Update the filterOptions state with the new filter values
    setFilterOptions(prevFilters => ({
      ...prevFilters,
      ...newFilters, // LD1: Merge the new filters with existing filters to maintain unmodified values
    }));
  }, []);

  // LD1: Render MainLayout component for consistent page structure
  return (
    <MainLayout>
      {/* LD1: Render PageHeader with title, breadcrumbs, and create load button */}
      <PageHeader
        title="Loads"
        breadcrumbs={BREADCRUMBS}
        actions={[
          <Button key="create-load" variant="primary" onClick={handleCreateLoad}>
            Create Load
          </Button>,
        ]}
      />

      {/* LD1: Render Card component containing the LoadList */}
      <LoadListCard>
        {/* LD1: Render LoadList component with filter options and handlers */}
        <LoadList
          filterOptions={filterOptions}
          onLoadSelect={handleLoadSelect}
        />
      </LoadListCard>
    </MainLayout>
  );
};

// IE3: Export the loads page component
export default LoadsPage;