import React from 'react'; // version ^18.2.0
import { render, screen } from '@testing-library/react'; // version ^14.0.0

import { renderWithProviders } from '../../../shared/tests/utils/renderWithProviders';
import { createMockScore } from '../../../shared/tests/utils/testUtils';
import EfficiencyScore from '../../src/components/EfficiencyScore';

describe('EfficiencyScore component', () => {
  test('renders with default props', () => {
    // LD1: Render the EfficiencyScore component with a score value
    renderWithProviders(<EfficiencyScore score={75} />);

    // LD1: Verify the score value is displayed correctly
    expect(screen.getByText('75')).toBeInTheDocument();

    // LD1: Verify the progress bar variant is used by default
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // LD1: Verify the 'Efficiency Score' label is displayed
    expect(screen.getByText('EFFICIENCY SCORE')).toBeInTheDocument();
  });

  test('renders with gauge variant', () => {
    // LD1: Render the EfficiencyScore component with variant='gauge'
    renderWithProviders(<EfficiencyScore score={75} variant="gauge" />);

    // LD1: Verify the gauge chart is rendered instead of progress bar
    expect(screen.getByRole('img')).toBeInTheDocument();

    // LD1: Verify the score value is displayed correctly
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  test('shows score change when previousScore is provided', () => {
    // LD1: Render the EfficiencyScore component with score and previousScore
    renderWithProviders(<EfficiencyScore score={85} previousScore={70} />);

    // LD1: Calculate the expected change value (score - previousScore)
    const expectedChange = 85 - 70;

    // LD1: Verify the change value is displayed with appropriate sign (+ or -)
    expect(screen.getByText(`+${expectedChange} this week`)).toBeInTheDocument();
  });

  test('does not show score change when showChange is false', () => {
    // LD1: Render the EfficiencyScore component with showChange={false}
    renderWithProviders(<EfficiencyScore score={85} previousScore={70} showChange={false} />);

    // LD1: Verify the change value is not displayed in the component
    expect(screen.queryByText(/this week/)).not.toBeInTheDocument();
  });

  test('applies different sizes correctly', () => {
    // LD1: Render the EfficiencyScore component with size='small'
    const { rerender } = renderWithProviders(<EfficiencyScore score={75} size="small" />);

    // LD1: Verify the component has appropriate styling for small size
    expect(screen.getByText('75')).toHaveStyle('font-size: 24px');

    // LD1: Re-render with size='large'
    rerender(<EfficiencyScore score={75} size="large" />);

    // LD1: Verify the component has appropriate styling for large size
    expect(screen.getByText('75')).toHaveStyle('font-size: 48px');
  });

  test('applies correct color based on score thresholds', () => {
    // LD1: Render the EfficiencyScore component with a high score (≥90)
    const { rerender } = renderWithProviders(<EfficiencyScore score={95} />);

    // LD1: Verify the success color is applied
    expect(screen.getByText('95')).toHaveStyle('color: #34A853');

    // LD1: Re-render with a medium score (75-89)
    rerender(<EfficiencyScore score={82} />);

    // LD1: Verify the info color is applied
    expect(screen.getByText('82')).toHaveStyle('color: #4285F4');

    // LD1: Re-render with a low score (60-74)
    rerender(<EfficiencyScore score={65} />);

    // LD1: Verify the warning color is applied
    expect(screen.getByText('65')).toHaveStyle('color: #FBBC04');

    // LD1: Re-render with a very low score (<60)
    rerender(<EfficiencyScore score={45} />);

    // LD1: Verify the error color is applied
    expect(screen.getByText('45')).toHaveStyle('color: #EA4335');
  });

  test('does not show label when showLabel is false', () => {
    // LD1: Render the EfficiencyScore component with showLabel={false}
    renderWithProviders(<EfficiencyScore score={75} showLabel={false} />);

    // LD1: Verify the 'Efficiency Score' label is not displayed
    expect(screen.queryByText('EFFICIENCY SCORE')).not.toBeInTheDocument();
  });
});