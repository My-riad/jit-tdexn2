import { Knex } from 'knex';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment'; // v2.29.4

/**
 * Seeds the loads and load_locations tables with sample data
 * @param knex The Knex instance
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('load_locations').del();
  await knex('loads').del();

  // Get all shippers to reference in the loads
  const shippers = await knex('shippers').select('shipper_id');
  const shipperIds = shippers.map(shipper => shipper.shipper_id);

  if (shipperIds.length === 0) {
    console.warn('No shippers found in the database. Please run the shipper seeds first.');
    return;
  }

  // Generate load data
  const loadCount = 100; // Number of sample loads to create
  const loads = generateLoadData(loadCount, shipperIds);

  // Insert loads into the database
  await knex('loads').insert(loads);

  // Generate and insert load locations
  const loadLocations = generateLoadLocations(loads);
  await knex('load_locations').insert(loadLocations);

  console.log(`Created ${loads.length} sample loads with pickup and delivery locations.`);
}

/**
 * Generates an array of sample load objects
 * @param count Number of load objects to generate
 * @param shipperIds Array of shipper IDs to reference
 * @returns Array of load objects
 */
function generateLoadData(count: number, shipperIds: string[]): Array<any> {
  const loads = [];
  
  const equipmentTypes = ['DRY_VAN', 'REFRIGERATED', 'FLATBED'];
  
  const loadStatuses = [
    'CREATED', 'PENDING', 'AVAILABLE', 'RESERVED', 'ASSIGNED', 
    'IN_TRANSIT', 'AT_PICKUP', 'LOADED', 'AT_DELIVERY', 'DELIVERED', 'COMPLETED'
  ];
  
  const commodityTypes = [
    'Electronics', 'Food', 'Furniture', 'Clothing', 'Automotive Parts', 
    'Construction Materials', 'Medical Supplies', 'Chemicals', 'Paper Products',
    'Machinery', 'Beverages', 'Pharmaceuticals', 'Retail Goods', 'Raw Materials'
  ];

  for (let i = 0; i < count; i++) {
    const load_id = uuidv4();
    const shipper_id = shipperIds[Math.floor(Math.random() * shipperIds.length)];
    const equipment_type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
    const status = loadStatuses[Math.floor(Math.random() * loadStatuses.length)];
    const commodity_type = commodityTypes[Math.floor(Math.random() * commodityTypes.length)];
    
    // Generate weight between 5,000 and 45,000 pounds
    const weight = faker.number.int({ min: 5000, max: 45000 });
    
    // Generate dimensions
    const dimensions = {
      length: faker.number.int({ min: 8, max: 53 }),
      width: faker.number.int({ min: 4, max: 8 }),
      height: faker.number.int({ min: 4, max: 13 })
    };
    
    // Calculate volume
    const volume = dimensions.length * dimensions.width * dimensions.height;
    
    // Generate pallets (standard 53' trailer can fit around 26 pallets)
    const pallets = faker.number.int({ min: 1, max: 26 });
    
    // Generate pickup and delivery windows
    const now = moment();
    const pickupStart = moment(now).add(faker.number.int({ min: 1, max: 7 }), 'days')
      .set('hour', faker.number.int({ min: 7, max: 17 }))
      .set('minute', 0)
      .set('second', 0);
    
    const pickupEnd = moment(pickupStart).add(faker.number.int({ min: 2, max: 6 }), 'hours');
    
    const transitHours = Math.max(4, Math.ceil(faker.number.int({ min: 100, max: 1000 }) / 55)); // Rough estimate based on distance
    const deliveryStart = moment(pickupEnd).add(transitHours, 'hours');
    const deliveryEnd = moment(deliveryStart).add(faker.number.int({ min: 2, max: 6 }), 'hours');
    
    // Generate rate
    const ratePerMile = faker.number.float({ min: 1.5, max: 3.5, fractionDigits: 2 });
    const distance = faker.number.int({ min: 100, max: 1000 });
    const offered_rate = Math.round(ratePerMile * distance * 100) / 100;
    
    // Generate special instructions for some loads
    const hasSpecialInstructions = faker.datatype.boolean(0.7); // 70% chance of having special instructions
    const special_instructions = hasSpecialInstructions 
      ? faker.helpers.arrayElement([
          'Dock high only. Appointment required.',
          'Call ahead 1 hour before arrival.',
          'Forklift required for unloading.',
          'Residential delivery, liftgate required.',
          'Driver assist required for unloading.',
          'No touch freight, lumper service available.',
          'Oversized load, requires flags.',
          'Limited dock access, 48 foot trailer max.',
          'Drop trailer allowed.',
          'Live load/unload only.'
        ])
      : null;
    
    // Set hazardous flag (mostly false with some true)
    const is_hazardous = faker.datatype.boolean(0.1); // 10% chance of being hazardous
    
    // Set temperature requirements for refrigerated loads
    let temperature_min = null;
    let temperature_max = null;
    
    if (equipment_type === 'REFRIGERATED') {
      // Different temperature ranges based on common refrigerated goods
      const tempRanges = [
        { min: 32, max: 36 },  // Dairy, meat
        { min: -10, max: 0 },  // Frozen foods
        { min: 55, max: 65 },  // Produce
        { min: 33, max: 38 }   // Pharmaceuticals
      ];
      
      const selectedRange = faker.helpers.arrayElement(tempRanges);
      temperature_min = selectedRange.min;
      temperature_max = selectedRange.max;
    }
    
    loads.push({
      load_id,
      shipper_id,
      reference_number: `LOAD-${faker.string.numeric(5)}`,
      description: `${commodity_type} shipment from ${faker.location.city()} to ${faker.location.city()}`,
      equipment_type,
      weight,
      dimensions: JSON.stringify(dimensions),
      volume,
      pallets,
      commodity_type,
      status,
      pickup_earliest: pickupStart.toISOString(),
      pickup_latest: pickupEnd.toISOString(),
      delivery_earliest: deliveryStart.toISOString(),
      delivery_latest: deliveryEnd.toISOString(),
      distance,
      offered_rate,
      special_instructions,
      is_hazardous,
      temperature_min,
      temperature_max,
      created_at: faker.date.recent({ days: 30 }).toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return loads;
}

/**
 * Generates pickup and delivery locations for loads
 * @param loads Array of load objects
 * @returns Array of load location objects
 */
function generateLoadLocations(loads: Array<any>): Array<any> {
  const locations = [];
  
  const facilityTypes = [
    'Warehouse', 'Distribution Center', 'Factory', 'Retail Store', 
    'Fulfillment Center', 'Cross-dock Facility', 'Manufacturing Plant',
    'Logistics Hub', 'Cold Storage Facility', 'Port Terminal'
  ];
  
  // Define common shipping lanes with city pairs and approximate distances
  const shippingLanes = [
    { origin: { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 }, 
      destination: { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 }, 
      distance: 283 },
    { origin: { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 }, 
      destination: { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 }, 
      distance: 184 },
    { origin: { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 }, 
      destination: { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 }, 
      distance: 373 },
    { origin: { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 }, 
      destination: { city: 'Portland', state: 'OR', lat: 45.5051, lng: -122.6750 }, 
      distance: 174 },
    { origin: { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 }, 
      destination: { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 }, 
      distance: 215 },
    { origin: { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 }, 
      destination: { city: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 }, 
      distance: 236 },
    { origin: { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 }, 
      destination: { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 }, 
      distance: 239 },
    { origin: { city: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994 }, 
      destination: { city: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 }, 
      distance: 248 },
    { origin: { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 }, 
      destination: { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910 }, 
      distance: 371 },
    { origin: { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 }, 
      destination: { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 }, 
      distance: 245 }
  ];
  
  for (const load of loads) {
    // Select a random shipping lane
    const lane = faker.helpers.arrayElement(shippingLanes);
    
    // Update the load's distance to match the lane's distance
    load.distance = lane.distance;
    
    // Recalculate rate based on the actual distance
    const ratePerMile = load.offered_rate / load.distance;
    load.offered_rate = Math.round(ratePerMile * lane.distance * 100) / 100;
    
    // Update load description with actual origin/destination
    load.description = `${load.commodity_type} shipment from ${lane.origin.city}, ${lane.origin.state} to ${lane.destination.city}, ${lane.destination.state}`;
    
    // Generate pickup location
    const pickupFacilityType = faker.helpers.arrayElement(facilityTypes);
    const pickupFacilityName = `${faker.company.name()} ${pickupFacilityType}`;
    
    // Add some randomness to the exact coordinates
    const pickupLatVariation = (Math.random() - 0.5) * 0.1;
    const pickupLngVariation = (Math.random() - 0.5) * 0.1;
    
    // Pickup location
    locations.push({
      location_id: uuidv4(),
      load_id: load.load_id,
      location_type: 'PICKUP',
      facility_name: pickupFacilityName,
      address: faker.location.streetAddress(),
      city: lane.origin.city,
      state: lane.origin.state,
      zip_code: faker.location.zipCode(),
      latitude: lane.origin.lat + pickupLatVariation,
      longitude: lane.origin.lng + pickupLngVariation,
      earliest_time: load.pickup_earliest,
      latest_time: load.pickup_latest,
      contact_name: faker.person.fullName(),
      contact_phone: faker.phone.number(),
      special_instructions: faker.datatype.boolean(0.5) ? faker.helpers.arrayElement([
        'Check in at security gate',
        'Loading dock #5-8 only',
        'Bring pallet jack',
        'Call dispatch upon arrival',
        'Park in visitor area',
        'Loading hours: 8AM-5PM only',
        'Photo ID required'
      ]) : null,
      created_at: load.created_at,
      updated_at: load.updated_at
    });
    
    // Generate delivery location
    const deliveryFacilityType = faker.helpers.arrayElement(facilityTypes);
    const deliveryFacilityName = `${faker.company.name()} ${deliveryFacilityType}`;
    
    // Add some randomness to the exact coordinates
    const deliveryLatVariation = (Math.random() - 0.5) * 0.1;
    const deliveryLngVariation = (Math.random() - 0.5) * 0.1;
    
    // Delivery location
    locations.push({
      location_id: uuidv4(),
      load_id: load.load_id,
      location_type: 'DELIVERY',
      facility_name: deliveryFacilityName,
      address: faker.location.streetAddress(),
      city: lane.destination.city,
      state: lane.destination.state,
      zip_code: faker.location.zipCode(),
      latitude: lane.destination.lat + deliveryLatVariation,
      longitude: lane.destination.lng + deliveryLngVariation,
      earliest_time: load.delivery_earliest,
      latest_time: load.delivery_latest,
      contact_name: faker.person.fullName(),
      contact_phone: faker.phone.number(),
      special_instructions: faker.datatype.boolean(0.5) ? faker.helpers.arrayElement([
        'Receiving hours: 7AM-3PM',
        'Delivery appointment required',
        'Use rear entrance',
        'Unloading dock #1-4',
        'Check in with security',
        'No overnight parking',
        'Bring BOL and PO# for check-in'
      ]) : null,
      created_at: load.created_at,
      updated_at: load.updated_at
    });
  }
  
  return locations;
}

export default seed;