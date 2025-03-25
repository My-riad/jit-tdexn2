import { EarningsActionTypes, EarningsAction } from '../actions/earningsActions';

/**
 * Enum defining the possible display modes for earnings data
 */
export enum DisplayMode {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Interface defining the shape of the earnings state in the Redux store
 */
export interface EarningsState {
  /** Current earnings data including weekly and monthly totals */
  earnings: {
    thisWeek: number;
    thisMonth: number;
    efficiencyBonus: number;
    regularEarnings: number;
    goalProgress: number;
    efficiencyScore: number;
  };
  /** Historical earnings data for trend analysis */
  earningsHistory: {
    daily: Array<{ date: string; amount: number }>;
    weekly: Array<{ week: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
    totalRevenue: number;
    averagePerMile: number;
  };
  /** Earnings goals set by the driver */
  goals: {
    weekly: number;
    monthly: number;
    yearly: number;
    updatedAt?: string;
  };
  /** Current display mode for earnings (weekly, monthly, yearly) */
  displayMode: string;
  /** Loading state for earnings data */
  loading: boolean;
  /** Error message if earnings data fetch fails */
  error: string | null;
  /** Loading state for earnings history data */
  historyLoading: boolean;
  /** Error message if earnings history fetch fails */
  historyError: string | null;
  /** Loading state for earnings goals update */
  goalsLoading: boolean;
  /** Error message if earnings goals update fails */
  goalsError: string | null;
}

/**
 * Initial state for the earnings reducer
 */
const initialState: EarningsState = {
  earnings: {
    thisWeek: 0,
    thisMonth: 0,
    efficiencyBonus: 0,
    regularEarnings: 0,
    goalProgress: 0,
    efficiencyScore: 0
  },
  earningsHistory: {
    daily: [],
    weekly: [],
    monthly: [],
    totalRevenue: 0,
    averagePerMile: 0
  },
  goals: {
    weekly: 0,
    monthly: 0,
    yearly: 0
  },
  displayMode: DisplayMode.WEEKLY,
  loading: false,
  error: null,
  historyLoading: false,
  historyError: null,
  goalsLoading: false,
  goalsError: null
};

/**
 * Redux reducer function that handles earnings-related actions and updates the earnings state
 * 
 * @param state Current earnings state, defaults to initialState if undefined
 * @param action Redux action to process
 * @returns Updated earnings state
 */
const earningsReducer = (
  state: EarningsState = initialState, 
  action: EarningsAction
): EarningsState => {
  switch (action.type) {
    case EarningsActionTypes.FETCH_EARNINGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case EarningsActionTypes.FETCH_EARNINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        earnings: action.payload
      };
    case EarningsActionTypes.FETCH_EARNINGS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case EarningsActionTypes.FETCH_EARNINGS_HISTORY_REQUEST:
      return {
        ...state,
        historyLoading: true,
        historyError: null
      };
    case EarningsActionTypes.FETCH_EARNINGS_HISTORY_SUCCESS:
      return {
        ...state,
        historyLoading: false,
        earningsHistory: action.payload
      };
    case EarningsActionTypes.FETCH_EARNINGS_HISTORY_FAILURE:
      return {
        ...state,
        historyLoading: false,
        historyError: action.payload
      };
    case EarningsActionTypes.UPDATE_EARNINGS_GOALS_REQUEST:
      return {
        ...state,
        goalsLoading: true,
        goalsError: null
      };
    case EarningsActionTypes.UPDATE_EARNINGS_GOALS_SUCCESS:
      return {
        ...state,
        goalsLoading: false,
        goals: action.payload
      };
    case EarningsActionTypes.UPDATE_EARNINGS_GOALS_FAILURE:
      return {
        ...state,
        goalsLoading: false,
        goalsError: action.payload
      };
    case EarningsActionTypes.UPDATE_EARNINGS_DISPLAY:
      return {
        ...state,
        displayMode: action.payload
      };
    default:
      return state;
  }
};

export default earningsReducer;