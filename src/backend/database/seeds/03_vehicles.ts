import Knex from 'knex'; // ^2.4.2
import { faker } from '@faker-js/faker'; // ^8.0.2
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0
import { 
  VehicleType, 
  VehicleStatus, 
  FuelType 
} from '../../common/interfaces/vehicle.interface';

/**
 * Seeds the vehicles table with sample data
 * @param knex Knex instance
 */
export default async function seed(knex: Knex): Promise<void> {
  // Clear existing data from vehicles table
  await knex('vehicles').del();
  
  // Get carrier IDs to establish relationships
  const carriers = await knex('carriers').select('carrier_id');
  const carrierIds = carriers.map(carrier => carrier.carrier_id);
  
  if (carrierIds.length === 0) {
    console.warn('No carriers found in the database. Make sure to run carrier seeds first.');
    return;
  }
  
  // Get driver IDs for potential assignment
  const drivers = await knex('drivers').select('driver_id');
  const driverIds = drivers.map(driver => driver.driver_id);
  
  // Generate vehicle data
  const vehicles = generateVehicleData(100, carrierIds, driverIds);
  
  // Insert vehicles
  await knex('vehicles').insert(vehicles);
  
  console.log('Vehicles table seeded successfully');
}

/**
 * Generates an array of sample vehicle objects
 * @param count Number of vehicles to generate
 * @param carrierIds Array of carrier IDs to assign vehicles to
 * @param driverIds Array of driver IDs for potential assignment
 * @returns Array of vehicle objects ready for database insertion
 */
