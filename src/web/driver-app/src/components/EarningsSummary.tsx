import React from 'react'; // version ^18.2.0
import styled from 'styled-components/native'; // version ^5.3.10
import { View, TouchableOpacity } from 'react-native'; // version ^0.71.8
import { useSelector, useDispatch } from 'react-redux'; // version ^8.0.5

import Text from '../../../shared/components/typography/Text'; // src/web/shared/components/typography/Text.tsx
import ProgressBar from '../../../shared/components/feedback/ProgressBar'; // src/web/shared/components/feedback/ProgressBar.tsx
import Card from '../../../shared/components/cards/Card'; // src/web/shared/components/cards/Card.tsx
import theme from '../styles/theme'; // src/web/driver-app/src/styles/theme.ts
import { formatCurrency } from '../../../common/utils/formatters'; // src/web/common/utils/formatters.ts
import { DisplayMode } from '../store/reducers/earningsReducer'; // src/web/driver-app/src/store/reducers/earningsReducer.ts
import { updateEarningsDisplay } from '../store/actions/earningsActions'; // src/web/driver-app/src/store/actions/earningsActions.ts

/**
 * @interface EarningsSummaryProps
 * @description Interface defining the props for the EarningsSummary component.
 */
interface EarningsSummaryProps {
  driverId?: string;
  showGoals?: boolean;
  showModeSelector?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * @constant DISPLAY_MODE_LABELS
 * @description Labels for the display mode selector buttons.
 */
const DISPLAY_MODE_LABELS = {
  WEEKLY: 'Week',
  MONTHLY: 'Month',
  YEARLY: 'Year'
};

/**
 * @constant GOAL_THRESHOLDS
 * @description Thresholds for color changes in the goal progress bars.
 */
const GOAL_THRESHOLDS = [
  { value: 25, color: 'warning.main' },
  { value: 50, color: 'warning.light' },
  { value: 75, color: 'success.light' },
  { value: 100, color: 'success.main' }
];

/**
 * @styledcomponent Container
 * @description Styled View component for the main container.
 */
const Container = styled.View`
  padding: ${theme.spacing.md};
`;

/**
 * @styledcomponent Header
 * @description Styled View component for the header section.
 */
const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

/**
 * @styledcomponent Title
 * @description Styled Text component for the title.
 */
const Title = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * @styledcomponent ModeSelectorContainer
 * @description Styled View component for the display mode selector.
 */
const ModeSelectorContainer = styled.View`
  flex-direction: row;
  background-color: ${theme.colors.background.secondary};
  border-radius: 20px;
  padding: 2px;
`;

/**
 * @styledcomponent ModeButton
 * @description Styled TouchableOpacity component for the mode buttons.
 */
const ModeButton = styled.TouchableOpacity<{ active: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: 18px;
  background-color: ${props => props.active ? theme.colors.primary.main : 'transparent'};
`;

/**
 * @styledcomponent ModeButtonText
 * @description Styled Text component for the mode button text.
 */
const ModeButtonText = styled(Text)<{ active: boolean }>`
  font-size: 12px;
  color: ${props => props.active ? theme.colors.text.white : theme.colors.text.secondary};
  font-weight: ${props => props.active ? '600' : 'normal'};
`;

/**
 * @styledcomponent AmountContainer
 * @description Styled View component for the earnings amount container.
 */
const AmountContainer = styled.View`
  margin: ${theme.spacing.md} 0;
`;

/**
 * @styledcomponent Amount
 * @description Styled Text component for the earnings amount.
 */
const Amount = styled(Text)`
  font-size: 32px;
  font-weight: 700;
  color: ${theme.colors.text.primary};
`;

/**
 * @styledcomponent BreakdownContainer
 * @description Styled View component for the earnings breakdown container.
 */
const BreakdownContainer = styled.View`
  margin-bottom: ${theme.spacing.md};
`;

/**
 * @styledcomponent BreakdownRow
 * @description Styled View component for a row in the earnings breakdown.
 */
const BreakdownRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xs};
`;

/**
 * @styledcomponent BreakdownLabel
 * @description Styled Text component for the breakdown label.
 */
const BreakdownLabel = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
`;

/**
 * @styledcomponent BreakdownValue
 * @description Styled Text component for the breakdown value.
 */
const BreakdownValue = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.text.primary};
`;

/**
 * @styledcomponent GoalsContainer
 * @description Styled View component for the earnings goals container.
 */
const GoalsContainer = styled.View`
  margin-top: ${theme.spacing.md};
`;

/**
 * @styledcomponent GoalRow
 * @description Styled View component for a row in the earnings goals.
 */
const GoalRow = styled.View`
  margin-bottom: ${theme.spacing.md};
`;

/**
 * @styledcomponent GoalHeader
 * @description Styled View component for the goal header.
 */
const GoalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xs};
`;

/**
 * @styledcomponent GoalLabel
 * @description Styled Text component for the goal label.
 */
const GoalLabel = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
`;

/**
 * @styledcomponent GoalProgress
 * @description Styled Text component for the goal progress.
 */
const GoalProgress = styled(Text)`
  font-size: 14px;
  color: ${theme.colors.text.primary};
`;

/**
 * @styledcomponent LoadingContainer
 * @description Styled View component for the loading state.
 */
const LoadingContainer = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
`;

/**
 * @styledcomponent ErrorContainer
 * @description Styled View component for the error state.
 */
const ErrorContainer = styled.View`
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.semantic.error};
  border-radius: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * @styledcomponent ErrorText
 * @description Styled Text component for the error text.
 */
