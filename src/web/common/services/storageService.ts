/**
 * A service that provides a unified interface for client-side storage operations,
 * abstracting the underlying storage mechanisms (localStorage and sessionStorage)
 * and providing consistent error handling, type safety, and serialization/deserialization
 * of complex data types.
 */

import * as localStorage from '../utils/localStorage';
import * as sessionStorage from '../utils/sessionStorage';
import logger from '../utils/logger';

/**
 * Enum to specify which storage mechanism to use
 */
export enum StorageType {
  LOCAL = 'local',
  SESSION = 'session'
}

/**
 * A service class that provides a unified interface for client-side storage operations,
 * with namespacing to prevent key collisions between different parts of the application.
 */
export class StorageService {
  private storageType: StorageType;
  private namespace: string;
  private storage: typeof localStorage | typeof sessionStorage;

  /**
   * Creates a new StorageService instance with the specified storage type and namespace
   * @param type The storage type to use (localStorage or sessionStorage)
   * @param namespace Namespace prefix for all keys to prevent collisions
   */
  constructor(type: StorageType = StorageType.LOCAL, namespace: string = '') {
    this.storageType = type;
    this.namespace = namespace;
    
    // Determine which storage to use based on the specified type
    this.storage = this.storageType === StorageType.LOCAL ? localStorage : sessionStorage;
    
    // Log a warning if the selected storage is not available
    if (!this.isAvailable()) {
      logger.warn(`${this.storageType} storage is not available in this environment. Storage operations will fail.`, {
        component: 'StorageService',
        storageType: this.storageType
      });
    }
  }

  /**
   * Stores a value in the selected storage with namespace prefixing
   * @param key The key to store the value under
   * @param value The value to store
   * @returns True if the operation was successful, false otherwise
   */
  public setItem(key: string, value: any): boolean {
    const namespacedKey = this.getNamespacedKey(key);
    return this.storage.setItem(namespacedKey, value);
  }

  /**
   * Retrieves a value from the selected storage with namespace prefixing
   * @param key The key to retrieve the value for
   * @param defaultValue The default value to return if the key doesn't exist
   * @returns The retrieved value or defaultValue if not found
   */
  public getItem<T>(key: string, defaultValue?: T): T | null | undefined {
    const namespacedKey = this.getNamespacedKey(key);
    return this.storage.getItem<T>(namespacedKey, defaultValue as T);
  }

  /**
   * Removes an item from the selected storage with namespace prefixing
   * @param key The key to remove
   * @returns True if the operation was successful, false otherwise
   */
  public removeItem(key: string): boolean {
    const namespacedKey = this.getNamespacedKey(key);
    return this.storage.removeItem(namespacedKey);
  }

  /**
   * Clears all items with the current namespace from the selected storage
   * @returns True if the operation was successful, false otherwise
   */
  public clear(): boolean {
    try {
      // Check if storage is available
      if (!this.isAvailable()) {
        logger.error('Storage is not available for clear operation', {
          component: 'StorageService',
          storageType: this.storageType
        });
        return false;
      }

      // Get all keys from storage
      const allKeys = this.storage.getKeys();
      
      // Filter keys with the current namespace
      const namespacedKeys = allKeys.filter(key => 
        this.namespace ? key.startsWith(`${this.namespace}:`) : true
      );
      
      // Remove each namespaced key
      let success = true;
      for (const key of namespacedKeys) {
        if (!this.storage.removeItem(key)) {
          success = false;
        }
      }
      
      return success;
    } catch (error) {
      logger.error('Error clearing namespaced items from storage', {
        component: 'StorageService',
        namespace: this.namespace,
        storageType: this.storageType,
        error
      });
      return false;
    }
  }

  /**
   * Clears all items from the selected storage regardless of namespace
   * @returns True if the operation was successful, false otherwise
   */
  public clearAll(): boolean {
    return this.storage.clear();
  }

  /**
   * Gets all keys with the current namespace from the selected storage
   * @returns Array of keys (with namespace prefix removed)
   */
  public getKeys(): string[] {
    try {
      // Check if storage is available
      if (!this.isAvailable()) {
        logger.error('Storage is not available for getKeys operation', {
          component: 'StorageService',
          storageType: this.storageType
        });
        return [];
      }

      // Get all keys from storage
      const allKeys = this.storage.getKeys();
      
      // Filter and transform keys with the current namespace
      return allKeys
        .filter(key => this.namespace ? key.startsWith(`${this.namespace}:`) : true)
        .map(key => this.removeNamespacePrefix(key));
    } catch (error) {
      logger.error('Error getting keys from storage', {
        component: 'StorageService',
        namespace: this.namespace,
        storageType: this.storageType,
        error
      });
      return [];
    }
  }

  /**
   * Checks if the selected storage is available in the current environment
   * @returns True if the storage is available, false otherwise
   */
  public isAvailable(): boolean {
    return this.storage.isAvailable();
  }

  /**
   * Creates a namespaced key by combining the namespace and the provided key
   * @param key The original key
   * @returns The namespaced key
   */
  private getNamespacedKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  /**
   * Removes the namespace prefix from a key
   * @param namespacedKey The namespaced key
   * @returns The key without the namespace prefix
   */
  private removeNamespacePrefix(namespacedKey: string): string {
    if (this.namespace && namespacedKey.startsWith(`${this.namespace}:`)) {
      return namespacedKey.substring(this.namespace.length + 1); // +1 for the colon
    }
    return namespacedKey;
  }
}

/**
 * Default instance of StorageService using localStorage with 'app' namespace
 * for common storage needs across the application
 */
export const storageService = new StorageService(StorageType.LOCAL, 'app');