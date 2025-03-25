import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, ScrollView, Switch, TextInput, Platform } from 'react-native';
import styled from 'styled-components/native';
import Slider from '@react-native-community/slider';
import { EquipmentType } from '../../../common/interfaces/load.interface';
import { filterRecommendations, sortRecommendations } from '../store/actions/loadActions';

// Interface defining the structure of load filter options
export interface LoadFilters {
  equipmentTypes: EquipmentType[];
  weightMin: number;
  weightMax: number;
  distanceMax: number;
  pickupDateStart: string;
  pickupDateEnd: string;
  deliveryDateStart: string;
  deliveryDateEnd: string;
  minEfficiencyScore: number;
  minRate: number;
  minRatePerMile: number;
  isHazardous: boolean | null;
}

// Styled components for the filter UI
const FilterContainer = styled(View)`
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  elevation: 2;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
`;

const FilterSection = styled(View)`
  margin-bottom: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.ui.divider};
  padding-bottom: 16px;
`;

const SectionHeader = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 8px;
`;

const SectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const SectionContent = styled(View)`
  margin-top: 8px;
`;

const FilterRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-vertical: 8px;
`;

const FilterLabel = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
`;

const FilterValue = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const CheckboxRow = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding-vertical: 8px;
`;

const Checkbox = styled(View)<{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border-width: 2px;
  border-color: ${props => props.checked ? props.theme.colors.primary.main : props.theme.colors.ui.border};
  background-color: ${props => props.checked ? props.theme.colors.primary.main : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const CheckboxLabel = styled(Text)`
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
`;

const SliderContainer = styled(View)`
  width: 100%;
  margin-vertical: 8px;
`;

const SliderLabels = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 4px;
`;

const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 16px;
`;

const ApplyButton = styled(TouchableOpacity)`
  background-color: ${props => props.theme.colors.primary.main};
  padding-vertical: 12px;
  padding-horizontal: 24px;
  border-radius: 8px;
  flex: 1;
  margin-right: 8px;
  align-items: center;
`;

const ResetButton = styled(TouchableOpacity)`
  background-color: transparent;
  padding-vertical: 12px;
  padding-horizontal: 24px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.ui.border};
  flex: 1;
  margin-left: 8px;
  align-items: center;
`;

const ButtonText = styled(Text)<{ primary?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.primary ? props.theme.colors.text.inverse : props.theme.colors.text.primary};
`;

const RadioGroup = styled(View)`
  margin-vertical: 8px;
`;

const RadioButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding-vertical: 8px;
`;

const RadioCircle = styled(View)<{ selected: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border-width: 2px;
  border-color: ${props => props.selected ? props.theme.colors.primary.main : props.theme.colors.ui.border};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const RadioInner = styled(View)`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: ${props => props.theme.colors.primary.main};
`;

// Default filter values
const defaultFilters: LoadFilters = {
  equipmentTypes: [],
  weightMin: 0,
  weightMax: 50000,
  distanceMax: 500,
  pickupDateStart: '',
  pickupDateEnd: '',
  deliveryDateStart: '',
  deliveryDateEnd: '',
  minEfficiencyScore: 0,
  minRate: 0,
  minRatePerMile: 0,
  isHazardous: null,
};

const FilterOptions: React.FC = () => {
  const dispatch = useDispatch();
  
  // Get current filters from Redux state
  const currentFilters = useSelector((state: any) => state.loads.filters);
  const currentSortOption = useSelector((state: any) => state.loads.sortOption);
  
  // Local state for filter values
  const [filters, setFilters] = useState<LoadFilters>(defaultFilters);
  
  // State for expanded sections (progressive disclosure)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sort: true,
    equipment: false,
    weight: false,
    distance: false,
    dates: false,
    score: false,
    rate: false,
    additional: false,
  });
  
  // State for sort option
  const [sortOption, setSortOption] = useState<{by: string, direction: string}>({
    by: 'efficiencyScore',
    direction: 'desc'
  });

  // Toggle section expansion (progressive disclosure)
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle filter changes
  const handleFilterChange = <K extends keyof LoadFilters>(key: K, value: LoadFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle equipment type selection/deselection
  const toggleEquipmentType = (type: EquipmentType) => {
    setFilters(prev => {
      if (prev.equipmentTypes.includes(type)) {
        return {
          ...prev,
          equipmentTypes: prev.equipmentTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          equipmentTypes: [...prev.equipmentTypes, type]
        };
      }
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    dispatch(filterRecommendations(filters));
  };
  
  // Reset filters to default
  const resetFilters = () => {
    setFilters(defaultFilters);
    dispatch(filterRecommendations(defaultFilters));
  };
  
  // Handle sort option change
  const handleSortChange = (by: string, direction: string) => {
    setSortOption({ by, direction });
    dispatch(sortRecommendations(by, direction));
  };
  
  // Initialize filters from Redux state on mount
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
    
    if (currentSortOption) {
      setSortOption(currentSortOption);
    }
  }, [currentFilters, currentSortOption]);
  
  return (
    <FilterContainer>
      <ScrollView>
        {/* Sort Options Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('sort')}>
            <SectionTitle>Sort By</SectionTitle>
            <Text>{expandedSections.sort ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.sort && (
            <SectionContent>
              <RadioGroup>
                <RadioButton onPress={() => handleSortChange('efficiencyScore', 'desc')}>
                  <RadioCircle selected={sortOption.by === 'efficiencyScore' && sortOption.direction === 'desc'}>
                    {sortOption.by === 'efficiencyScore' && sortOption.direction === 'desc' && <RadioInner />}
                  </RadioCircle>
                  <CheckboxLabel>Efficiency Score (High to Low)</CheckboxLabel>
                </RadioButton>
                
                <RadioButton onPress={() => handleSortChange('rate', 'desc')}>
                  <RadioCircle selected={sortOption.by === 'rate' && sortOption.direction === 'desc'}>
                    {sortOption.by === 'rate' && sortOption.direction === 'desc' && <RadioInner />}
                  </RadioCircle>
                  <CheckboxLabel>Rate (High to Low)</CheckboxLabel>
                </RadioButton>
                
                <RadioButton onPress={() => handleSortChange('ratePerMile', 'desc')}>
                  <RadioCircle selected={sortOption.by === 'ratePerMile' && sortOption.direction === 'desc'}>
                    {sortOption.by === 'ratePerMile' && sortOption.direction === 'desc' && <RadioInner />}
                  </RadioCircle>
                  <CheckboxLabel>Rate per Mile (High to Low)</CheckboxLabel>
                </RadioButton>
                
                <RadioButton onPress={() => handleSortChange('distance', 'asc')}>
                  <RadioCircle selected={sortOption.by === 'distance' && sortOption.direction === 'asc'}>
                    {sortOption.by === 'distance' && sortOption.direction === 'asc' && <RadioInner />}
                  </RadioCircle>
                  <CheckboxLabel>Distance (Closest First)</CheckboxLabel>
                </RadioButton>
                
                <RadioButton onPress={() => handleSortChange('pickupDate', 'asc')}>
                  <RadioCircle selected={sortOption.by === 'pickupDate' && sortOption.direction === 'asc'}>
                    {sortOption.by === 'pickupDate' && sortOption.direction === 'asc' && <RadioInner />}
                  </RadioCircle>
                  <CheckboxLabel>Pickup Date (Earliest First)</CheckboxLabel>
                </RadioButton>
              </RadioGroup>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Equipment Type Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('equipment')}>
            <SectionTitle>Equipment Type</SectionTitle>
            <Text>{expandedSections.equipment ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.equipment && (
            <SectionContent>
              <CheckboxRow onPress={() => toggleEquipmentType(EquipmentType.DRY_VAN)}>
                <Checkbox checked={filters.equipmentTypes.includes(EquipmentType.DRY_VAN)}>
                  {filters.equipmentTypes.includes(EquipmentType.DRY_VAN) && (
                    <Text style={{ color: 'white' }}>✓</Text>
                  )}
                </Checkbox>
                <CheckboxLabel>Dry Van</CheckboxLabel>
              </CheckboxRow>
              
              <CheckboxRow onPress={() => toggleEquipmentType(EquipmentType.REFRIGERATED)}>
                <Checkbox checked={filters.equipmentTypes.includes(EquipmentType.REFRIGERATED)}>
                  {filters.equipmentTypes.includes(EquipmentType.REFRIGERATED) && (
                    <Text style={{ color: 'white' }}>✓</Text>
                  )}
                </Checkbox>
                <CheckboxLabel>Refrigerated</CheckboxLabel>
              </CheckboxRow>
              
              <CheckboxRow onPress={() => toggleEquipmentType(EquipmentType.FLATBED)}>
                <Checkbox checked={filters.equipmentTypes.includes(EquipmentType.FLATBED)}>
                  {filters.equipmentTypes.includes(EquipmentType.FLATBED) && (
                    <Text style={{ color: 'white' }}>✓</Text>
                  )}
                </Checkbox>
                <CheckboxLabel>Flatbed</CheckboxLabel>
              </CheckboxRow>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Weight Range Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('weight')}>
            <SectionTitle>Weight Range</SectionTitle>
            <Text>{expandedSections.weight ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.weight && (
            <SectionContent>
              <FilterRow>
                <FilterLabel>Minimum Weight:</FilterLabel>
                <FilterValue>{filters.weightMin.toLocaleString()} lbs</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <Slider
                  minimumValue={0}
                  maximumValue={50000}
                  step={1000}
                  value={filters.weightMin}
                  onValueChange={(value) => handleFilterChange('weightMin', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
              
              <FilterRow>
                <FilterLabel>Maximum Weight:</FilterLabel>
                <FilterValue>{filters.weightMax.toLocaleString()} lbs</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <Slider
                  minimumValue={0}
                  maximumValue={50000}
                  step={1000}
                  value={filters.weightMax}
                  onValueChange={(value) => handleFilterChange('weightMax', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Distance Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('distance')}>
            <SectionTitle>Distance</SectionTitle>
            <Text>{expandedSections.distance ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.distance && (
            <SectionContent>
              <FilterRow>
                <FilterLabel>Maximum Distance:</FilterLabel>
                <FilterValue>{filters.distanceMax} miles</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <Slider
                  minimumValue={0}
                  maximumValue={2000}
                  step={50}
                  value={filters.distanceMax}
                  onValueChange={(value) => handleFilterChange('distanceMax', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Date Range Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('dates')}>
            <SectionTitle>Date Range</SectionTitle>
            <Text>{expandedSections.dates ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.dates && (
            <SectionContent>
              <FilterLabel>Pickup Window</FilterLabel>
              <FilterRow>
                <FilterLabel>Start Date:</FilterLabel>
                {/* In a real app, this would use a date picker component */}
                <TextInput
                  value={filters.pickupDateStart}
                  onChangeText={(text) => handleFilterChange('pickupDateStart', text)}
                  placeholder="MM/DD/YYYY"
                  style={{ borderWidth: 1, borderColor: '#dadce0', padding: 8, borderRadius: 4 }}
                />
              </FilterRow>
              
              <FilterRow>
                <FilterLabel>End Date:</FilterLabel>
                <TextInput
                  value={filters.pickupDateEnd}
                  onChangeText={(text) => handleFilterChange('pickupDateEnd', text)}
                  placeholder="MM/DD/YYYY"
                  style={{ borderWidth: 1, borderColor: '#dadce0', padding: 8, borderRadius: 4 }}
                />
              </FilterRow>
              
              <FilterLabel style={{ marginTop: 16 }}>Delivery Window</FilterLabel>
              <FilterRow>
                <FilterLabel>Start Date:</FilterLabel>
                <TextInput
                  value={filters.deliveryDateStart}
                  onChangeText={(text) => handleFilterChange('deliveryDateStart', text)}
                  placeholder="MM/DD/YYYY"
                  style={{ borderWidth: 1, borderColor: '#dadce0', padding: 8, borderRadius: 4 }}
                />
              </FilterRow>
              
              <FilterRow>
                <FilterLabel>End Date:</FilterLabel>
                <TextInput
                  value={filters.deliveryDateEnd}
                  onChangeText={(text) => handleFilterChange('deliveryDateEnd', text)}
                  placeholder="MM/DD/YYYY"
                  style={{ borderWidth: 1, borderColor: '#dadce0', padding: 8, borderRadius: 4 }}
                />
              </FilterRow>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Efficiency Score Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('score')}>
            <SectionTitle>Efficiency Score</SectionTitle>
            <Text>{expandedSections.score ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.score && (
            <SectionContent>
              <FilterRow>
                <FilterLabel>Minimum Score:</FilterLabel>
                <FilterValue>{filters.minEfficiencyScore}</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <SliderLabels>
                  <FilterLabel>0</FilterLabel>
                  <FilterLabel>100</FilterLabel>
                </SliderLabels>
                
                <Slider
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={filters.minEfficiencyScore}
                  onValueChange={(value) => handleFilterChange('minEfficiencyScore', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Rate Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('rate')}>
            <SectionTitle>Rate</SectionTitle>
            <Text>{expandedSections.rate ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.rate && (
            <SectionContent>
              <FilterRow>
                <FilterLabel>Minimum Rate:</FilterLabel>
                <FilterValue>${filters.minRate}</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <Slider
                  minimumValue={0}
                  maximumValue={5000}
                  step={50}
                  value={filters.minRate}
                  onValueChange={(value) => handleFilterChange('minRate', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
              
              <FilterRow>
                <FilterLabel>Minimum Rate Per Mile:</FilterLabel>
                <FilterValue>${filters.minRatePerMile.toFixed(2)}/mile</FilterValue>
              </FilterRow>
              
              <SliderContainer>
                <Slider
                  minimumValue={0}
                  maximumValue={10}
                  step={0.1}
                  value={filters.minRatePerMile}
                  onValueChange={(value) => handleFilterChange('minRatePerMile', value)}
                  minimumTrackTintColor="#1a73e8"
                  maximumTrackTintColor="#dadce0"
                />
              </SliderContainer>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Additional Filters Section */}
        <FilterSection>
          <SectionHeader onPress={() => toggleSection('additional')}>
            <SectionTitle>Additional Filters</SectionTitle>
            <Text>{expandedSections.additional ? '▲' : '▼'}</Text>
          </SectionHeader>
          
          {expandedSections.additional && (
            <SectionContent>
              <FilterRow>
                <FilterLabel>Hazardous Materials</FilterLabel>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: filters.isHazardous === false ? '#1a73e8' : 'transparent',
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: '#dadce0',
                      marginRight: 8
                    }}
                    onPress={() => handleFilterChange('isHazardous', false)}
                  >
                    <Text style={{ color: filters.isHazardous === false ? 'white' : '#5f6368' }}>Exclude</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: filters.isHazardous === true ? '#1a73e8' : 'transparent',
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: '#dadce0',
                      marginRight: 8
                    }}
                    onPress={() => handleFilterChange('isHazardous', true)}
                  >
                    <Text style={{ color: filters.isHazardous === true ? 'white' : '#5f6368' }}>Only</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: filters.isHazardous === null ? '#1a73e8' : 'transparent',
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: '#dadce0'
                    }}
                    onPress={() => handleFilterChange('isHazardous', null)}
                  >
                    <Text style={{ color: filters.isHazardous === null ? 'white' : '#5f6368' }}>Any</Text>
                  </TouchableOpacity>
                </View>
              </FilterRow>
            </SectionContent>
          )}
        </FilterSection>
        
        {/* Action Buttons */}
        <ButtonContainer>
          <ApplyButton onPress={applyFilters}>
            <ButtonText primary>Apply Filters</ButtonText>
          </ApplyButton>
          
          <ResetButton onPress={resetFilters}>
            <ButtonText>Reset</ButtonText>
          </ResetButton>
        </ButtonContainer>
      </ScrollView>
    </FilterContainer>
  );
};

export default FilterOptions;