const ErrorText = styled(Text)`
  color: ${theme.colors.text.error};
  font-size: 14px;
`;

/**
 * @function EarningsSummary
 * @param {EarningsSummaryProps} props - The props for the component.
 * @returns {JSX.Element} - The rendered EarningsSummary component.
 * @description Component that displays a summary of driver earnings data.
 */
export const EarningsSummary: React.FC<EarningsSummaryProps> = (props) => {
  // Extract driverId and any other props from the component props
  const { driverId: propDriverId, showGoals = true, showModeSelector = true, compact = false, className } = props;

  // Use useSelector to get earnings data and display mode from Redux store
  const earnings = useSelector(state => state.earnings.earnings);
  const displayMode = useSelector(state => state.earnings.displayMode);
  const loading = useSelector(state => state.earnings.loading);
  const error = useSelector(state => state.earnings.error);

  // Use useSelector to get auth state to get current user ID if driverId is not provided
  const auth = useSelector(state => state.auth);
  const driverId = propDriverId || auth.user?.driverId;

  // Use useDispatch to get the dispatch function for Redux actions
  const dispatch = useDispatch();

  // Create a function to handle display mode changes
  const handleDisplayModeChange = (mode: DisplayMode) => {
    dispatch(updateEarningsDisplay(mode));
  };

  // Format currency values using formatCurrency utility
  const weeklyEarningsFormatted = formatCurrency(earnings.thisWeek);
  const monthlyEarningsFormatted = formatCurrency(earnings.thisMonth);
  const efficiencyBonusFormatted = formatCurrency(earnings.efficiencyBonus);
  const regularEarningsFormatted = formatCurrency(earnings.regularEarnings);

  // Calculate progress percentages for weekly and monthly goals
  const weeklyGoalProgress = Math.min((earnings.thisWeek / 2000) * 100, 100); // Assuming weekly goal of $2000
  const monthlyGoalProgress = Math.min((earnings.thisMonth / 8000) * 100, 100); // Assuming monthly goal of $8000

  // Render a Card component containing the earnings summary
  return (
    <Card className={className}>
      <Container>
        <Header>
          <Title>Earnings Summary</Title>
          {showModeSelector && (
            <ModeSelectorContainer>
              <ModeButton
                active={displayMode === DisplayMode.WEEKLY}
                onPress={() => handleDisplayModeChange(DisplayMode.WEEKLY)}
              >
                <ModeButtonText active={displayMode === DisplayMode.WEEKLY}>
                  {DISPLAY_MODE_LABELS.WEEKLY}
                </ModeButtonText>
              </ModeButton>
              <ModeButton
                active={displayMode === DisplayMode.MONTHLY}
                onPress={() => handleDisplayModeChange(DisplayMode.MONTHLY)}
              >
                <ModeButtonText active={displayMode === DisplayMode.MONTHLY}>
                  {DISPLAY_MODE_LABELS.MONTHLY}
                </ModeButtonText>
              </ModeButton>
            </ModeSelectorContainer>
          )}
        </Header>

        {/* Render the current earnings amount based on selected display mode */}
        <AmountContainer>
          <Amount>
            {displayMode === DisplayMode.WEEKLY ? weeklyEarningsFormatted : monthlyEarningsFormatted}
          </Amount>
        </AmountContainer>

        {/* Render the breakdown of regular earnings and efficiency bonuses */}
        <BreakdownContainer>
          <BreakdownRow>
            <BreakdownLabel>Regular Earnings</BreakdownLabel>
            <BreakdownValue>{regularEarningsFormatted}</BreakdownValue>
          </BreakdownRow>
          <BreakdownRow>
            <BreakdownLabel>Efficiency Bonuses</BreakdownLabel>
            <BreakdownValue>{efficiencyBonusFormatted}</BreakdownValue>
          </BreakdownRow>
        </BreakdownContainer>

        {/* Render progress bars showing progress toward earnings goals */}
        {showGoals && (
          <GoalsContainer>
            <GoalRow>
              <GoalHeader>
                <GoalLabel>Weekly Goal</GoalLabel>
                <GoalProgress>{weeklyGoalProgress}%</GoalProgress>
              </GoalHeader>
              <ProgressBar value={weeklyGoalProgress} thresholds={GOAL_THRESHOLDS} />
            </GoalRow>
            <GoalRow>
              <GoalHeader>
                <GoalLabel>Monthly Goal</GoalLabel>
                <GoalProgress>{monthlyGoalProgress}%</GoalProgress>
              </GoalHeader>
              <ProgressBar value={monthlyGoalProgress} thresholds={GOAL_THRESHOLDS} />
            </GoalRow>
          </GoalsContainer>
        )}
      </Container>
    </Card>
  );
};

export default EarningsSummary;