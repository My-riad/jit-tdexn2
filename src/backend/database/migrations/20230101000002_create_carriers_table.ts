import * as Knex from 'knex';

export async function up(knex: Knex.Knex): Promise<void> {
  // Create carrier_types enum if it doesn't exist
  await knex.raw(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carrier_type') THEN
        CREATE TYPE carrier_type AS ENUM (
          'OWNER_OPERATOR',
          'SMALL_FLEET',
          'MID_SIZE_FLEET',
          'LARGE_FLEET',
          'ENTERPRISE'
        );
      END IF;
    END$$;
  `);

  // Create carriers table
  await knex.schema.createTable('carriers', (table) => {
    table.uuid('carrier_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable().index();
    table.string('dot_number').unique().comment('Department of Transportation number');
    table.string('mc_number').unique().comment('Motor Carrier number');
    table.string('tax_id');
    table.specificType('carrier_type', 'carrier_type').notNullable().index()
      .comment('Type of carrier based on fleet size');
    table.jsonb('address').comment('Structured address data');
    table.jsonb('contact_info').comment('Structured contact information');
    table.integer('fleet_size').defaultTo(1).index()
      .comment('Number of vehicles in fleet');
    table.string('insurance_provider');
    table.string('insurance_policy_number');
    table.decimal('insurance_coverage_amount', 12, 2);
    table.date('insurance_expiration_date');
    table.string('safety_rating');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.boolean('active').notNullable().defaultTo(true).index();
  });

  // Add comments to table
  await knex.raw(`
    COMMENT ON TABLE carriers IS 'Table storing information about trucking companies and fleet operators who employ drivers, own vehicles, and transport loads for shippers'
  `);

  // Create trigger for automatically updating updated_at timestamp
  await knex.raw(`
    CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON carriers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create indexes on frequently queried columns
  await knex.schema.alterTable('carriers', (table) => {
    // Additional indexes beyond those created inline above
    table.index(['insurance_expiration_date']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex.Knex): Promise<void> {
  // Drop the carriers table
  await knex.schema.dropTableIfExists('carriers');

  // Drop the trigger
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_carriers_updated_at ON carriers;
  `);

  // Don't drop carrier_type enum here as it might be used by other tables
  // It would be dropped in a separate migration if needed
}