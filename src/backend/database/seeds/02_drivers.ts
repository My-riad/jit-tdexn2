import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';
import { 
  DriverStatus, 
  LicenseClass, 
  LicenseEndorsement, 
  HOSStatus 
} from '../../common/interfaces/driver.interface';

/**
 * Generate sample driver data for testing and development
 * 
 * @param count Number of driver records to generate
 * @param carrierIds Array of carrier IDs to associate with drivers
 * @returns Array of driver objects ready for database insertion
 */
const generateDriverData = (count: number, carrierIds: string[]) => {
  const drivers = [];
  
  // Define arrays for random selections
  const statuses = [
    DriverStatus.AVAILABLE,
    DriverStatus.ON_DUTY,
    DriverStatus.OFF_DUTY,
    DriverStatus.DRIVING,
    DriverStatus.INACTIVE
  ];
  
  const hosStatuses = [
    HOSStatus.DRIVING,
    HOSStatus.ON_DUTY,
    HOSStatus.OFF_DUTY,
    HOSStatus.SLEEPER_BERTH
  ];
  
  const licenseClasses = [
    LicenseClass.CLASS_A,
    LicenseClass.CLASS_B,
    LicenseClass.CLASS_C
  ];
  
  const eldProviders = ['KeepTruckin', 'Omnitracs', 'Samsara'];
  
  // Generate individual driver records
  for (let i = 0; i < count; i++) {
    // Pick random carrier from the provided carrier IDs or create a fallback
    const carrier_id = carrierIds.length > 0 
      ? carrierIds[Math.floor(Math.random() * carrierIds.length)]
      : uuidv4(); // Fallback if no carriers
    
    // Random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hos_status = hosStatuses[Math.floor(Math.random() * hosStatuses.length)];
    
    // Random license class and endorsements
    const license_class = licenseClasses[Math.floor(Math.random() * licenseClasses.length)];
    const license_endorsements = [];
    if (Math.random() > 0.5) license_endorsements.push(LicenseEndorsement.HAZMAT);
    if (Math.random() > 0.6) license_endorsements.push(LicenseEndorsement.TANKER);
    if (Math.random() > 0.7) license_endorsements.push(LicenseEndorsement.DOUBLE_TRIPLE);
    
    // Generate realistic HOS values based on status
    let driving_minutes_remaining = faker.number.int({ min: 0, max: 660 }); // 11 hours max
    let duty_minutes_remaining = faker.number.int({ min: driving_minutes_remaining, max: 840 }); // 14 hours max
    let cycle_minutes_remaining = faker.number.int({ min: duty_minutes_remaining, max: 3600 }); // 60 hours max (weekly cycle)
    
    if (hos_status === HOSStatus.OFF_DUTY || hos_status === HOSStatus.SLEEPER_BERTH) {
      driving_minutes_remaining = 660; // Full 11 hours available
      duty_minutes_remaining = 840; // Full 14 hours available
    } else if (hos_status === HOSStatus.DRIVING) {
      driving_minutes_remaining = faker.number.int({ min: 30, max: 300 }); // 0.5-5 hours left
      duty_minutes_remaining = faker.number.int({ min: driving_minutes_remaining + 60, max: 480 }); // 1-8 hours left
    }
    
    const driver = {
      driver_id: uuidv4(),
      user_id: uuidv4(), // This would be linked later in a real system
      carrier_id,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      license_number: faker.string.alphanumeric(10).toUpperCase(),
      license_state: faker.location.state({ abbreviated: true }),
      license_class,
      license_endorsements, // Store as array directly
      license_expiration: faker.date.future({ years: 4 }),
      home_address: { // Store as object directly
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zip: faker.location.zipCode()
      },
      current_location: { // Store as object directly
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude())
      },
      current_vehicle_id: null, // Would be set in a real system
      current_load_id: null, // Would be set in a real system
      status,
      hos_status,
      hos_status_since: faker.date.recent({ days: 1 }),
      driving_minutes_remaining,
      duty_minutes_remaining,
      cycle_minutes_remaining,
      efficiency_score: faker.number.int({ min: 60, max: 100 }), // Scale of 0-100
      eld_device_id: `ELD-${faker.string.alphanumeric(8).toUpperCase()}`,
      eld_provider: eldProviders[Math.floor(Math.random() * eldProviders.length)],
      created_at: faker.date.past({ years: 2 }),
      updated_at: faker.date.recent({ days: 30 }),
      active: Math.random() < 0.9 // 90% active, 10% inactive
    };
    
    drivers.push(driver);
  }
  
  return drivers;
};

/**
 * Seeds the drivers table with sample data
 * 
 * @param knex Knex instance for database operations
 * @returns Promise that resolves when seeding is complete
 */
export default async function seed(knex: Knex): Promise<void> {
  // Clear the table first
  await knex('drivers').del();
  
  // Get carrier IDs from the carriers table to establish relationships
  const carriers = await knex('carriers').select('carrier_id');
  const carrierIds = carriers.map(carrier => carrier.carrier_id);
  
  if (carrierIds.length === 0) {
    console.log('Warning: No carriers found. Creating drivers with generated carrier IDs.');
  }
  
  // Generate driver data - adjust count as needed
  const driverCount = 50; 
  const drivers = generateDriverData(driverCount, carrierIds);
  
  // Insert into database
  await knex('drivers').insert(drivers);
  
  console.log(`Seeded ${driverCount} drivers successfully.`);
}