import { Knex } from 'knex'; // v2.4.2
import { faker } from '@faker-js/faker'; // v8.0.2
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

/**
 * Generates an array of sample Smart Hub objects
 * @param count Number of Smart Hub objects to generate
 * @returns Array of Smart Hub objects ready for database insertion
 */
const generateSmartHubData = (count: number) => {
  const smartHubs = [];

  // Define hub types
  const hubTypes = [
    'TRUCK_STOP',
    'DISTRIBUTION_CENTER',
    'REST_AREA',
    'WAREHOUSE',
    'TERMINAL',
    'YARD',
    'OTHER'
  ];

  // Define possible amenities
  const amenities = [
    'PARKING',
    'RESTROOMS',
    'FOOD',
    'FUEL',
    'MAINTENANCE',
    'SHOWER',
    'LODGING',
    'SECURITY',
    'LOADING_DOCK',
    'SCALE'
  ];

  // Define major logistics corridors with coordinates for realistic hub placement
  const majorCorridors = [
    // I-95 Corridor (Eastern Seaboard)
    { name: 'I-95', startLat: 25.7617, startLng: -80.1918, endLat: 42.3601, endLng: -71.0589 },
    // I-80 Corridor (Northern cross-country)
    { name: 'I-80', startLat: 40.7128, startLng: -74.0060, endLat: 37.7749, endLng: -122.4194 },
    // I-10 Corridor (Southern cross-country)
    { name: 'I-10', startLat: 29.9511, startLng: -90.0715, endLat: 34.0522, endLng: -118.2437 },
    // I-35 Corridor (Central)
    { name: 'I-35', startLat: 29.4241, startLng: -98.4936, endLat: 44.9778, endLng: -93.2650 },
    // I-70 Corridor (Central cross-country)
    { name: 'I-70', startLat: 39.0997, startLng: -94.5786, endLat: 39.7392, endLng: -104.9903 },
  ];

  // Define hub name prefixes by type
  const nameByType = {
    'TRUCK_STOP': ['Big Rig', 'Interstate', 'Horizon', 'Freedom', 'Liberty', 'Eagle', 'Pilot', 'Flying J', 'TA', 'Petro'],
    'DISTRIBUTION_CENTER': ['Central', 'National', 'Regional', 'Premier', 'Allied', 'United', 'Global', 'Strategic'],
    'REST_AREA': ['Roadside', 'Travelers', 'Waypoint', 'Interstate', 'Highway', 'Welcome'],
    'WAREHOUSE': ['Storage', 'Fulfillment', 'Logistics', 'Supply Chain', 'Cargo', 'Freight', 'Distribution'],
    'TERMINAL': ['Gateway', 'Junction', 'Port', 'Hub', 'Nexus', 'Transit', 'Exchange'],
    'YARD': ['Holding', 'Staging', 'Container', 'Fleet', 'Equipment', 'Trailer'],
    'OTHER': ['Crossroads', 'Connector', 'Logistics', 'Freight', 'Transfer']
  };

  // Define state abbreviations
  const stateAbbreviations = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };

  for (let i = 0; i < count; i++) {
    // Pick a random corridor
    const corridor = majorCorridors[Math.floor(Math.random() * majorCorridors.length)];
    
    // Generate a point along the corridor with some randomization
    const ratio = Math.random();
    const latDiff = corridor.endLat - corridor.startLat;
    const lngDiff = corridor.endLng - corridor.startLng;
    const latitude = corridor.startLat + (latDiff * ratio) + (Math.random() * 0.5 - 0.25);
    const longitude = corridor.startLng + (lngDiff * ratio) + (Math.random() * 0.5 - 0.25);
    
    // Select a hub type
    const hubType = hubTypes[Math.floor(Math.random() * hubTypes.length)];
    
    // Generate a realistic name based on hub type
    const nameOptions = nameByType[hubType];
    const prefix = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const suffix = hubType.replace('_', ' ').toLowerCase();
    const name = `${prefix} ${suffix}`;
    
    // Generate address details
    const state = faker.location.state();
    const stateAbbr = stateAbbreviations[state];
    const city = faker.location.city();
    const streetAddress = faker.location.streetAddress();
    const zipCode = faker.location.zipCode();
    
    // Generate random amenities (3-8)
    const amenityCount = Math.floor(Math.random() * 6) + 3;
    const hubAmenities = [];
    const shuffledAmenities = [...amenities].sort(() => 0.5 - Math.random());
    for (let j = 0; j < amenityCount; j++) {
      hubAmenities.push(shuffledAmenities[j]);
    }
    
    // Set capacity based on hub type
    let capacity;
    if (hubType === 'DISTRIBUTION_CENTER' || hubType === 'TERMINAL') {
      capacity = Math.floor(Math.random() * 31) + 20; // 20-50
    } else if (hubType === 'TRUCK_STOP' || hubType === 'WAREHOUSE') {
      capacity = Math.floor(Math.random() * 16) + 10; // 10-25
    } else {
      capacity = Math.floor(Math.random() * 11) + 5; // 5-15
    }
    
    // Generate operating hours
    const openTime = Math.floor(Math.random() * 6) + 5; // 5 AM - 10 AM
    const closeTime = Math.floor(Math.random() * 6) + 17; // 5 PM - 10 PM
    const is24Hours = Math.random() < 0.4; // 40% chance of being 24 hours
    
    const daysOfOperation = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (Math.random() < 0.7) daysOfOperation.push('Saturday'); // 70% chance of Saturday
    if (Math.random() < 0.4) daysOfOperation.push('Sunday'); // 40% chance of Sunday
    
    const operatingHours = {
      is24Hours,
      openTime: is24Hours ? null : `${openTime.toString().padStart(2, '0')}:00`,
      closeTime: is24Hours ? null : `${closeTime.toString().padStart(2, '0')}:00`,
      daysOfOperation
    };
    
    // Calculate an efficiency score based on location, hub type, and amenities
    let efficiencyScore = 70 + Math.floor(Math.random() * 26); // Base score 70-95
    
    // Adjust score based on amenities
    if (hubAmenities.includes('LOADING_DOCK')) efficiencyScore += 3;
    if (hubAmenities.includes('PARKING')) efficiencyScore += 2;
    if (hubAmenities.includes('SECURITY')) efficiencyScore += 2;
    if (hubAmenities.includes('FUEL')) efficiencyScore += 1;
    
    // Cap at 100
    efficiencyScore = Math.min(efficiencyScore, 100);
    
    // Network impact score (0.1 to 0.9)
    const networkImpactScore = parseFloat((0.1 + Math.random() * 0.8).toFixed(2));
    
    // Create the smart hub object
    const smartHub = {
      id: uuidv4(),
      name,
      hub_type: hubType,
      latitude,
      longitude,
      address: streetAddress,
      city,
      state: stateAbbr,
      zip_code: zipCode,
      amenities: hubAmenities,
      capacity,
      operating_hours: operatingHours,
      efficiency_score: efficiencyScore,
      network_impact_score: networkImpactScore,
      active: Math.random() < 0.9, // 90% are active
      created_at: new Date(),
      updated_at: new Date()
    };
    
    smartHubs.push(smartHub);
  }
  
  return smartHubs;
};

/**
 * Seeds the smart_hubs table with sample data
 * @param knex Knex instance
 * @returns Promise that resolves when seeding is complete
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing smart hubs
  await knex('smart_hubs').del();
  
  // Generate and insert 50 smart hubs
  const smartHubs = generateSmartHubData(50);
  
  // Insert the generated data
  await knex('smart_hubs').insert(smartHubs);
  
  console.log(`Successfully seeded ${smartHubs.length} smart hubs.`);
}