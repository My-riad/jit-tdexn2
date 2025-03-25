import React, { useState, useCallback, useEffect, useRef } from 'react'; //  ^18.2.0
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native'; //  ^0.70.6
import { NavigationProp, RouteProp, useFocusEffect } from '@react-navigation/native'; //  ^6.1.6
import { useSelector, useDispatch } from 'react-redux'; //  ^8.0.5

import DriverMap, { ViewMode } from '../components/DriverMap'; // Specialized map component for the driver mobile application
import LoadCard from '../components/LoadCard'; // Component for displaying load information in a card format
import FilterOptions from '../components/FilterOptions'; // Component for filtering load recommendations
import BonusZoneAlert from '../components/BonusZoneAlert'; // Component for displaying alerts about nearby bonus zones
import useDriverLocation from '../hooks/useDriverLocation'; // Custom hook for accessing and updating the driver's location
import useLoadUpdates from '../hooks/useLoadUpdates'; // Custom hook for receiving real-time updates about loads
import mapUtils from '../utils/mapUtils'; // Utility functions for map operations
import { colors } from '../styles/colors'; // Color definitions for styling
import { BonusZone } from '../../../common/interfaces/gamification.interface';
import { Load } from '../../../common/interfaces/load.interface';
import { fetchRecommendedLoads } from '../store/actions/loadActions';
import { fetchSmartHubs, fetchBonusZones } from '../store/actions/mapActions';

// Define the props for the MapScreen component
interface MapScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

// Define the styles for the MapScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ui.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  filterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.neutral.white,
    padding: 8,
    borderRadius: 8,
    shadowColor: colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterButtonText: {
    color: colors.primary.blue,
    fontWeight: 'bold',
  },
  selectedLoadContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: colors.ui.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  hubName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.primary.blue,
  },
  hubDescription: {
    fontSize: 14,
    marginBottom: 16,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    color: colors.text.primary,
  },
  facilitiesList: {
    maxHeight: 200,
  },
  facilityItem: {
    fontSize: 14,
    paddingVertical: 4,
    color: colors.text.secondary,
  },
  bonusMultiplier: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.semantic.warning,
    marginBottom: 8,
  },
  bonusReason: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text.primary,
  },
  bonusTimeframe: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
});

