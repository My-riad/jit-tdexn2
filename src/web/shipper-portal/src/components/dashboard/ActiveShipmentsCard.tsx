import React, { useEffect } from 'react';
import { TruckIcon } from '@heroicons/react/24/outline'; // version ^2.0.13
import { useSelector, useDispatch } from 'react-redux'; // version ^8.0.5
import { useNavigate } from 'react-router-dom'; // version ^6.6.0

import StatsCard from '../../../../shared/components/cards/StatsCard';
import { LoadStatus } from '../../../../common/interfaces/load.interface';
import { fetchLoads } from '../../../store/actions/loadActions';
import { RootState } from '../../../store';
import { theme } from '../../../../shared/styles/theme';
import { SHIPPER_PORTAL_ROUTES } from '../../../../common/constants/routes';

/**
 * A card component that displays a summary of active shipments for the shipper
 * @returns Rendered active shipments card component
 */
const ActiveShipmentsCard: React.FC = () => {
  // LD1: Initialize navigate function using useNavigate hook
  const navigate = useNavigate();

  // LD1: Initialize dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // LD1: Select load state from Redux store using useSelector hook
  const loadState = useSelector((state: RootState) => state.loads);

  // LD1: Extract loads array and loading state from the load state
  const { loads, loading } = loadState;

  // LD5: Calculate total active shipments by filtering loads with active statuses (IN_TRANSIT, AT_PICKUP, AT_DROPOFF)
  const totalActiveShipments = loads.filter(load =>
    load.status === LoadStatus.IN_TRANSIT ||
    load.status === LoadStatus.AT_PICKUP ||
    load.status === LoadStatus.AT_DROPOFF
  ).length;

  // LD5: Calculate in-transit shipments by filtering loads with IN_TRANSIT status
  const inTransitShipments = loads.filter(load => load.status === LoadStatus.IN_TRANSIT).length;

  // LD5: Calculate at-pickup shipments by filtering loads with AT_PICKUP status
  const atPickupShipments = loads.filter(load => load.status === LoadStatus.AT_PICKUP).length;

  // LD5: Calculate at-delivery shipments by filtering loads with AT_DROPOFF status
  const atDeliveryShipments = loads.filter(load => load.status === LoadStatus.AT_DROPOFF).length;

  // LD5: Calculate trend percentage based on previous period (if available)
  const trendPercentage = 0; // Placeholder for trend calculation

  // LD6: Use useEffect to fetch loads data when component mounts
  useEffect(() => {
    // Fetch loads data with a limit of 1000 to get all active shipments
    dispatch(fetchLoads({ limit: 1000 }));
  }, [dispatch]);

  // LD7: Render StatsCard with total active shipments count
  return (
    <StatsCard
      title="Active Shipments"
      value={loading ? "Loading..." : totalActiveShipments}
      subtitle={`${inTransitShipments} In Transit, ${atPickupShipments} At Pickup, ${atDeliveryShipments} At Delivery`}
      icon={<TruckIcon />}
      color={totalActiveShipments > 10 ? "warning" : "primary"} // LD8: Set appropriate color based on active shipment count
      onClick={() => navigate(SHIPPER_PORTAL_ROUTES.TRACKING)} // LD8: Add click handler to navigate to tracking page
    />
  );
};

export default ActiveShipmentsCard;