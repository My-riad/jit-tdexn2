import React, { useEffect } from 'react'; // React core library for UI components // version ^18.2.0
import { CashIcon } from '@heroicons/react/24/outline'; // Heroicons cash icon for visual representation // version ^2.0.13
import { useSelector, useDispatch } from 'react-redux'; // React Redux hooks for accessing store state and dispatching actions // version ^8.0.5
import { useNavigate } from 'react-router-dom'; // React Router hook for navigation // version ^6.6.0
import StatsCard from '../../../../shared/components/cards/StatsCard'; // Base stats card component for displaying statistical information
import { theme } from '../../../../shared/styles/theme'; // Theme variables for consistent styling
import { fetchOptimizationSavings } from '../../../store/actions/analyticsActions'; // Redux action creator to fetch optimization savings metrics
import { RootState } from '../../../store'; // Type definition for the Redux store state
import { SHIPPER_PORTAL_ROUTES } from '../../../../common/constants/routes'; // Route constants for navigation
import { formatCurrency } from '../../../../common/utils/formatters'; // Utility function to format currency values

/**
 * A card component that displays optimization savings metrics for the shipper
 * @returns Rendered optimization savings card component
 */
const OptimizationSavingsCard: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD1: Initialize dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // LD2: Select analytics state from Redux store using useSelector
  const analyticsState = useSelector((state: RootState) => state.analytics);

  // LD3: Extract optimization savings data and loading state from the analytics state
  const { optimizationSavings, loading } = analyticsState;

  // LD4: Extract thisWeek, thisMonth, and ytd savings values from optimization savings data
  const thisWeek = optimizationSavings?.thisWeek || 0;
  const thisMonth = optimizationSavings?.thisMonth || 0;
  const ytd = optimizationSavings?.ytd || 0;

  // LD5: Calculate trend percentage based on historical data if available
  const trend = optimizationSavings?.trend && optimizationSavings.trend.length > 1
    ? ((optimizationSavings.trend[optimizationSavings.trend.length - 1].savings -
        optimizationSavings.trend[optimizationSavings.trend.length - 2].savings) /
        optimizationSavings.trend[optimizationSavings.trend.length - 2].savings) * 100
    : 0;

  // LD6: Use useEffect to fetch optimization savings data when component mounts
  useEffect(() => {
    // Dispatch the fetchOptimizationSavings action to load the data
    dispatch(fetchOptimizationSavings());
  }, [dispatch]);

  // LD7: Format the monthly savings value as currency using formatCurrency utility
  const formattedMonthlySavings = formatCurrency(thisMonth);

  // LD8: Render StatsCard with monthly savings amount
  return (
    <StatsCard
      title="Optimization Savings"
      value={formattedMonthlySavings}
      subtitle={`This Week: ${formatCurrency(thisWeek)}   YTD: ${formatCurrency(ytd)}`}
      icon={<CashIcon />} // LD9: Add CashIcon as the card icon
      color="success" // LD10: Set appropriate color (success) for the savings card
      trend={trend} // LD11: Add trend indicator showing percentage change
      onClick={() => navigate(SHIPPER_PORTAL_ROUTES.ANALYTICS)} // LD12: Add click handler to navigate to analytics page
      loading={loading.optimizationSavings}
    />
  );
};

// IE3: Export the OptimizationSavingsCard component for use in the shipper dashboard
export default OptimizationSavingsCard;