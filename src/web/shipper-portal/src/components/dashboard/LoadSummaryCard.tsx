import React, { useEffect } from 'react'; // version ^18.2.0
import { TruckIcon } from '@heroicons/react/24/outline'; // version ^2.0.13
import { useSelector, useDispatch } from 'react-redux'; // version ^8.0.5
import { useNavigate } from 'react-router-dom'; // version ^6.6.0
import StatsCard from '../../../../shared/components/cards/StatsCard';
import { LoadStatus, LoadSummary } from '../../../../common/interfaces/load.interface';
import { fetchLoads } from '../../../store/actions/loadActions';
import { RootState } from '../../../store';
import { theme } from '../../../../shared/styles/theme';
import { SHIPPER_PORTAL_ROUTES } from '../../../../common/constants/routes';

/**
 * A card component that displays a summary of the shipper's loads
 */
const LoadSummaryCard: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD2: Initialize dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // LD3: Select load state from Redux store using useSelector
  const loadState = useSelector((state: RootState) => state.loads);

  // LD4: Extract loads array and loading state from the load state
  const { loads, loading } = loadState;

  // LD5: Calculate total loads count from the loads array
  const totalLoads = loads?.length || 0;

  // LD6: Calculate pending loads by filtering loads with PENDING status
  const pendingLoads = loads?.filter(load => load.status === LoadStatus.PENDING)?.length || 0;

  // LD7: Calculate completed loads by filtering loads with COMPLETED status
  const completedLoads = loads?.filter(load => load.status === LoadStatus.COMPLETED)?.length || 0;

  // LD8: Calculate trend percentage based on previous period (if available)
  const trendPercentage = 0; // Placeholder for trend calculation

  // LD9: Use useEffect to fetch loads data when component mounts
  useEffect(() => {
    // Dispatch fetchLoads action to retrieve loads data
    dispatch(fetchLoads());
  }, [dispatch]);

  // LD10: Render StatsCard with total loads count
  return (
    <StatsCard
      title="Total Loads"
      value={totalLoads}
      subtitle={`${pendingLoads} Pending, ${completedLoads} Completed`}
      icon={<TruckIcon />}
      color="primary"
      trend={trendPercentage}
      onClick={() => navigate(SHIPPER_PORTAL_ROUTES.LOADS)} // LD11: Add click handler to navigate to loads page
    />
  );
};

export default LoadSummaryCard;