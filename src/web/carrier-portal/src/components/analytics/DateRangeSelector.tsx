import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import DatePicker from '../../../shared/components/forms/DatePicker'; // DatePicker component for selecting start and end dates
import Select from '../../../shared/components/forms/Select'; // Dropdown component for selecting predefined timeframes
import { theme } from '../../../shared/styles/theme'; // Theme variables for consistent styling
import { getStartOfDay, getEndOfDay, subtractDays, subtractMonths, getStartOfMonth, getEndOfMonth } from '../../../common/utils/dateTimeUtils'; // Date utility functions for calculating date ranges

/**
 * Interface for the DateRange object, representing a date range with start and end dates
 */
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  timeframe?: string;
}

/**
 * Interface for the TimeframeOption object, representing an option in the timeframe dropdown
 */
interface TimeframeOption {
  value: string;
  label: string;
}

/**
 * Interface defining the props for the DateRangeSelector component
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
 * Styled container for the timeframe select dropdown
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
 * Styled separator between the date pickers
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
      const lastMonthEndDate = subtractMonths(endDate, 1);
      return {
        startDate: getStartOfMonth(lastMonthEndDate),
        endDate: getEndOfMonth(lastMonthEndDate),
      };
    case 'lastQuarter': {
      let currentMonth = endDate.getMonth();
      let startMonth: number;

      if (currentMonth >= 0 && currentMonth <= 2) {
        startMonth = -3;
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        startMonth = 0;
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        startMonth = 3;
      } else {
        startMonth = 6;
      }

      const lastQuarterStartDate = subtractMonths(endDate, 3 + startMonth);
      const lastQuarterEndDate = subtractMonths(endDate, startMonth);

      return {
        startDate: getStartOfMonth(lastQuarterStartDate),
        endDate: getEndOfMonth(lastQuarterEndDate),
      };
    }
    case 'thisYear':
      return {
        startDate: new Date(endDate.getFullYear(), 0, 1),
        endDate: new Date(endDate.getFullYear(), 11, 31),
      };
    case 'lastYear': {
      const lastYear = endDate.getFullYear() - 1;
      return {
        startDate: new Date(lastYear, 0, 1),
        endDate: new Date(lastYear, 11, 31),
      };
    }
    case 'custom':
      return {
        startDate: null,
        endDate: null,
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
const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onChange, defaultTimeframe, className }) => {
  // LD1: Destructure props including onChange, defaultTimeframe, and className
  // LD2: Set up state for selected timeframe using useState
  const [timeframe, setTimeframe] = useState<string>(defaultTimeframe || DEFAULT_TIMEFRAME);
  // LD2: Set up state for custom date range (startDate and endDate) using useState
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  // LD2: Set up state for whether custom date range is active using useState
  const [isCustomDateRange, setIsCustomDateRange] = useState<boolean>(timeframe === 'custom');

  /**
   * Handles changes to the selected timeframe
   * @param event The change event from the select dropdown
   */
  const handleTimeframeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // LD3: Get the selected timeframe from the event
    const selectedTimeframe = event.target.value;
    // LD3: Set the selected timeframe in state
    setTimeframe(selectedTimeframe);
    // LD3: Update the isCustomDateRange state based on whether the selected timeframe is "custom"
    setIsCustomDateRange(selectedTimeframe === 'custom');

    // LD3: Calculate the date range based on the selected timeframe
    const newDateRange = getDateRangeFromTimeframe(selectedTimeframe);

    // LD3: Set the start and end dates in state if the timeframe is not "custom"
    if (selectedTimeframe !== 'custom') {
      setStartDate(newDateRange.startDate);
      setEndDate(newDateRange.endDate);
    }

    // LD3: Call the onChange callback with the new date range
    if (onChange) {
      onChange({
        startDate: newDateRange.startDate,
        endDate: newDateRange.endDate,
        timeframe: selectedTimeframe,
      });
    }
  };

  /**
   * Handles changes to the start date
   * @param date The new start date
   */
  const handleStartDateChange = (date: Date | null) => {
    // LD4: Set the start date in state
    setStartDate(date);
  };

  /**
   * Handles changes to the end date
   * @param date The new end date
   */
  const handleEndDateChange = (date: Date | null) => {
    // LD5: Set the end date in state
    setEndDate(date);
  };

  // LD6: Use useEffect to initialize date range based on defaultTimeframe prop
  useEffect(() => {
    const initialDateRange = getDateRangeFromTimeframe(timeframe);
    setStartDate(initialDateRange.startDate);
    setEndDate(initialDateRange.endDate);
  }, [timeframe]);

  // LD7: Use useEffect to call onChange when date range changes
  useEffect(() => {
    if (onChange) {
      onChange({
        startDate,
        endDate,
        timeframe: isCustomDateRange ? 'custom' : timeframe,
      });
    }
  }, [startDate, endDate, timeframe, isCustomDateRange, onChange]);

  return (
    <DateRangeSelectorContainer className={className}>
      <TimeframeSelect>
        <Select
          label="Timeframe"
          value={timeframe}
          options={TIMEFRAME_OPTIONS}
          onChange={handleTimeframeChange}
        />
      </TimeframeSelect>
      {isCustomDateRange && (
        <DatePickersContainer>
          <DatePickerWrapper>
            <DatePicker
              label="Start Date"
              selected={startDate}
              onChange={handleStartDateChange}
              maxDate={endDate}
            />
          </DatePickerWrapper>
          <DateRangeSeparator>—</DateRangeSeparator>
          <DatePickerWrapper>
            <DatePicker
              label="End Date"
              selected={endDate}
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
export type { DateRangeSelectorProps, DateRange, TimeframeOption };