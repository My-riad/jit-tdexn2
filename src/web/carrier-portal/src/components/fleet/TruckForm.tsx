import React, { useState, useEffect } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6
import { useNavigate } from 'react-router-dom'; // react-router-dom ^6.8.0

import { Form, Input, Select, Button, useFormContext } from '../../../shared/components/forms/Form';
import { 
  Vehicle, 
  VehicleType, 
  VehicleStatus, 
  VehicleCreationParams, 
  VehicleUpdateParams,
  FuelType 
} from '../../../common/interfaces/vehicle.interface';
import { createVehicle, updateVehicle } from '../../services/fleetService';
import { theme } from '../../../shared/styles/theme';

/**
 * Props for the TruckForm component
 */
interface TruckFormProps {
  initialData?: Vehicle;
  carrierId: string;
  onSuccess?: (vehicle: Vehicle) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  className?: string;
}

/**
 * Container for the form with proper spacing
 */
const FormContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

/**
 * Section within the form for grouping related fields
 */
const FormSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borders.radius.md};
  background-color: ${theme.colors.background.paper};
`;

/**
 * Title for each form section
 */
const SectionTitle = styled.h3`
  margin-top: 0;
  margin-bottom: ${theme.spacing.md};
  font-size: ${theme.fonts.size.lg};
  font-weight: ${theme.fonts.weight.medium};
  color: ${theme.colors.text.primary};
`;

/**
 * Row for displaying form fields in a grid
 */
const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

/**
 * Container for form action buttons
 */
const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

/**
 * Container for form error messages
 */
const ErrorMessage = styled.div`
  color: ${theme.colors.semantic.error};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borders.radius.sm};
  background-color: ${theme.colors.semantic.error}10;
  border: 1px solid ${theme.colors.semantic.error};
