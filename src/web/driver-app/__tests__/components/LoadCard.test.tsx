import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent } from '@testing-library/react'; // version ^14.0.0
import LoadCard from '../../src/components/LoadCard';
import { renderWithProviders } from '../../../shared/tests/utils/renderWithProviders';
import { createMockLoad } from '../../../shared/tests/utils/testUtils';
import { LoadRecommendation } from '../../../common/interfaces/load.interface';
import { formatCurrency, formatDistance, formatWeight, formatRatePerMile, formatDateForDisplay } from '../../../common/utils/formatters';
import jest from 'jest'; // version ^29.5.0

// Mock formatter functions to avoid dependency on implementation details
jest.mock('../../../common/utils/formatters', () => ({
  formatCurrency: jest.fn(val => `$${val}`),
  formatDistance: jest.fn(val => `${val} mi`),
  formatWeight: jest.fn(val => `${val} lbs`),
  formatRatePerMile: jest.fn(val => `$${val}/mi`),
  formatDateForDisplay: jest.fn(val => val)
}));

// Define mock load data for testing the LoadCard component
const mockLoad: LoadRecommendation = createMockLoad({ loadId: 'load-123', origin: 'Chicago, IL', destination: 'Detroit, MI', equipmentType: 'DRY_VAN', weight: 42000, distance: 304, rate: 950, ratePerMile: 3.12, pickupDate: '2023-05-15T08:00:00Z', deliveryDate: '2023-05-15T16:00:00Z', efficiencyScore: 95 });

// Mock function for the onPress handler
const mockOnPress = jest.fn();

// Mock function for the onToggleFavorite handler
const mockOnToggleFavorite = jest.fn();

describe('LoadCard component', () => {
  beforeEach(() => {
    // Reset mock functions before each test
    mockOnPress.mockClear();
    mockOnToggleFavorite.mockClear();
    (formatCurrency as jest.Mock).mockClear();
    (formatDistance as jest.Mock).mockClear();
    (formatWeight as jest.Mock).mockClear();
    (formatRatePerMile as jest.Mock).mockClear();
    (formatDateForDisplay as jest.Mock).mockClear();
  });

  it('renders load origin and destination', () => {
    // Render LoadCard with mockLoad
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} />);

    // Verify that origin 'Chicago, IL' is displayed
    expect(screen.getByText('Chicago, IL')).toBeInTheDocument();

    // Verify that destination 'Detroit, MI' is displayed
    expect(screen.getByText('Detroit, MI')).toBeInTheDocument();
  });

  it('renders equipment type and weight', () => {
    // Render LoadCard with mockLoad
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} />);

    // Verify that equipment type 'Dry Van' is displayed
    expect(screen.getByText('DRY_VAN')).toBeInTheDocument();

    // Verify that weight '42000 lbs' is displayed
    expect(screen.getByText('42000 lbs')).toBeInTheDocument();
  });

  it('renders pickup and delivery dates', () => {
    // Render LoadCard with mockLoad
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} />);

    // Verify that pickup date is displayed
    expect(screen.getByText(mockLoad.pickupDate)).toBeInTheDocument();

    // Verify that delivery date is displayed
    expect(screen.getByText(mockLoad.deliveryDate)).toBeInTheDocument();
  });

  it('renders distance and rate information', () => {
    // Render LoadCard with mockLoad
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} />);

    // Verify that distance '304 mi' is displayed
    expect(screen.getByText('304 mi')).toBeInTheDocument();

    // Verify that rate '$950' is displayed
    expect(screen.getByText('$950')).toBeInTheDocument();

    // Verify that rate per mile '$3.12/mi' is displayed
    expect(screen.getByText('$3.12/mi')).toBeInTheDocument();
  });

  it('calls onPress when card is clicked', () => {
    // Render LoadCard with mockLoad and mockOnPress
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} />);

    // Click on the card
    fireEvent.click(screen.getByText('Chicago, IL'));

    // Verify that mockOnPress was called with mockLoad
    expect(mockOnPress).toHaveBeenCalledWith(mockLoad);
  });

  it('renders efficiency score when showEfficiencyScore is true', () => {
    // Render LoadCard with mockLoad and showEfficiencyScore=true
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} showEfficiencyScore={true} />);

    // Verify that efficiency score component is rendered
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('does not render efficiency score when showEfficiencyScore is false', () => {
    // Render LoadCard with mockLoad and showEfficiencyScore=false
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} showEfficiencyScore={false} />);

    // Verify that efficiency score component is not rendered
    expect(screen.queryByText('95')).not.toBeInTheDocument();
  });

  it('renders favorite icon when isFavorite is true', () => {
    // Render LoadCard with mockLoad and isFavorite=true
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} isFavorite={true} />);

    // Verify that favorite icon is rendered
    expect(screen.getByLabelText('favorite')).toBeInTheDocument();
  });

  it('calls onToggleFavorite when favorite icon is clicked', () => {
    // Render LoadCard with mockLoad, isFavorite=true, and mockOnToggleFavorite
    renderWithProviders(<LoadCard load={mockLoad} onPress={mockOnPress} isFavorite={true} onToggleFavorite={mockOnToggleFavorite} />);

    // Click on the favorite icon
    fireEvent.click(screen.getByLabelText('favorite'));

    // Verify that mockOnToggleFavorite was called with mockLoad.loadId
    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockLoad.loadId);
  });
});