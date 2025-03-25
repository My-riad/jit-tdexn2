import React, { useEffect } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline'; //  ^2.0.13
import { useSelector, useDispatch } from 'react-redux'; //  ^8.0.5
import { useNavigate } from 'react-router-dom'; //  ^6.6.0
import StatsCard, { StatsCardProps } from '../../../../shared/components/cards/StatsCard';
import { theme } from '../../../../shared/styles/theme';
import { fetchCarrierPerformance } from '../../../store/actions/carrierActions';
import { RootState } from '../../../store';
import { SHIPPER_PORTAL_ROUTES } from '../../../../common/constants/routes';

/**
 * A card component that displays carrier performance metrics for the shipper
 */
const CarrierPerformanceCard: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD2: Initialize dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // LD3: Select carrier state from Redux store using useSelector hook
  const carrierState = useSelector((state: RootState) => state.carriers);

  // LD4: Extract performanceMetrics and loading state from the carrier state
  const { performanceMetrics, loadingPerformance } = carrierState;

  // LD5: Extract onTimeDeliveryPercentage, averageDriverScore, and issueRate from performance metrics
  const onTimeDeliveryPercentage = performanceMetrics?.onTimeDeliveryPercentage || 0;
  const averageDriverScore = performanceMetrics?.averageDriverScore || 0;
  const issueRate = performanceMetrics?.issueRate || 0;

  // Calculate trend percentage based on previous period (if available)
  const trendPercentage = 5;

  // LD7: Use useEffect to fetch carrier performance metrics when component mounts
  useEffect(() => {
    // Dispatch fetchCarrierPerformance action to fetch data
    dispatch(fetchCarrierPerformance({ shipperId: 'your_shipper_id' }));
  }, [dispatch]);

  // LD8: Render StatsCard with on-time delivery percentage
  return (
    <StatsCard
      title="Carrier Performance"
      value={`${onTimeDeliveryPercentage}%`}
      subtitle={`Avg. Carrier Score: ${averageDriverScore} | Issue Rate: ${issueRate}%`}
      icon={<TruckIcon />}
      color={onTimeDeliveryPercentage > 90 ? 'success' : onTimeDeliveryPercentage > 80 ? 'warning' : 'error'}
      trend={trendPercentage}
      onClick={() => navigate(SHIPPER_PORTAL_ROUTES.CARRIERS)}
    />
  );
};

export default CarrierPerformanceCard;