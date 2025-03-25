import type { Knex } from 'knex'; // v2.4.2

/**
 * Migration function that sets up the initial database schema
 * @param knex Knex instance
 * @returns Promise that resolves when migration is complete
 */
export async function up(knex: Knex): Promise<void> {
  // Enable PostgreSQL extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

  // Create enum types
  await knex.raw(`
    CREATE TYPE user_role AS ENUM (
      'system_admin',
      'fleet_manager',
      'dispatcher',
      'driver',
      'shipper_admin',
      'shipping_coordinator'
    );
  `);

  await knex.raw(`
    CREATE TYPE load_status AS ENUM (
      'created',
      'pending',
      'optimizing',
      'available',
      'reserved',
      'assigned',
      'in_transit',
      'at_pickup',
      'loaded',
      'at_dropoff',
      'delivered',
      'completed',
      'cancelled',
      'expired'
    );
  `);

  await knex.raw(`
    CREATE TYPE driver_status AS ENUM (
      'available',
      'assigned',
      'in_transit',
      'off_duty',
      'on_break',
      'inactive'
    );
  `);

  await knex.raw(`
    CREATE TYPE vehicle_type AS ENUM (
      'tractor',
      'straight_truck',
      'sprinter_van'
    );
  `);

  await knex.raw(`
    CREATE TYPE equipment_type AS ENUM (
      'dry_van',
      'refrigerated',
      'flatbed',
      'specialized',
      'tanker',
      'container'
    );
  `);

  // Create utility functions for geospatial operations
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_distance(
      lat1 DOUBLE PRECISION,
      lon1 DOUBLE PRECISION,
      lat2 DOUBLE PRECISION,
      lon2 DOUBLE PRECISION
    ) RETURNS DOUBLE PRECISION AS $$
    DECLARE
      point1 GEOMETRY;
      point2 GEOMETRY;
    BEGIN
      point1 := ST_SetSRID(ST_MakePoint(lon1, lat1), 4326);
      point2 := ST_SetSRID(ST_MakePoint(lon2, lat2), 4326);
      RETURN ST_DistanceSphere(point1, point2) / 1609.344; -- Convert meters to miles
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `);

  // Create a general function template for finding nearby points
  // This will be used as a base for specific entity tables with location columns
  await knex.raw(`
    CREATE OR REPLACE FUNCTION create_find_nearby_points_function(
      table_name TEXT,
      location_column TEXT
    ) RETURNS VOID AS $$
    BEGIN
      EXECUTE format('
        CREATE OR REPLACE FUNCTION find_nearby_%1$s(
          lat DOUBLE PRECISION,
          lon DOUBLE PRECISION,
          radius_miles DOUBLE PRECISION
        ) RETURNS TABLE(id UUID, distance DOUBLE PRECISION) AS $func$
        DECLARE
          search_point GEOMETRY;
          search_radius DOUBLE PRECISION;
        BEGIN
          search_point := ST_SetSRID(ST_MakePoint(lon, lat), 4326);
          search_radius := radius_miles * 1609.344; -- Convert miles to meters
          RETURN QUERY SELECT p.id, ST_DistanceSphere(p.%2$s, search_point) / 1609.344 AS distance
                       FROM %1$s p
                       WHERE ST_DWithin(p.%2$s, search_point, search_radius)
                       ORDER BY distance;
        END;
        $func$ LANGUAGE plpgsql STABLE;
      ', table_name, location_column);
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger functions for automatic timestamp management
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create function for creating update timestamp triggers
  await knex.raw(`
    CREATE OR REPLACE FUNCTION create_timestamp_trigger(table_name TEXT) RETURNS VOID AS $$
    BEGIN
      EXECUTE format('
        CREATE TRIGGER update_%1$s_timestamp
        BEFORE UPDATE ON %1$s
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
      ', table_name);
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Set up database schema versioning table
  await knex.schema.createTable('schema_version', (table) => {
    table.increments('id').primary();
    table.string('version').notNullable();
    table.string('description').notNullable();
    table.timestamp('applied_at').defaultTo(knex.fn.now()).notNullable();
  });

  // Insert initial version
  await knex.raw(`
    INSERT INTO schema_version (version, description) 
    VALUES ('1.0.0', 'Initial schema setup');
  `);

  // Create audit logging infrastructure
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('table_name').notNullable();
    table.uuid('record_id').notNullable();
    table.string('action').notNullable();
    table.uuid('user_id');
    table.jsonb('old_data');
    table.jsonb('new_data');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.index(['table_name', 'record_id']);
    table.index('user_id');
    table.index('created_at');
  });

  // Create audit log function and trigger
  await knex.raw(`
    CREATE OR REPLACE FUNCTION audit_log_changes() RETURNS TRIGGER AS $$
    DECLARE
      audit_row audit_logs;
      include_old BOOLEAN;
      include_new BOOLEAN;
    BEGIN
      audit_row = ROW(
        uuid_generate_v4(),
        TG_TABLE_NAME::TEXT,
        CASE 
          WHEN TG_OP = 'DELETE' THEN OLD.id
          ELSE NEW.id
        END,
        CASE
          WHEN TG_OP = 'INSERT' THEN 'INSERT'
          WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
          WHEN TG_OP = 'DELETE' THEN 'DELETE'
          ELSE TG_OP
        END,
        current_setting('app.current_user_id', TRUE)::uuid,
        NULL,
        NULL,
        NOW()
      );

      include_old = TG_OP = 'UPDATE' OR TG_OP = 'DELETE';
      include_new = TG_OP = 'INSERT' OR TG_OP = 'UPDATE';

      IF include_old THEN
        audit_row.old_data = to_jsonb(OLD);
      END IF;

      IF include_new THEN
        audit_row.new_data = to_jsonb(NEW);
      END IF;

      INSERT INTO audit_logs VALUES (audit_row.*);
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create function for creating audit triggers
  await knex.raw(`
    CREATE OR REPLACE FUNCTION create_audit_trigger(table_name TEXT) RETURNS VOID AS $$
    BEGIN
      EXECUTE format('
        CREATE TRIGGER audit_%1$s_changes
        AFTER INSERT OR UPDATE OR DELETE ON %1$s
        FOR EACH ROW EXECUTE FUNCTION audit_log_changes();
      ', table_name);
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Set up database-level security policies
  await knex.raw(`
    -- Function to check if current user has a specific role
    CREATE OR REPLACE FUNCTION has_role(required_role TEXT) RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE id = current_setting('app.current_user_id', TRUE)::uuid
        AND role::TEXT = required_role
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql STABLE;

    -- Function to check if current user owns a record
    CREATE OR REPLACE FUNCTION is_owner(table_name TEXT, record_id UUID) RETURNS BOOLEAN AS $$
    DECLARE
      owner_id UUID;
    BEGIN
      EXECUTE format('SELECT user_id FROM %I WHERE id = $1', table_name)
      INTO owner_id
      USING record_id;
      
      RETURN owner_id = current_setting('app.current_user_id', TRUE)::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql STABLE;
  `);
}

/**
 * Rollback function that removes the initial database schema setup
 * @param knex Knex instance
 * @returns Promise that resolves when rollback is complete
 */
export async function down(knex: Knex): Promise<void> {
  // Drop all security policy functions
  await knex.raw('DROP FUNCTION IF EXISTS has_role CASCADE');
  await knex.raw('DROP FUNCTION IF EXISTS is_owner CASCADE');

  // Drop audit logging
  await knex.raw('DROP FUNCTION IF EXISTS create_audit_trigger CASCADE');
  await knex.raw('DROP FUNCTION IF EXISTS audit_log_changes CASCADE');
  await knex.schema.dropTableIfExists('audit_logs');

  // Drop timestamp trigger functions
  await knex.raw('DROP FUNCTION IF EXISTS create_timestamp_trigger CASCADE');
  await knex.raw('DROP FUNCTION IF EXISTS update_timestamp CASCADE');

  // Drop geospatial functions
  await knex.raw('DROP FUNCTION IF EXISTS create_find_nearby_points_function CASCADE');
  await knex.raw('DROP FUNCTION IF EXISTS calculate_distance CASCADE');

  // Drop schema version table
  await knex.schema.dropTableIfExists('schema_version');

  // Drop enum types
  await knex.raw('DROP TYPE IF EXISTS equipment_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS vehicle_type CASCADE');
  await knex.raw('DROP TYPE IF EXISTS driver_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS load_status CASCADE');
  await knex.raw('DROP TYPE IF EXISTS user_role CASCADE');

  // Disable extensions
  await knex.raw('DROP EXTENSION IF EXISTS "pg_trgm" CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS "btree_gist" CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS "postgis" CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE');
}