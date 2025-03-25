import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'; // axios@1.3.4
import logger from '../../../common/utils/logger';
import { getEldProviderConfig } from '../config';
import { DriverHOS, HOSStatus } from '../../../common/interfaces/driver.interface';

/**
 * Abstract base class for ELD provider integrations
 */
export abstract class EldProvider {
  protected readonly providerName: string;
  protected readonly client: AxiosInstance;

  /**
   * Creates a new ELD provider instance
   * @param providerName The name of the ELD provider
   */
  constructor(providerName: string) {
    this.providerName = providerName;
    
    // Get the provider-specific configuration
    const config = getEldProviderConfig(providerName);
    
    // Create an axios instance with the provider's base URL and authentication headers
    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Secret': config.apiSecret
      }
    };
    
    this.client = axios.create(axiosConfig);
    
    logger.debug(`Created ELD provider instance for ${providerName}`, { 
      provider: providerName,
      baseUrl: config.baseUrl
    });
  }

  /**
   * Abstract method to get driver HOS data from the ELD provider
   * @param driverId The ID of the driver
   * @param eldDeviceId The ID of the driver's ELD device
   * @returns Promise resolving to the driver's HOS data
   */
  abstract getDriverHOS(driverId: string, eldDeviceId: string): Promise<DriverHOS>;

  /**
   * Maps provider-specific status codes to standardized HOSStatus enum values
   * @param providerStatus The provider-specific status code
   * @returns Standardized HOS status
   */
  protected mapStatusToHOSStatus(providerStatus: string): HOSStatus {
    const status = providerStatus.toUpperCase();
    
    if (status.includes('DRIVE') || status.includes('DRIVING')) {
      return HOSStatus.DRIVING;
    } else if (status.includes('ON_DUTY') || status.includes('ONDUTY') || status.includes('ON DUTY')) {
      return HOSStatus.ON_DUTY;
    } else if (status.includes('SLEEP') || status.includes('BERTH') || status.includes('SLEEPER')) {
      return HOSStatus.SLEEPER_BERTH;
    } else if (status.includes('OFF_DUTY') || status.includes('OFFDUTY') || status.includes('OFF DUTY')) {
      return HOSStatus.OFF_DUTY;
    }
    
    // Default to OFF_DUTY if we can't determine the status
    logger.debug(`Unknown ELD status code: ${providerStatus}, defaulting to OFF_DUTY`, {
      provider: this.providerName,
      originalStatus: providerStatus
    });
    
    return HOSStatus.OFF_DUTY;
  }

  /**
   * Handles API errors from the ELD provider
   * @param error The error that occurred
   */
  protected handleApiError(error: Error): never {
    // Check if the error has a response property (typical of Axios errors)
    const errorDetails = (error as any).response 
      ? {
          status: (error as any).response.status,
          data: (error as any).response.data
        } 
      : { message: error.message };
    
    logger.error(`Error communicating with ${this.providerName} ELD provider: ${error.message}`, { 
      provider: this.providerName,
      error: errorDetails 
    });
    
    throw new Error(`ELD provider error (${this.providerName}): ${error.message}`);
  }
}

/**
 * Implementation of ELD provider for KeepTruckin ELD devices
 */
export class KeepTruckinProvider extends EldProvider {
  /**
   * Creates a new KeepTruckin provider instance
   */
  constructor() {
    super('keeptruckin');
  }

  /**
   * Get driver HOS data from the KeepTruckin API
   * @param driverId The ID of the driver
   * @param eldDeviceId The ID of the driver's ELD device
   * @returns Promise resolving to the driver's HOS data
   */
  async getDriverHOS(driverId: string, eldDeviceId: string): Promise<DriverHOS> {
    try {
      logger.info(`Requesting HOS data for driver ${driverId} from KeepTruckin ELD`, { 
        driverId, 
        eldDeviceId 
      });
      
      const response = await this.client.get(`/drivers/${eldDeviceId}/hos`);
      const hosData = response.data;
      
      // Map the response to our standardized DriverHOS interface
      const driverHOS: DriverHOS = {
        driver_id: driverId,
        status: this.mapStatusToHOSStatus(hosData.status),
        driving_minutes_remaining: hosData.driving_minutes_available,
        duty_minutes_remaining: hosData.on_duty_minutes_available,
        cycle_minutes_remaining: hosData.cycle_minutes_available,
        status_since: new Date(hosData.status_since),
        recorded_at: new Date()
      };
      
      logger.debug(`Successfully retrieved HOS data for driver ${driverId} from KeepTruckin`, {
        driverId,
        status: driverHOS.status,
        drivingMinutesRemaining: driverHOS.driving_minutes_remaining
      });
      
      return driverHOS;
    } catch (err) {
      return this.handleApiError(err);
    }
  }
}

