import React, { useState, useEffect, useCallback } from 'react'; // React, { useState, useEffect, useCallback } ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import DatePicker from '../../../shared/components/forms/DatePicker';
import Select from '../../../shared/components/forms/Select';
import { theme } from '../../../shared/styles/theme';
import { getStartOfDay, getEndOfDay, subtractDays, subtractMonths, getStartOfMonth, getEndOfMonth } from '../../../common/utils/dateTimeUtils';

/**
 * Interface for the date range
 */
interface DateRange {
  startDate: Date;
  endDate: Date;
  timeframe?: string;
}

/**
 * Interface for the timeframe option
 */
interface TimeframeOption {
  value: string;
  label: string;
}

/**
 * Interface for the DateRangeSelector component props
 */
interface DateRangeSelectorProps {
  onChange: (dateRange: DateRange) => void;
  defaultTimeframe?: string;
  className?: string;
}

/**
 * Predefined timeframe options for the dropdown
 */
const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Default timeframe if none is specified
 */
const DEFAULT_TIMEFRAME = 'last30days';

/**
 * Styled container for the date range selector
 */
const DateRangeSelectorContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.md};
`;

/**
 * Styled container for the timeframe select
 */
const TimeframeSelect = styled.div`
  min-width: 200px;
`;

/**
 * Styled container for the date pickers
 */
const DatePickersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

/**
 * Styled wrapper for the date picker
 */
const DatePickerWrapper = styled.div`
  width: 160px;
`;

/**
 * Styled separator for the date range
 */
const DateRangeSeparator = styled.span`
  color: ${theme.colors.text.secondary};
  margin: 0 ${theme.spacing.xs};
`;

/**
 * Calculates start and end dates based on a predefined timeframe
 * @param timeframe The timeframe to calculate the date range for
 * @returns An object containing the start and end dates
 */
const getDateRangeFromTimeframe = (timeframe: string): DateRange => {
  const endDate = new Date();

  switch (timeframe) {
    case 'today':
      return {
        startDate: getStartOfDay(endDate),
        endDate: getEndOfDay(endDate),
      };
    case 'yesterday':
      return {
        startDate: getStartOfDay(subtractDays(endDate, 1)),
        endDate: getEndOfDay(subtractDays(endDate, 1)),
      };
    case 'last7days':
      return {
        startDate: subtractDays(endDate, 7),
        endDate,
      };
    case 'last30days':
      return {
        startDate: subtractDays(endDate, 30),
        endDate,
      };
    case 'thisMonth':
      return {
        startDate: getStartOfMonth(endDate),
        endDate: getEndOfMonth(endDate),
      };
    case 'lastMonth':
      return {
        startDate: getStartOfMonth(subtractMonths(endDate, 1)),
        endDate: getEndOfMonth(subtractMonths(endDate, 1)),
      };
    case 'lastQuarter': {
      const currentMonth = endDate.getMonth();
      let quarterStartMonth: number;
      if (currentMonth >= 0 && currentMonth <= 2) {
        quarterStartMonth = -3;
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        quarterStartMonth = 0;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        quarterStartMonth = 3;
      } else {
        quarterStartMonth = 6;
      }
      const startDate = getStartOfMonth(subtractMonths(endDate, currentMonth - quarterStartMonth + 3));
      return {
        startDate,
        endDate: getEndOfMonth(subtractMonths(endDate, currentMonth - quarterStartMonth)),
      };
    }
    case 'thisYear':
      return {
        startDate: new Date(endDate.getFullYear(), 0, 1),
        endDate: new Date(endDate.getFullYear(), 11, 31),
      };
    case 'lastYear':
      return {
        startDate: new Date(endDate.getFullYear() - 1, 0, 1),
        endDate: new Date(endDate.getFullYear() - 1, 11, 31),
      };
    case 'custom':
      return {
        startDate: subtractDays(endDate, 30),
        endDate,
      };
    default:
      return {
        startDate: subtractDays(endDate, 30),
        endDate,
      };
  }
};

/**
 * Component for selecting date ranges in analytics dashboards
 * @param props Props for the DateRangeSelector component
 * @returns Rendered date range selector component
 */
const DateRangeSelector: React.FC<DateRangeSelectorProps> = (props) => {
  // LD1: Destructure props including onChange, defaultTimeframe, and className
  const { onChange, defaultTimeframe, className } = props;

  // LD1: Set up state for selected timeframe using useState
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(defaultTimeframe || DEFAULT_TIMEFRAME);

  // LD1: Set up state for custom date range (startDate and endDate) using useState
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // LD1: Set up state for whether custom date range is active using useState
  const [isCustom, setIsCustom] = useState<boolean>(selectedTimeframe === 'custom');

  // LD1: Create a function to calculate date range based on timeframe selection
  const calculateDateRange = useCallback((timeframe: string): DateRange => {
    return getDateRangeFromTimeframe(timeframe);
  }, []);

  // LD1: Create a function to handle timeframe selection changes
  const handleTimeframeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimeframe = event.target.value;
    setSelectedTimeframe(newTimeframe);
    setIsCustom(newTimeframe === 'custom');

    const newDateRange = calculateDateRange(newTimeframe);
    onChange(newDateRange);

    setStartDate(newDateRange.startDate);
    setEndDate(newDateRange.endDate);
  };

  // LD1: Create functions to handle start and end date changes
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      onChange({ startDate: date, endDate: endDate || new Date(), timeframe: 'custom' });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(date);
      onChange({ startDate: startDate || new Date(), endDate: date, timeframe: 'custom' });
    }
  };

  // LD1: Use useEffect to initialize date range based on defaultTimeframe prop
  useEffect(() => {
    const initialDateRange = calculateDateRange(defaultTimeframe || DEFAULT_TIMEFRAME);
    setStartDate(initialDateRange.startDate);
    setEndDate(initialDateRange.endDate);
  }, [defaultTimeframe, calculateDateRange]);

  // LD1: Use useEffect to call onChange when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      onChange({ startDate, endDate, timeframe: selectedTimeframe });
    }
  }, [startDate, endDate, onChange, selectedTimeframe]);

  // LD1: Render the DateRangeSelectorContainer component
  return (
    <DateRangeSelectorContainer className={className}>
      {/* LD1: Render the Select component for timeframe options */}
      <TimeframeSelect>
        <Select
          name="timeframe"
          label="Timeframe"
          options={TIMEFRAME_OPTIONS}
          value={selectedTimeframe}
          onChange={handleTimeframeChange}
        />
      </TimeframeSelect>

      {/* LD1: Conditionally render DatePicker components when custom date range is selected */}
      {isCustom && (
        <DatePickersContainer>
          <DatePickerWrapper>
            <DatePicker
              name="startDate"
              label="Start Date"
              value={startDate || ''}
              onChange={handleStartDateChange}
              maxDate={endDate}
            />
          </DatePickerWrapper>
          <DateRangeSeparator>—</DateRangeSeparator>
          <DatePickerWrapper>
            <DatePicker
              name="endDate"
              label="End Date"
              value={endDate || ''}
              onChange={handleEndDateChange}
              minDate={startDate}
            />
          </DatePickerWrapper>
        </DatePickersContainer>
      )}
    </DateRangeSelectorContainer>
  );
};

export default DateRangeSelector;