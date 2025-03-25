import { Dispatch } from 'redux'; // ^4.2.0
import { ThunkAction } from 'redux-thunk'; // ^2.4.2
import driverApi from '../../../common/api/driverApi';

/**
 * Enum of action types for earnings-related Redux actions
 */
export enum EarningsActionTypes {
  FETCH_EARNINGS_REQUEST = 'FETCH_EARNINGS_REQUEST',
  FETCH_EARNINGS_SUCCESS = 'FETCH_EARNINGS_SUCCESS',
  FETCH_EARNINGS_FAILURE = 'FETCH_EARNINGS_FAILURE',
  
  FETCH_EARNINGS_HISTORY_REQUEST = 'FETCH_EARNINGS_HISTORY_REQUEST',
  FETCH_EARNINGS_HISTORY_SUCCESS = 'FETCH_EARNINGS_HISTORY_SUCCESS',
  FETCH_EARNINGS_HISTORY_FAILURE = 'FETCH_EARNINGS_HISTORY_FAILURE',
  
  UPDATE_EARNINGS_GOALS_REQUEST = 'UPDATE_EARNINGS_GOALS_REQUEST',
  UPDATE_EARNINGS_GOALS_SUCCESS = 'UPDATE_EARNINGS_GOALS_SUCCESS',
  UPDATE_EARNINGS_GOALS_FAILURE = 'UPDATE_EARNINGS_GOALS_FAILURE',
  
  UPDATE_EARNINGS_DISPLAY = 'UPDATE_EARNINGS_DISPLAY'
}

/**
 * Union type of all possible earnings actions for type safety in the reducer
 */
export type EarningsAction = {
  type: EarningsActionTypes;
  payload?: any;
};

/**
 * Thunk action creator that fetches driver earnings data from the API
 * 
 * @param driverId - The unique identifier of the driver
 * @returns Thunk action that fetches driver earnings
 */
