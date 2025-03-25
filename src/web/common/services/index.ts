/**
 * Index file that exports all common services used across the AI-driven Freight Optimization Platform web applications.
 * This file serves as a central entry point for importing services, simplifying imports in other parts of the application
 * by providing a single import source for all service functionality.
 */

import * as analyticsService from './analyticsService';
import * as authService from './authService';
import * as errorService from './errorService';
import * as locationService from './locationService';
import notificationService from './notificationService';
import { StorageType, StorageService, storageService } from './storageService';

export {
  analyticsService,
  authService,
  errorService,
  locationService,
  notificationService,
  StorageType,
  StorageService,
  storageService,
};