function generateVehicleData(count: number, carrierIds: string[], driverIds: string[]): any[] {
  const vehicles = [];
  
  // Define vehicle types using imported enum
  const vehicleTypes = [
    VehicleType.TRACTOR,
    VehicleType.STRAIGHT_TRUCK,
    VehicleType.DRY_VAN_TRAILER,
    VehicleType.REFRIGERATED_TRAILER,
    VehicleType.FLATBED_TRAILER,
    VehicleType.TANKER_TRAILER,
    VehicleType.LOWBOY_TRAILER
  ];
  
  // Define vehicle statuses using imported enum
  const vehicleStatuses = [
    VehicleStatus.ACTIVE,
    VehicleStatus.INACTIVE,
    VehicleStatus.AVAILABLE,
    VehicleStatus.IN_USE,
    VehicleStatus.MAINTENANCE,
    VehicleStatus.OUT_OF_SERVICE
  ];
  
  // Define fuel types using imported enum
  const fuelTypes = [
    FuelType.DIESEL,
    FuelType.GASOLINE,
    FuelType.ELECTRIC,
    FuelType.HYBRID,
    FuelType.NATURAL_GAS,
    FuelType.HYDROGEN
  ];
  
  // Define truck manufacturers
  const truckManufacturers = [
    'Freightliner',
    'Peterbilt',
    'Kenworth',
    'Volvo',
    'Mack',
    'International'
  ];
  
  // Define trailer manufacturers
  const trailerManufacturers = [
    'Great Dane',
    'Utility',
    'Wabash',
    'Hyundai',
    'Stoughton'
  ];
  
  // US states for license plates
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  for (let i = 0; i < count; i++) {
    const vehicleId = uuidv4();
    const carrierId = faker.helpers.arrayElement(carrierIds);
    const vehicleType = faker.helpers.arrayElement(vehicleTypes);
    
    // Determine if it's a truck or trailer
    const isTruck = vehicleType === VehicleType.TRACTOR || vehicleType === VehicleType.STRAIGHT_TRUCK;
    
    // Generate VIN (Vehicle Identification Number)
    const vin = faker.vehicle.vin();
    
    // Select appropriate manufacturer based on vehicle type
    const make = isTruck 
      ? faker.helpers.arrayElement(truckManufacturers) 
      : faker.helpers.arrayElement(trailerManufacturers);
    
    // Generate model based on manufacturer
    let model = '';
    if (make === 'Freightliner') {
      model = faker.helpers.arrayElement(['Cascadia', 'Columbia', 'Coronado', 'M2', 'Century']);
    } else if (make === 'Peterbilt') {
      model = faker.helpers.arrayElement(['379', '389', '579', '567', '387']);
    } else if (make === 'Kenworth') {
      model = faker.helpers.arrayElement(['T680', 'T880', 'W900', 'T660', 'T800']);
    } else if (make === 'Volvo') {
      model = faker.helpers.arrayElement(['VNL', 'VNR', 'VHD', 'VNX', 'VNM']);
    } else if (make === 'Mack') {
      model = faker.helpers.arrayElement(['Anthem', 'Pinnacle', 'Granite', 'TerraPro', 'LR']);
    } else if (make === 'International') {
      model = faker.helpers.arrayElement(['LoneStar', 'LT', 'RH', 'MV', 'HV']);
    } else if (make === 'Great Dane') {
      model = faker.helpers.arrayElement(['Champion', 'Freedom', 'Everest', 'Alpine', 'Classic']);
    } else if (make === 'Utility') {
      model = faker.helpers.arrayElement(['3000R', '4000D', 'VS2RA', '4000AE', 'Tautliner']);
    } else if (make === 'Wabash') {
      model = faker.helpers.arrayElement(['DuraPlate', 'ArcticLite', 'RoadRailer', 'FreightPro', 'DuraPlate HD']);
    } else if (make === 'Hyundai') {
      model = faker.helpers.arrayElement(['HT', 'Translead', 'Container', 'Chassis', 'Flatbed']);
    } else if (make === 'Stoughton') {
      model = faker.helpers.arrayElement(['Z-Plate', 'AVW', 'DVW', 'Aluminum', 'Stock']);
    }
    
    // Generate year between 2010 and current year
    const year = faker.number.int({ min: 2010, max: new Date().getFullYear() });
    
    // Generate license plate
    const plateNumber = faker.vehicle.vrm();
    const plateState = faker.helpers.arrayElement(states);
    
    // Assign a random status
    const status = faker.helpers.arrayElement(vehicleStatuses);
    
    // Assign driver if status is IN_USE
    const currentDriverId = status === VehicleStatus.IN_USE && driverIds.length > 0 
      ? faker.helpers.arrayElement(driverIds) 
      : null;
    
    // No current load assigned in initial seed
    const currentLoadId = null;
    
    // Generate current location
    const currentLocation = {
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude())
    };
    
    // Set appropriate weight capacity based on vehicle type
    let weightCapacity = 0;
    if (vehicleType === VehicleType.TRACTOR) {
      weightCapacity = 0; // Tractors themselves don't carry weight
    } else if (vehicleType === VehicleType.STRAIGHT_TRUCK) {
      weightCapacity = faker.number.int({ min: 10000, max: 33000 });
    } else if (vehicleType === VehicleType.DRY_VAN_TRAILER) {
      weightCapacity = faker.number.int({ min: 40000, max: 45000 });
    } else if (vehicleType === VehicleType.REFRIGERATED_TRAILER) {
      weightCapacity = faker.number.int({ min: 38000, max: 44000 });
    } else if (vehicleType === VehicleType.FLATBED_TRAILER) {
      weightCapacity = faker.number.int({ min: 42000, max: 48000 });
    } else if (vehicleType === VehicleType.TANKER_TRAILER) {
      weightCapacity = faker.number.int({ min: 42000, max: 50000 });
    } else if (vehicleType === VehicleType.LOWBOY_TRAILER) {
      weightCapacity = faker.number.int({ min: 40000, max: 55000 });
    }
    
    // Set appropriate volume capacity based on vehicle type
    let volumeCapacity = 0;
    if (vehicleType === VehicleType.TRACTOR) {
      volumeCapacity = 0; // Tractors don't have volume capacity
    } else if (vehicleType === VehicleType.STRAIGHT_TRUCK) {
      volumeCapacity = faker.number.int({ min: 800, max: 1500 });
    } else if (vehicleType === VehicleType.DRY_VAN_TRAILER) {
      volumeCapacity = faker.number.int({ min: 3000, max: 3500 });
    } else if (vehicleType === VehicleType.REFRIGERATED_TRAILER) {
      volumeCapacity = faker.number.int({ min: 2800, max: 3300 });
    } else if (vehicleType === VehicleType.FLATBED_TRAILER) {
      volumeCapacity = 0; // Flatbeds don't have enclosed volume
    } else if (vehicleType === VehicleType.TANKER_TRAILER) {
      volumeCapacity = faker.number.int({ min: 5000, max: 11000 });
    } else if (vehicleType === VehicleType.LOWBOY_TRAILER) {
      volumeCapacity = 0; // Lowboys don't have enclosed volume
    }
    
    // Generate dimensions appropriate for vehicle type
    let dimensions = { length: 0, width: 0, height: 0 };
    if (vehicleType === VehicleType.TRACTOR) {
      dimensions = {
        length: faker.number.int({ min: 15, max: 20 }),
        width: faker.number.int({ min: 8, max: 9 }),
        height: faker.number.int({ min: 9, max: 13 })
      };
    } else if (vehicleType === VehicleType.STRAIGHT_TRUCK) {
      dimensions = {
        length: faker.number.int({ min: 20, max: 30 }),
        width: faker.number.int({ min: 8, max: 8.5 }),
        height: faker.number.int({ min: 10, max: 13 })
      };
    } else if (vehicleType === VehicleType.DRY_VAN_TRAILER || 
               vehicleType === VehicleType.REFRIGERATED_TRAILER) {
      dimensions = {
        length: faker.number.int({ min: 48, max: 53 }),
        width: faker.number.int({ min: 8, max: 8.5 }),
        height: faker.number.int({ min: 12.5, max: 13.5 })
      };
    } else if (vehicleType === VehicleType.FLATBED_TRAILER) {
      dimensions = {
        length: faker.number.int({ min: 48, max: 53 }),
        width: faker.number.int({ min: 8, max: 8.5 }),
        height: faker.number.int({ min: 4, max: 5 })
      };
    } else if (vehicleType === VehicleType.TANKER_TRAILER) {
      dimensions = {
        length: faker.number.int({ min: 40, max: 53 }),
        width: faker.number.int({ min: 8, max: 8.5 }),
        height: faker.number.int({ min: 8, max: 11 })
      };
    } else if (vehicleType === VehicleType.LOWBOY_TRAILER) {
      dimensions = {
        length: faker.number.int({ min: 48, max: 53 }),
        width: faker.number.int({ min: 8.5, max: 9.5 }),
        height: faker.number.int({ min: 3, max: 4 })
      };
    }
    
    // Assign fuel type based on vehicle type
    let fuelType = null;
    if (isTruck) {
      // Weight distribution towards diesel for trucks
      fuelType = faker.helpers.arrayElement([
        FuelType.DIESEL, FuelType.DIESEL, FuelType.DIESEL, FuelType.DIESEL, 
        FuelType.NATURAL_GAS, FuelType.ELECTRIC
      ]);
    } else {
      fuelType = null; // Trailers don't have fuel types
    }
    
    // Set fuel capacity based on vehicle type and fuel type
    let fuelCapacity = 0;
    if (isTruck) {
      if (fuelType === FuelType.DIESEL || fuelType === FuelType.GASOLINE) {
        fuelCapacity = faker.number.int({ min: 100, max: 300 });
      } else if (fuelType === FuelType.NATURAL_GAS) {
        fuelCapacity = faker.number.int({ min: 70, max: 150 });
      } else if (fuelType === FuelType.ELECTRIC) {
        fuelCapacity = faker.number.int({ min: 250, max: 500 }); // kWh for electric
      } else if (fuelType === FuelType.HYDROGEN) {
        fuelCapacity = faker.number.int({ min: 30, max: 60 }); // kg for hydrogen
      } else if (fuelType === FuelType.HYBRID) {
        fuelCapacity = faker.number.int({ min: 50, max: 150 });
      }
    }
    
    // Generate average MPG based on vehicle type and fuel type
    let averageMpg = 0;
    if (isTruck) {
      if (fuelType === FuelType.DIESEL) {
        averageMpg = faker.number.float({ min: 5.5, max: 7.5, precision: 0.1 });
      } else if (fuelType === FuelType.GASOLINE) {
        averageMpg = faker.number.float({ min: 5.0, max: 7.0, precision: 0.1 });
      } else if (fuelType === FuelType.NATURAL_GAS) {
        averageMpg = faker.number.float({ min: 5.0, max: 7.0, precision: 0.1 });
      } else if (fuelType === FuelType.ELECTRIC) {
        averageMpg = faker.number.float({ min: 1.5, max: 2.5, precision: 0.1 }); // Miles per kWh for electric
      } else if (fuelType === FuelType.HYDROGEN) {
        averageMpg = faker.number.float({ min: 6.0, max: 8.0, precision: 0.1 }); // Miles per kg for hydrogen
      } else if (fuelType === FuelType.HYBRID) {
        averageMpg = faker.number.float({ min: 7.0, max: 9.0, precision: 0.1 });
      }
    }
    
    // Generate odometer reading
    const odometer = isTruck ? faker.number.int({ min: 0, max: 500000 }) : null;
    
    // Generate ELD device ID for trucks
    const eldDeviceId = isTruck ? `ELD-${faker.string.alphanumeric(8).toUpperCase()}` : null;
    
    // Generate maintenance dates
    const lastMaintenanceDate = faker.date.past();
    const nextMaintenanceDate = faker.date.future();
    
    // Set timestamps
    const createdAt = faker.date.past();
    const updatedAt = faker.date.recent();
    
    // Set active status (mostly true with some inactive)
    const active = faker.helpers.arrayElement([true, true, true, true, false]);
    
    vehicles.push({
      vehicle_id: vehicleId,
      carrier_id: carrierId,
      type: vehicleType,
      vin,
      make,
      model,
      year,
      plate_number: plateNumber,
      plate_state: plateState,
      status,
      current_driver_id: currentDriverId,
      current_load_id: currentLoadId,
      current_location: JSON.stringify(currentLocation),
      weight_capacity: weightCapacity,
      volume_capacity: volumeCapacity,
      dimensions: JSON.stringify(dimensions),
      fuel_type: fuelType,
      fuel_capacity: fuelCapacity,
      average_mpg: averageMpg,
      odometer,
      eld_device_id: eldDeviceId,
      last_maintenance_date: lastMaintenanceDate,
      next_maintenance_date: nextMaintenanceDate,
      created_at: createdAt,
      updated_at: updatedAt,
      active
    });
  }
  
  return vehicles;
}