export const fetchDriverEarnings = (
  driverId: string
): ThunkAction<void, any, unknown, EarningsAction> => {
  return async (dispatch: Dispatch<EarningsAction>) => {
    try {
      // Indicate loading state
      dispatch({ type: EarningsActionTypes.FETCH_EARNINGS_REQUEST });
      
      // Call the API to get driver data
      const driverData = await driverApi.getDriverById(driverId);
      
      // Get performance metrics for earnings calculations
      const performanceData = await driverApi.getDriverPerformance(driverId, {
        period: 'month' // Get current month's data
      });
      
      // Extract and calculate earnings data
      const earningsData = {
        thisWeek: Math.round(performanceData.revenueGenerated * 0.25), // Estimate for current week
        thisMonth: performanceData.revenueGenerated,
        efficiencyBonus: Math.round(performanceData.revenueGenerated * (driverData.efficiencyScore / 100)), 
        regularEarnings: Math.round(performanceData.revenueGenerated * (1 - (driverData.efficiencyScore / 100))),
        goalProgress: Math.min(Math.round((performanceData.revenueGenerated / 8000) * 100), 100), // Assuming monthly goal of $8000
        efficiencyScore: driverData.efficiencyScore
      };
      
      // Dispatch success with earnings data
      dispatch({
        type: EarningsActionTypes.FETCH_EARNINGS_SUCCESS,
        payload: earningsData
      });
    } catch (error) {
      // Handle and dispatch any errors
      dispatch({
        type: EarningsActionTypes.FETCH_EARNINGS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Thunk action creator that fetches driver earnings history from the API
 * 
 * @param driverId - The unique identifier of the driver
 * @param options - Optional query parameters like period, start/end dates
 * @returns Thunk action that fetches earnings history
 */
export const fetchEarningsHistory = (
  driverId: string,
  options: { period?: string; startDate?: string; endDate?: string } = {}
): ThunkAction<void, any, unknown, EarningsAction> => {
  return async (dispatch: Dispatch<EarningsAction>) => {
    try {
      // Indicate loading state
      dispatch({ type: EarningsActionTypes.FETCH_EARNINGS_HISTORY_REQUEST });
      
      // Call the API to get driver performance metrics
      const performanceData = await driverApi.getDriverPerformance(driverId, options);
      
      // Format the data for history display
      // In a real implementation, this would parse actual historical data from the API
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Generate sample daily data for the current month
      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const day = new Date(currentYear, currentMonth, i + 1);
        // Skip future dates
        if (day > currentDate) return null;
        
        return {
          date: day.toISOString().split('T')[0],
          amount: Math.round(50 + Math.random() * 200) // Random daily amount between $50-$250
        };
      }).filter(Boolean);
      
      // Generate sample weekly data for past 12 weeks
      const weeklyData = Array.from({ length: 12 }, (_, i) => {
        const weekNum = currentDate.getDay() + (i * 7);
        const weekDate = new Date(currentDate);
        weekDate.setDate(weekDate.getDate() - weekNum);
        
        return {
          week: `${weekDate.getFullYear()}-W${Math.ceil((weekDate.getDate() + weekDate.getDay()) / 7)}`,
          amount: Math.round(1000 + Math.random() * 500) // Random weekly amount between $1000-$1500
        };
      });
      
      // Generate sample monthly data for past 12 months
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(currentYear, currentMonth - i, 1);
        
        return {
          month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          amount: Math.round(4000 + Math.random() * 1000) // Random monthly amount between $4000-$5000
        };
      });
      
      const earningsHistory = {
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
        totalRevenue: performanceData.revenueGenerated,
        averagePerMile: performanceData.revenuePerMile
      };
      
      // Dispatch success with history data
      dispatch({
        type: EarningsActionTypes.FETCH_EARNINGS_HISTORY_SUCCESS,
        payload: earningsHistory
      });
    } catch (error) {
      // Handle and dispatch any errors
      dispatch({
        type: EarningsActionTypes.FETCH_EARNINGS_HISTORY_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Thunk action creator that updates driver earnings goals
 * 
 * @param driverId - The unique identifier of the driver
 * @param goals - Object containing weekly and/or monthly earnings goals
 * @returns Thunk action that updates earnings goals
 */
export const updateEarningsGoals = (
  driverId: string,
  goals: { weekly?: number; monthly?: number }
): ThunkAction<void, any, unknown, EarningsAction> => {
  return async (dispatch: Dispatch<EarningsAction>) => {
    try {
      // Indicate loading state
      dispatch({ type: EarningsActionTypes.UPDATE_EARNINGS_GOALS_REQUEST });
      
      // In a real implementation, this would call an API to update the driver's goals
      // For example:
      // await driverApi.updateDriverPreference(driverId, {
      //   preferenceType: 'EARNINGS_GOAL',
      //   preferenceValue: JSON.stringify(goals)
      // });
      
      // For now, we'll simulate a successful update
      const updatedGoals = {
        weekly: goals.weekly || 2000,
        monthly: goals.monthly || 8000,
        updatedAt: new Date().toISOString()
      };
      
      // Short timeout to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dispatch success with updated goals
      dispatch({
        type: EarningsActionTypes.UPDATE_EARNINGS_GOALS_SUCCESS,
        payload: updatedGoals
      });
    } catch (error) {
      // Handle and dispatch any errors
      dispatch({
        type: EarningsActionTypes.UPDATE_EARNINGS_GOALS_FAILURE,
        payload: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };
};

/**
 * Action creator that updates the earnings display mode
 * 
 * @param displayMode - The display mode to switch to (week, month, year)
 * @returns Action to update the display mode
 */
export const updateEarningsDisplay = (
  displayMode: 'week' | 'month' | 'year'
): EarningsAction => {
  return {
    type: EarningsActionTypes.UPDATE_EARNINGS_DISPLAY,
    payload: displayMode
  };
};