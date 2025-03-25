import { Knex } from 'knex'; // v2.4.2

/**
 * Migration function that creates the shippers table
 * 
 * Establishes the table structure for storing information about businesses
 * that need freight transported, including company details, contact info,
 * and credit ratings.
 */
export async function up(knex: Knex): Promise<void> {
  // Create uuid-ossp extension if it doesn't exist
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Create the shippers table
  await knex.schema.createTable('shippers', (table) => {
    // Primary key
    table.uuid('shipper_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    // Basic information
    table.string('name').notNullable();
    table.string('tax_id').unique();
    
    // Shipper type with check constraint
    table.string('shipper_type').notNullable();
    
    // Contact and address information
    table.jsonb('address').notNullable();
    table.jsonb('contact_info').notNullable();
    
    // Business information
    table.float('credit_rating');
    table.string('payment_terms');
    table.jsonb('preferred_carriers').defaultTo('[]');
    
    // Timestamps and status
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.boolean('active').notNullable().defaultTo(true);
    
    // Indexes
    table.index('shipper_type');
    table.index('credit_rating');
    table.index('active');
  });
  
  // Add PostgreSQL-specific features
  await knex.raw(`
    -- Add check constraint for shipper_type
    ALTER TABLE shippers 
    ADD CONSTRAINT check_shipper_type 
    CHECK (shipper_type IN ('MANUFACTURER', 'DISTRIBUTOR', 'RETAILER', 'BROKER', '3PL'));
    
    -- Create trigger for updating updated_at timestamp
    CREATE OR REPLACE FUNCTION update_shippers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER trigger_update_shippers_updated_at
    BEFORE UPDATE ON shippers
    FOR EACH ROW
    EXECUTE FUNCTION update_shippers_updated_at();
    
    -- Add table comment
    COMMENT ON TABLE shippers IS 'Stores information about businesses that need freight transported';
  `);
}

/**
 * Rollback function that removes the shippers table
 * 
 * Removes the table and associated database objects when migration is rolled back
 */
export async function down(knex: Knex): Promise<void> {
  // Drop trigger and function
  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_update_shippers_updated_at ON shippers;
    DROP FUNCTION IF EXISTS update_shippers_updated_at();
  `);
  
  // Drop table
  await knex.schema.dropTableIfExists('shippers');
}