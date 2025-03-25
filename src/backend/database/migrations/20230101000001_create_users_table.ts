import { Knex } from 'knex'; // v2.4.2

/**
 * Create the users table and related tables for the authentication and authorization system
 */
export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension if not already enabled
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  // Create users table
  await knex.schema.createTable('users', (table) => {
    // Identity columns
    table.uuid('user_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).unique().notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20).nullable();
    
    // Authentication columns
    table.string('password_hash', 255).nullable();
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token', 255).nullable();
    table.string('auth_provider', 50).nullable();
    table.string('auth_provider_id', 255).nullable();
    
    // User classification
    table.enum('user_type', [
      'system_administrator',
      'fleet_manager',
      'dispatcher',
      'driver',
      'shipper_administrator',
      'shipping_coordinator',
      'warehouse_user',
      'account_manager',
      'system_operator',
      'fleet_analyst'
    ]).notNullable();
    
    table.enum('status', [
      'active',
      'inactive',
      'pending',
      'locked'
    ]).defaultTo('pending').notNullable();
    
    // Security columns
    table.integer('login_attempts').defaultTo(0);
    table.timestamp('locked_until').nullable();
    table.timestamp('last_login').nullable();
    table.timestamp('password_updated_at').nullable();
    
    // MFA columns
    table.boolean('mfa_enabled').defaultTo(false);
    table.enum('mfa_type', ['sms', 'app', 'email', 'hardware']).nullable();
    table.string('mfa_secret', 255).nullable();
    table.jsonb('mfa_backup_codes').nullable();
    
    // Password reset columns
    table.string('reset_token', 255).nullable();
    table.timestamp('reset_token_expires').nullable();
    
    // Password history for enforcing password policy (last 12 passwords)
    table.jsonb('password_history').nullable();
    
    // Relationship columns
    table.uuid('carrier_id').nullable();
    table.uuid('shipper_id').nullable();
    table.uuid('driver_id').nullable();
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint on external provider IDs
    table.unique(['auth_provider', 'auth_provider_id']);
    
    // Indexes for common query patterns
    table.index(['email']);
    table.index(['user_type', 'status']);
    table.index(['carrier_id']);
    table.index(['shipper_id']);
    table.index(['driver_id']);
  });
  
  // Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('role_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).unique().notNullable();
    table.string('description', 255).nullable();
    table.uuid('parent_role_id').nullable().references('role_id').inTable('roles').onDelete('SET NULL');
    table.boolean('is_system_role').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Index for hierarchy queries
    table.index(['parent_role_id']);
  });
  
  // Create permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('permission_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).unique().notNullable();
    table.string('description', 255).nullable();
    table.string('resource', 100).notNullable();
    table.string('action', 100).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Unique constraint on resource-action pair
    table.unique(['resource', 'action']);
    
    // Indexes
    table.index(['resource']);
    table.index(['action']);
  });
  
  // Create user_roles junction table
  await knex.schema.createTable('user_roles', (table) => {
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('role_id').inTable('roles').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Primary key on both columns
    table.primary(['user_id', 'role_id']);
    
    // Indexes
    table.index(['user_id']);
    table.index(['role_id']);
  });
  
  // Create role_permissions junction table
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('role_id').notNullable().references('role_id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('permission_id').inTable('permissions').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Primary key on both columns
    table.primary(['role_id', 'permission_id']);
    
    // Indexes
    table.index(['role_id']);
    table.index(['permission_id']);
  });
  
  // Create audit_logs table for security events
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('log_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').nullable().references('user_id').inTable('users').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 100).notNullable();
    table.string('resource_id', 255).nullable();
    table.jsonb('details').nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['action']);
    table.index(['resource_type', 'resource_id']);
    table.index(['created_at']);
  });
  
  // Create session_tokens table for tracking active sessions
  await knex.schema.createTable('session_tokens', (table) => {
    table.uuid('token_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('token', 512).unique().notNullable();
    table.string('refresh_token', 512).unique().nullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_used_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['token']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
    table.index(['is_revoked']);
  });
  
  // Create triggers for automatic timestamp updates
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
    
    CREATE TRIGGER update_roles_timestamp
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
    
    CREATE TRIGGER update_permissions_timestamp
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  `);
}

/**
 * Rollback function that removes the users table and related tables
 */
export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation
  await knex.schema.dropTableIfExists('session_tokens');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
  
  // Drop triggers and functions
  await knex.raw(`
    DROP TRIGGER IF EXISTS update_users_timestamp ON users;
    DROP TRIGGER IF EXISTS update_roles_timestamp ON roles;
    DROP TRIGGER IF EXISTS update_permissions_timestamp ON permissions;
    DROP FUNCTION IF EXISTS update_timestamp();
  `);
  
  // Note: We don't drop the uuid-ossp extension as it might be used by other parts of the system
}