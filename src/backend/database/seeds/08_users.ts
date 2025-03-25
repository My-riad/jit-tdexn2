/**
 * User Seed
 * 
 * Seeds the database with initial user accounts for different user types including
 * system administrators, carrier admins, carrier staff, drivers, shipper admins, and shipper staff.
 * Creates sample user records with appropriate roles and permissions for testing and development.
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { UserType, UserStatus, AuthProvider } from '../../common/interfaces/user.interface';

/**
 * Seeds the users table with initial user accounts for testing and development
 * @param knex - The Knex instance
 */
export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('user_roles').del();
  await knex('users').del();

  // Get role IDs from the database
  const roles = await knex('roles').select('role_id', 'name');
  const roleIds = roles.reduce((acc, role) => {
    acc[role.name] = role.role_id;
    return acc;
  }, {} as Record<string, string>);

  // Generate a hashed password for all sample users
  const standardPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(standardPassword, 10);

  // Get entity IDs for relationship linking
  const carriers = await knex('carriers').select('carrier_id');
  const drivers = await knex('drivers').select('driver_id');
  const shippers = await knex('shippers').select('shipper_id');

  const entityIds = {
    carriers: carriers.map(c => c.carrier_id),
    drivers: drivers.map(d => d.driver_id),
    shippers: shippers.map(s => s.shipper_id)
  };

  // Generate users
  const systemAdmins = generateUserData(UserType.SYSTEM_ADMIN, roleIds, hashedPassword, entityIds);
  const carrierAdmins = generateUserData(UserType.CARRIER_ADMIN, roleIds, hashedPassword, entityIds);
  const carrierStaff = generateUserData(UserType.CARRIER_STAFF, roleIds, hashedPassword, entityIds);
  const driverUsers = generateUserData(UserType.DRIVER, roleIds, hashedPassword, entityIds);
  const shipperAdmins = generateUserData(UserType.SHIPPER_ADMIN, roleIds, hashedPassword, entityIds);
  const shipperStaff = generateUserData(UserType.SHIPPER_STAFF, roleIds, hashedPassword, entityIds);

  // Combine all users
  const allUsers = [
    ...systemAdmins,
    ...carrierAdmins,
    ...carrierStaff,
    ...driverUsers,
    ...shipperAdmins,
    ...shipperStaff
  ];

  // Insert users
  await knex('users').insert(allUsers);

  // Generate and insert user role relationships
  const userRoleRelationships = generateUserRoleRelationships(allUsers, roleIds);
  await knex('user_roles').insert(userRoleRelationships);

  console.log(`Seeded ${allUsers.length} users with appropriate roles`);
}

/**
 * Generates user data based on the user type
 * @param userType - The type of user to generate
 * @param roleIds - Object containing role IDs by name
 * @param hashedPassword - Pre-hashed password to use for all users
 * @param entityIds - Object containing entity IDs for carriers, drivers, and shippers
 * @returns Array of user objects
 */
function generateUserData(
  userType: UserType, 
  roleIds: Record<string, string>, 
  hashedPassword: string,
  entityIds: { carriers: string[], drivers: string[], shippers: string[] }
): Array<object> {
  const users = [];
  let count = 0;
  let entities: string[] = [];

  // Determine number of users to create and which entities to link to
  switch (userType) {
    case UserType.SYSTEM_ADMIN:
      count = 2; // Create 2 system admins
      break;
    case UserType.CARRIER_ADMIN:
      count = Math.min(entityIds.carriers.length, 5); // One admin per carrier, max 5
      entities = entityIds.carriers.slice(0, count);
      break;
    case UserType.CARRIER_STAFF:
      count = Math.min(entityIds.carriers.length * 3, 15); // Three staff per carrier, max 15
      // Repeat carrier IDs to assign multiple staff to each carrier
      entities = entityIds.carriers.flatMap(id => Array(3).fill(id)).slice(0, count);
      break;
    case UserType.DRIVER:
      count = Math.min(entityIds.drivers.length, 20); // Create users for up to 20 drivers
      entities = entityIds.drivers.slice(0, count);
      break;
    case UserType.SHIPPER_ADMIN:
      count = Math.min(entityIds.shippers.length, 5); // One admin per shipper, max 5
      entities = entityIds.shippers.slice(0, count);
      break;
    case UserType.SHIPPER_STAFF:
      count = Math.min(entityIds.shippers.length * 2, 10); // Two staff per shipper, max 10
      entities = entityIds.shippers.flatMap(id => Array(2).fill(id)).slice(0, count);
      break;
  }

  // Generate users
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${userType.toLowerCase()}.freightopt.com`;
    
    const user: any = {
      user_id: uuidv4(),
      email,
      password_hash: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      phone: faker.phone.number(),
      user_type: userType,
      status: UserStatus.ACTIVE,
      email_verified: true, // For seed data, assume email is verified
      mfa_enabled: false,
      login_attempts: 0,
      auth_provider: AuthProvider.LOCAL,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Link to appropriate entity based on user type
    if (userType === UserType.CARRIER_ADMIN || userType === UserType.CARRIER_STAFF) {
      user.carrier_id = entities[i];
    } else if (userType === UserType.DRIVER) {
      user.driver_id = entities[i];
    } else if (userType === UserType.SHIPPER_ADMIN || userType === UserType.SHIPPER_STAFF) {
      user.shipper_id = entities[i];
    }

    users.push(user);
  }

  return users;
}

/**
 * Generates user-role relationships
 * @param users - Array of user objects
 * @param roleIds - Object containing role IDs by name
 * @returns Array of user-role relationship objects
 */
function generateUserRoleRelationships(
  users: any[],
  roleIds: Record<string, string>
): Array<object> {
  const relationships = [];

  for (const user of users) {
    let rolesToAssign: string[] = [];

    // Assign appropriate roles based on user type
    switch (user.user_type) {
      case UserType.SYSTEM_ADMIN:
        rolesToAssign = ['System Administrator'];
        break;
      case UserType.CARRIER_ADMIN:
        rolesToAssign = ['Fleet Manager'];
        break;
      case UserType.CARRIER_STAFF:
        rolesToAssign = ['Dispatcher'];
        break;
      case UserType.DRIVER:
        rolesToAssign = ['Driver'];
        break;
      case UserType.SHIPPER_ADMIN:
        rolesToAssign = ['Shipper Administrator'];
        break;
      case UserType.SHIPPER_STAFF:
        rolesToAssign = ['Shipping Coordinator'];
        break;
    }

    // Create relationships for all assigned roles
    for (const roleName of rolesToAssign) {
      if (roleIds[roleName]) {
        relationships.push({
          user_id: user.user_id,
          role_id: roleIds[roleName],
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
  }

  return relationships;
}

export default seed;