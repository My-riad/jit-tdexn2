import { Knex } from 'knex';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates an array of sample shipper objects
 * @param count Number of shipper records to generate
 * @returns Array of shipper objects ready for database insertion
 */
function generateShipperData(count: number): Array<object> {
  const shippers = [];
  
  // Define shipper types
  const shipperTypes = ['MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'BROKER', '3PL'];
  
  // Define possible payment terms
  const paymentTerms = ['Net 30', 'Net 45', 'Net 60', 'Net 15', 'Due on Receipt'];
  
  // Generate specified number of shipper records
  for (let i = 0; i < count; i++) {
    // Generate a realistic company name
    const companyName = faker.company.name();
    
    // Generate a tax ID in EIN format (XX-XXXXXXX)
    const taxId = faker.string.numeric(2) + '-' + faker.string.numeric(7);
    
    // Assign a shipper type
    const shipperType = shipperTypes[Math.floor(Math.random() * shipperTypes.length)];
    
    // Generate address
    const address = {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zip: faker.location.zipCode(),
      country: 'USA'
    };
    
    // Generate contact information
    const contactInfo = {
      contactName: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email({ firstName: faker.person.firstName(), lastName: faker.person.lastName(), provider: 'example.com' }),
      website: `www.${faker.helpers.slugify(companyName.toLowerCase())}.com`
    };
    
    // Generate credit rating (300-850, higher is better)
    const creditRating = parseFloat(faker.number.float({ min: 300, max: 850, precision: 0.1 }).toFixed(1));
    
    // Generate payment terms
    const paymentTerm = paymentTerms[Math.floor(Math.random() * paymentTerms.length)];
    
    // Generate preferred carriers (most will be empty, some will have references)
    const preferredCarriers = Math.random() > 0.7 ? 
      [uuidv4(), uuidv4()].slice(0, Math.floor(Math.random() * 2) + 1) : 
      [];
    
    // Generate timestamps
    const createdAt = faker.date.past({ years: 2 });
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
    
    // Set active status (90% active, 10% inactive)
    const isActive = Math.random() < 0.9;
    
    // Create shipper object
    const shipper = {
      id: uuidv4(),
      name: companyName,
      tax_id: taxId,
      shipper_type: shipperType,
      address: JSON.stringify(address),
      contact_info: JSON.stringify(contactInfo),
      credit_rating: creditRating,
      payment_terms: paymentTerm,
      preferred_carriers: preferredCarriers.length > 0 ? JSON.stringify(preferredCarriers) : null,
      created_at: createdAt,
      updated_at: updatedAt,
      active: isActive,
      company_code: faker.string.alphanumeric(6).toUpperCase(),
      notes: Math.random() > 0.7 ? faker.lorem.paragraph() : null,
      account_manager_id: Math.random() > 0.5 ? uuidv4() : null
    };
    
    shippers.push(shipper);
  }
  
  return shippers;
}

/**
 * Seeds the shippers table with sample data
 * @param knex Knex instance
 * @returns Promise that resolves when seeding is complete
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data from shippers table
  await knex('shippers').del();
  
  // Generate sample shipper data (50 records)
  const shippers = generateShipperData(50);
  
  // Insert shipper records into the database
  await knex('shippers').insert(shippers);
  
  console.log('Shippers table seeded successfully with 50 records.');
}

export default seed;