// The main component for the map screen in the driver mobile application
const MapScreen: React.FC<MapScreenProps> = ({ navigation, route }) => {
  // Get the navigation object from props
  // Get the Redux dispatch function using useDispatch
  const dispatch = useDispatch();

  // Get the driver's current location using useDriverLocation
  const { position: driverPosition } = useDriverLocation('', '');

  // Get the active load using useLoadUpdates
  const { activeLoad } = useLoadUpdates('');

  // Get recommended loads, Smart Hubs, and bonus zones from Redux store using useSelector
  const recommendedLoads = useSelector((state: any) => state.load.recommendations);
  const smartHubs = useSelector((state: any) => state.map.smartHubs);
  const bonusZones = useSelector((state: any) => state.map.bonusZones);

  // Initialize state for selected load, selected Smart Hub, selected bonus zone, and filter visibility
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedSmartHubId, setSelectedSmartHubId] = useState<string | null>(null);
  const [selectedBonusZoneId, setSelectedBonusZoneId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSmartHubModal, setShowSmartHubModal] = useState<boolean>(false);
  const [showBonusZoneModal, setShowBonusZoneModal] = useState<boolean>(false);
  const [nearbyBonusZone, setNearbyBonusZone] = useState<BonusZone | null>(null);
  const [distanceToBonusZone, setDistanceToBonusZone] = useState<number>(0);

  // Create a reference to the DriverMap component
  const mapRef = useRef<any>(null);

  // Create a function to handle load selection
  const handleLoadSelect = useCallback((load: Load) => {
    setSelectedLoadId(load.id);
  }, []);

  // Create a function to handle Smart Hub selection
  const handleSmartHubSelect = useCallback((smartHub: any) => {
    setSelectedSmartHubId(smartHub.hub_id);
    setShowSmartHubModal(true);
  }, []);

  // Create a function to handle bonus zone selection
  const handleBonusZoneSelect = useCallback((bonusZone: BonusZone) => {
    setSelectedBonusZoneId(bonusZone.id);
    setShowBonusZoneModal(true);
  }, []);

  // Create a function to toggle filter visibility
  const toggleFilters = useCallback(() => {
    setShowFilters((prevShowFilters) => !prevShowFilters);
  }, []);

  // Create a function to navigate to load details
  const navigateToLoadDetails = useCallback((load: Load) => {
    navigation.navigate('LoadDetails', { loadId: load.id });
  }, [navigation]);

  // Create a function to refresh map data
  const refreshMapData = useCallback(() => {
    dispatch(fetchRecommendedLoads('', {}));
    dispatch(fetchSmartHubs(0, 0, 0));
    dispatch(fetchBonusZones(0, 0, 0));
  }, [dispatch]);

  // Use useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshMapData();
    }, [refreshMapData])
  );

  // Use useEffect to check for nearby bonus zones when the driver's position changes
  useEffect(() => {
    if (driverPosition && bonusZones) {
      const nearby = mapUtils.getNearbyBonusZones(driverPosition, bonusZones, 10);
      if (nearby.length > 0) {
        setNearbyBonusZone(nearby[0].bonusZone);
        setDistanceToBonusZone(nearby[0].distance);
      } else {
        setNearbyBonusZone(null);
        setDistanceToBonusZone(0);
      }
    }
  }, [driverPosition, bonusZones]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <DriverMap
          ref={mapRef}
          height="100%"
          width="100%"
          showRecommendedLoads
          showActiveLoad
          showSmartHubs
          showBonusZones
          bonusZones={bonusZones}
          smartHubs={smartHubs}
          initialViewMode={ViewMode.ALL}
          onLoadSelect={handleLoadSelect}
          onSmartHubSelect={handleSmartHubSelect}
          onBonusZoneSelect={handleBonusZoneSelect}
        />
        <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        {showFilters && (
          <Modal visible={showFilters} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={toggleFilters}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Filter Options</Text>
                <FilterOptions onClose={toggleFilters} />
              </View>
            </View>
          </Modal>
        )}
        {selectedLoadId !== null && (
          <View style={styles.selectedLoadContainer}>
            {/* @ts-expect-error */}
            <LoadCard load={activeLoad} onPress={() => navigateToLoadDetails(activeLoad)} showEfficiencyScore />
          </View>
        )}
      </View>
      {nearbyBonusZone && (
        <BonusZoneAlert
          bonusZone={nearbyBonusZone}
          distance={distanceToBonusZone}
          baseAmount={100}
          onViewMap={() => handleBonusZoneSelect(nearbyBonusZone)}
          onDismiss={() => setNearbyBonusZone(null)}
        />
      )}
      {showSmartHubModal && selectedSmartHubId && (
        <Modal visible={showSmartHubModal} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSmartHubModal(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Smart Hub Details</Text>
              {/* @ts-expect-error */}
              <Text style={styles.hubName}>{smartHubs.find(hub => hub.hub_id === selectedSmartHubId).name}</Text>
              {/* @ts-expect-error */}
              <Text style={styles.hubDescription}>{smartHubs.find(hub => hub.hub_id === selectedSmartHubId).description}</Text>
              <Text style={styles.sectionTitle}>Available Facilities</Text>
              <FlatList
                style={styles.facilitiesList}
                data={/* @ts-expect-error */}smartHubs.find(hub => hub.hub_id === selectedSmartHubId).amenities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => <Text style={styles.facilityItem}>{item}</Text>}
              />
            </View>
          </View>
        </Modal>
      )}
      {showBonusZoneModal && selectedBonusZoneId && (
        <Modal visible={showBonusZoneModal} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowBonusZoneModal(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Bonus Zone Details</Text>
              {/* @ts-expect-error */}
              <Text style={styles.bonusMultiplier}>{(bonusZones.find(zone => zone.id === selectedBonusZoneId).multiplier * 100).toFixed(0)}% Bonus</Text>
              {/* @ts-expect-error */}
              <Text style={styles.bonusReason}>{bonusZones.find(zone => zone.id === selectedBonusZoneId).reason}</Text>
              {/* @ts-expect-error */}
              <Text style={styles.bonusTimeframe}>Valid until {new Date(bonusZones.find(zone => zone.id === selectedBonusZoneId).endTime).toLocaleString()}</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default MapScreen;