`;

/**
 * Options for vehicle type select field
 */
const vehicleTypeOptions = [
  { value: 'TRACTOR', label: 'Tractor' },
  { value: 'STRAIGHT_TRUCK', label: 'Straight Truck' },
  { value: 'DRY_VAN_TRAILER', label: 'Dry Van Trailer' },
  { value: 'REFRIGERATED_TRAILER', label: 'Refrigerated Trailer' },
  { value: 'FLATBED_TRAILER', label: 'Flatbed Trailer' },
  { value: 'TANKER_TRAILER', label: 'Tanker Trailer' },
  { value: 'LOWBOY_TRAILER', label: 'Lowboy Trailer' },
  { value: 'STEP_DECK_TRAILER', label: 'Step Deck Trailer' },
  { value: 'SPECIALIZED', label: 'Specialized' },
];

/**
 * Options for vehicle status select field
 */
const vehicleStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In Use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

/**
 * Options for fuel type select field
 */
const fuelTypeOptions = [
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'NATURAL_GAS', label: 'Natural Gas' },
  { value: 'HYDROGEN', label: 'Hydrogen' },
];

/**
 * Initial values for the form when creating a new vehicle
 */
const initialFormValues: Record<string, any> = {
  type: '',
  make: '',
  model: '',
  year: '',
  vin: '',
  plate_number: '',
  plate_state: '',
  status: 'ACTIVE',
  weight_capacity: '',
  volume_capacity: '',
  dimensions: {
    length: '',
    width: '',
    height: '',
  },
  fuel_type: 'DIESEL',
  fuel_capacity: '',
  average_mpg: '',
  odometer: '',
  eld_device_id: '',
};

/**
 * Validation schema for form fields
 */
const validationSchema: Record<string, (value: any) => boolean | string> = {
  type: (value: any) => value ? true : 'Type is required',
  make: (value: any) => value ? true : 'Make is required',
  model: (value: any) => value ? true : 'Model is required',
  year: (value: any) => value ? true : 'Year is required',
  vin: (value: any) => value ? true : 'VIN is required',
  plate_number: (value: any) => value ? true : 'Plate Number is required',
  plate_state: (value: any) => value ? true : 'Plate State is required',
  weight_capacity: (value: any) => value ? true : 'Weight Capacity is required',
  volume_capacity: (value: any) => value ? true : 'Volume Capacity is required',
  'dimensions.length': (value: any) => value ? true : 'Length is required',
  'dimensions.width': (value: any) => value ? true : 'Width is required',
  'dimensions.height': (value: any) => value ? true : 'Height is required',
  fuel_type: (value: any) => value ? true : 'Fuel Type is required',
  fuel_capacity: (value: any) => value ? true : 'Fuel Capacity is required',
  average_mpg: (value: any) => value ? true : 'Average MPG is required',
  odometer: (value: any) => value ? true : 'Odometer is required',
};

/**
 * Component for creating or editing truck/vehicle information
 */
const TruckForm: React.FC<TruckFormProps> = ({ 
  initialData, 
  carrierId, 
  onSuccess, 
  onCancel, 
  isEdit = false,
  className 
}) => {
  // Set up state for form submission status (isSubmitting, error)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize navigate function for redirection after submission
  const navigate = useNavigate();

  // Define form submission handler
  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    setError(null);

    // Prepare vehicle data from form values
    const vehicleData = formatVehicleDataForSubmission(values, carrierId, isEdit);

    try {
      let vehicle: Vehicle;
      if (isEdit && initialData) {
        // Call updateVehicle service function
        vehicle = await updateVehicle(initialData.vehicle_id, vehicleData as VehicleUpdateParams);
      } else {
        // Call createVehicle service function
        vehicle = await createVehicle(vehicleData as VehicleCreationParams);
      }

      // Handle success by calling onSuccess callback and/or redirecting
      if (onSuccess) {
        onSuccess(vehicle);
      } else {
        // Redirect to fleet list or details page
        navigate(`/carrier/fleet`);
      }
    } catch (err: any) {
      // Handle errors by setting error state
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Form component with validation schema and submission handler
  return (
    <FormContainer className={className}>
      <Form
        initialValues={initialData || initialFormValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {/* Render form sections: Basic Information, Vehicle Specifications, Registration Information, Maintenance Information */}
        <FormSection>
          <SectionTitle>Basic Information</SectionTitle>
          <FormRow>
            <Select
              name="type"
              label="Vehicle Type"
              options={vehicleTypeOptions}
              required
            />
            <Input name="make" label="Make" required />
            <Input name="model" label="Model" required />
            <Input name="year" label="Year" type="number" required />
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>Vehicle Specifications</SectionTitle>
          <FormRow>
            <Input name="weight_capacity" label="Weight Capacity (lbs)" type="number" />
            <Input name="volume_capacity" label="Volume Capacity (cu ft)" type="number" />
          </FormRow>
          <FormRow>
            <Input name="dimensions.length" label="Length (ft)" type="number" />
            <Input name="dimensions.width" label="Width (ft)" type="number" />
            <Input name="dimensions.height" label="Height (ft)" type="number" />
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>Registration Information</SectionTitle>
          <FormRow>
            <Input name="vin" label="VIN" required />
            <Input name="plate_number" label="Plate Number" required />
            <Select name="plate_state" label="Plate State" options={[]} required />
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>Fuel and ELD Information</SectionTitle>
          <FormRow>
            <Select name="fuel_type" label="Fuel Type" options={fuelTypeOptions} />
            <Input name="fuel_capacity" label="Fuel Capacity (gal)" type="number" />
            <Input name="average_mpg" label="Average MPG" type="number" />
          </FormRow>
          <FormRow>
            <Input name="odometer" label="Odometer" type="number" />
             <Input name="eld_device_id" label="ELD Device ID" />
          </FormRow>
        </FormSection>

        {/* Render form action buttons (Submit, Cancel) */}
        <FormActions>
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </FormActions>
      </Form>
    </FormContainer>
  );
};

/**
 * Helper function to validate vehicle form data
 */
const validateVehicleData = (values: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!values.type) {
    errors.type = 'Vehicle Type is required';
  }

  if (!values.make) {
    errors.make = 'Make is required';
  }

  if (!values.model) {
    errors.model = 'Model is required';
  }

  if (!values.year) {
    errors.year = 'Year is required';
  }

  if (!values.vin) {
    errors.vin = 'VIN is required';
  }

  if (!values.plate_number) {
    errors.plate_number = 'Plate Number is required';
  }

  if (!values.plate_state) {
    errors.plate_state = 'Plate State is required';
  }

  if (!values.weight_capacity) {
    errors.weight_capacity = 'Weight Capacity is required';
  }

  if (!values.volume_capacity) {
    errors.volume_capacity = 'Volume Capacity is required';
  }

  if (!values.fuel_type) {
    errors.fuel_type = 'Fuel Type is required';
  }

  if (!values.fuel_capacity) {
    errors.fuel_capacity = 'Fuel Capacity is required';
  }

  if (!values.average_mpg) {
    errors.average_mpg = 'Average MPG is required';
  }

  if (!values.odometer) {
    errors.odometer = 'Odometer is required';
  }

  if (!values.dimensions || typeof values.dimensions !== 'object') {
    errors.dimensions = 'Dimensions are required';
  } else {
    if (!values.dimensions.length) {
      errors['dimensions.length'] = 'Length is required';
    }
    if (!values.dimensions.width) {
      errors['dimensions.width'] = 'Width is required';
    }
    if (!values.dimensions.height) {
      errors['dimensions.height'] = 'Height is required';
    }
  }

  // Add more specific validation logic here if needed

  return errors;
};

/**
 * Helper function to format form data for API submission
 */
const formatVehicleDataForSubmission = (
  formValues: Record<string, any>,
  carrierId: string,
  isEdit: boolean
): VehicleCreationParams | VehicleUpdateParams => {
  // Initialize vehicle data object
  const vehicleData: any = {
    ...formValues,
  };

  // Add carrierId if creating a new vehicle
  if (!isEdit) {
    vehicleData.carrier_id = carrierId;
  }

  // Format dimensions object
  vehicleData.dimensions = {
    length: parseFloat(formValues.dimensions.length),
    width: parseFloat(formValues.dimensions.width),
    height: parseFloat(formValues.dimensions.height),
  };

  // Convert string values to appropriate types (numbers, enums)
  vehicleData.year = parseInt(formValues.year, 10);
  vehicleData.weight_capacity = parseFloat(formValues.weight_capacity);
  vehicleData.volume_capacity = parseFloat(formValues.volume_capacity);
  vehicleData.fuel_capacity = parseFloat(formValues.fuel_capacity);
  vehicleData.average_mpg = parseFloat(formValues.average_mpg);
  vehicleData.odometer = parseFloat(formValues.odometer);
  vehicleData.type = formValues.type as VehicleType;
  vehicleData.status = formValues.status as VehicleStatus;
  vehicleData.fuel_type = formValues.fuel_type as FuelType;

  return vehicleData;
};

export default TruckForm;
export type { TruckFormProps };