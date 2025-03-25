import { Knex } from 'knex';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates an array of sample carrier objects
 * @param count Number of carrier records to generate
 * @returns Array of carrier objects ready for database insertion
 */
function generateCarrierData(count: number) {
  const carriers = [];
  
  // Define carrier types and safety ratings for realistic variation
  const carrierTypes = ['OWNER_OPERATOR', 'SMALL_FLEET', 'MID_SIZE_FLEET', 'LARGE_FLEET', 'ENTERPRISE'];
  const safetyRatings = ['Satisfactory', 'Conditional', 'Unsatisfactory'];
  
  for (let i = 0; i < count; i++) {
    // Generate a realistic company name
    const name = faker.company.name() + ' ' + faker.helpers.arrayElement(['Trucking', 'Logistics', 'Transport', 'Carriers', 'Freight']);
    
    // Determine carrier type and corresponding fleet size
    const carrierType = faker.helpers.arrayElement(carrierTypes);
    let fleetSize;
    
    switch (carrierType) {
      case 'OWNER_OPERATOR':
        fleetSize = faker.number.int({ min: 1, max: 5 });
        break;
      case 'SMALL_FLEET':
        fleetSize = faker.number.int({ min: 6, max: 25 });
        break;
      case 'MID_SIZE_FLEET':
        fleetSize = faker.number.int({ min: 26, max: 100 });
        break;
      case 'LARGE_FLEET':
        fleetSize = faker.number.int({ min: 101, max: 500 });
        break;
      case 'ENTERPRISE':
        fleetSize = faker.number.int({ min: 501, max: 2000 });
        break;
      default:
        fleetSize = faker.number.int({ min: 1, max: 10 });
    }
    
    // Generate DOT number (format: 7-digit number)
    const dotNumber = faker.number.int({ min: 1000000, max: 9999999 }).toString();
    
    // Generate MC number (format: MC-xxxxxx)
    const mcNumber = 'MC-' + faker.number.int({ min: 100000, max: 999999 }).toString();
    
    // Generate tax ID (EIN format: XX-XXXXXXX)
    const taxId = faker.number.int({ min: 10, max: 99 }) + '-' + 
                 faker.number.int({ min: 1000000, max: 9999999 }).toString();
    
    // Generate address
    const address = {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: 'US'
    };
    
    // Generate contact information
    const contactInfo = {
      contactName: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: 'https://www.' + faker.internet.domainName()
    };
    
    // Generate insurance information
    const insurance = {
      provider: faker.company.name() + ' Insurance',
      policyNumber: faker.finance.accountNumber(),
      coverageAmount: faker.helpers.arrayElement([1000000, 2000000, 5000000, 10000000]),
      expirationDate: faker.date.future().toISOString()
    };
    
    // Determine safety rating
    const safetyRating = faker.helpers.arrayElement(safetyRatings);
    
    // Set timestamps
    const createdAt = faker.date.past({ years: 3 });
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    
    // Determine if carrier is active (mostly active with some inactive)
    const active = Math.random() < 0.9; // 90% chance of being active
    
    carriers.push({
      id: uuidv4(),
      name,
      dot_number: dotNumber,
      mc_number: mcNumber,
      tax_id: taxId,
      carrier_type: carrierType,
      address: JSON.stringify(address),
      contact_info: JSON.stringify(contactInfo),
      fleet_size: fleetSize,
      insurance: JSON.stringify(insurance),
      safety_rating: safetyRating,
      created_at: createdAt,
      updated_at: updatedAt,
      active
    });
  }
  
  return carriers;
}

/**
 * Seeds the carriers table with sample data
 * @param knex Knex instance
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('carriers').del();
  
  // Generate sample carrier data (50 carriers)
  const carriers = generateCarrierData(50);
  
  // Insert data into carriers table
  await knex('carriers').insert(carriers);
  
  console.log('Carriers table seeded successfully');
}

export default seed;