/**
 * Implementation of ELD provider for Omnitracs ELD devices
 */
export class OmnitracsProvider extends EldProvider {
  /**
   * Creates a new Omnitracs provider instance
   */
  constructor() {
    super('omnitracs');
  }

  /**
   * Get driver HOS data from the Omnitracs API
   * @param driverId The ID of the driver
   * @param eldDeviceId The ID of the driver's ELD device
   * @returns Promise resolving to the driver's HOS data
   */
  async getDriverHOS(driverId: string, eldDeviceId: string): Promise<DriverHOS> {
    try {
      logger.info(`Requesting HOS data for driver ${driverId} from Omnitracs ELD`, { 
        driverId, 
        eldDeviceId 
      });
      
      const response = await this.client.get(`/drivers/${eldDeviceId}/hours_of_service`);
      const hosData = response.data;
      
      // Map the response to our standardized DriverHOS interface
      const driverHOS: DriverHOS = {
        driver_id: driverId,
        status: this.mapStatusToHOSStatus(hosData.current_status),
        driving_minutes_remaining: hosData.available_drive_time,
        duty_minutes_remaining: hosData.available_duty_time,
        cycle_minutes_remaining: hosData.available_cycle_time,
        status_since: new Date(hosData.current_status_since),
        recorded_at: new Date()
      };
      
      logger.debug(`Successfully retrieved HOS data for driver ${driverId} from Omnitracs`, {
        driverId,
        status: driverHOS.status,
        drivingMinutesRemaining: driverHOS.driving_minutes_remaining
      });
      
      return driverHOS;
    } catch (err) {
      return this.handleApiError(err);
    }
  }
}

/**
 * Implementation of ELD provider for Samsara ELD devices
 */
export class SamsaraProvider extends EldProvider {
  /**
   * Creates a new Samsara provider instance
   */
  constructor() {
    super('samsara');
  }

  /**
   * Get driver HOS data from the Samsara API
   * @param driverId The ID of the driver
   * @param eldDeviceId The ID of the driver's ELD device
   * @returns Promise resolving to the driver's HOS data
   */
  async getDriverHOS(driverId: string, eldDeviceId: string): Promise<DriverHOS> {
    try {
      logger.info(`Requesting HOS data for driver ${driverId} from Samsara ELD`, { 
        driverId, 
        eldDeviceId 
      });
      
      const response = await this.client.get(`/fleet/drivers/${eldDeviceId}/hos_daily_logs`);
      const hosData = response.data.dailyLogEntries[0]; // Get most recent log
      
      // Map the response to our standardized DriverHOS interface
      const driverHOS: DriverHOS = {
        driver_id: driverId,
        status: this.mapStatusToHOSStatus(hosData.activeHosStatus),
        driving_minutes_remaining: hosData.drivingMinutesRemaining,
        duty_minutes_remaining: hosData.onDutyMinutesRemaining,
        cycle_minutes_remaining: hosData.cycleMinutesRemaining,
        status_since: new Date(hosData.statusStartTime),
        recorded_at: new Date()
      };
      
      logger.debug(`Successfully retrieved HOS data for driver ${driverId} from Samsara`, {
        driverId,
        status: driverHOS.status,
        drivingMinutesRemaining: driverHOS.driving_minutes_remaining
      });
      
      return driverHOS;
    } catch (err) {
      return this.handleApiError(err);
    }
  }
}

/**
 * Factory class for creating ELD provider instances based on provider name
 */
export class EldProviderFactory {
  /**
   * Get an ELD provider instance for the specified provider name
   * @param providerName The name of the ELD provider
   * @returns An instance of the appropriate ELD provider
   */
  static getProvider(providerName: string): EldProvider {
    const provider = providerName.toLowerCase();
    
    switch (provider) {
      case 'keeptruckin':
        return new KeepTruckinProvider();
      case 'omnitracs':
        return new OmnitracsProvider();
      case 'samsara':
        return new SamsaraProvider();
      default:
        throw new Error(`Unsupported ELD provider: ${providerName}. Supported providers are: keeptruckin, omnitracs, samsara`);
    }
  }
}