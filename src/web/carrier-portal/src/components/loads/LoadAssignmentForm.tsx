import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { Form, Select, Button, Alert, LoadingIndicator } from '../../../../shared/components';
import { Load, LoadAssignment, LoadAssignmentType } from '../../../../common/interfaces/load.interface';
import { Driver, DriverStatus } from '../../../../common/interfaces/driver.interface';
import { getAllDrivers, validateDriverForLoad } from '../../../services/driverService';
import { assignLoadToDriver } from '../../../services/loadService';
import { useForm } from '../../../../common/hooks/useForm';

/**
 * Interface for the LoadAssignmentForm component props
 */
interface LoadAssignmentFormProps {
  load: Load;
  onAssignmentComplete: (assignment: LoadAssignment) => void;
  onCancel: () => void;
}

/**
 * A form component that allows dispatchers to assign loads to drivers
 */
const LoadAssignmentForm: React.FC<LoadAssignmentFormProps> = ({ load, onAssignmentComplete, onCancel }) => {
  // Define state variables for drivers, loading, submitting, error, and validationError
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch available drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  /**
   * Fetches available drivers from the backend
   */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      // Call getAllDrivers service function with appropriate filters
      const { drivers: fetchedDrivers } = await getAllDrivers({
        status: [DriverStatus.AVAILABLE, DriverStatus.ON_DUTY],
      });

      // Filter drivers to only include those with AVAILABLE or ON_DUTY status
      const availableDrivers = fetchedDrivers.filter(
        (driver) => driver.status === DriverStatus.AVAILABLE || driver.status === DriverStatus.ON_DUTY
      );

      // Set the drivers state with the filtered results
      setDrivers(availableDrivers);
    } catch (err: any) {
      // Handle any errors and set error state
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      // Set loading state to false
      setLoading(false);
    }
  }, []);

  /**
   * Validates if the selected driver is eligible for the load
   * @param driverId 
   * @returns 
   */
  const validateDriver = useCallback(async (driverId: string) => {
    // If no driver ID is provided, return { eligible: false }
    if (!driverId) {
      return { eligible: false };
    }

    try {
      // Call validateDriverForLoad service function with driver ID and load details
      const validationResult = await validateDriverForLoad(driverId, load);
      return validationResult;
    } catch (err: any) {
      // Handle any errors and set error state
      setError(err.message || 'Failed to validate driver');
      return { eligible: false };
    }
  }, [load]);

  /**
   * Handles the form submission to assign the load
   * @param formValues 
   */
  const handleSubmit = useCallback(async (formValues: any) => {
    setSubmitting(true);
    setValidationError(null);

    // Validate the selected driver for the load
    const validationResult = await validateDriver(formValues.driverId);

    // If driver is not eligible, set validation error and return
    if (!validationResult.eligible) {
      setValidationError(validationResult.reasons ? validationResult.reasons.join(', ') : 'Driver is not eligible for this load');
      setSubmitting(false);
      return;
    }

    try {
      // Call assignLoadToDriver service function with load ID, driver ID, and assignment type
      const assignmentResult = await assignLoadToDriver(
        load.id,
        formValues.driverId,
        'vehicle-123', // TODO: Replace with actual vehicle ID selection
        { assignmentType: formValues.assignmentType }
      );

      // If successful, call onAssignmentComplete callback with the assignment result
      if (assignmentResult.success) {
        onAssignmentComplete(assignmentResult.assignment as LoadAssignment);
      } else {
        setError('Failed to assign load');
      }
    } catch (err: any) {
      // Handle any errors and set error state
      setError(err.message || 'Failed to assign load');
    } finally {
      // Set submitting state to false
      setSubmitting(false);
    }
  }, [load, onAssignmentComplete, validateDriver]);

  // Define initial form values
  const initialValues = {
    driverId: '',
    assignmentType: 'direct',
  };

  // Define validation schema (currently empty)
  const validationSchema = {};

  // Use the useForm hook to manage form state and submission
  const { values, errors, handleChange, handleSubmit: handleFormSubmit, isValid } = useForm({
    initialValues,
    validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <Form initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleFormSubmit}>
      {loading && <LoadingIndicator label="Loading Drivers..." />}
      {error && <Alert severity="error" message={error} />}
      {validationError && <Alert severity="warning" message={validationError} />}

      <Select
        name="driverId"
        label="Select Driver"
        options={drivers.map((driver) => ({
          value: driver.id,
          label: `${driver.firstName} ${driver.lastName}`,
        }))}
        value={values.driverId}
        onChange={handleChange}
        required
      />

      <Select
        name="assignmentType"
        label="Assignment Type"
        options={[
          { value: 'direct', label: 'Direct' },
          { value: 'relay', label: 'Relay' },
        ]}
        value={values.assignmentType}
        onChange={handleChange}
        required
      />

      <Button type="submit" disabled={!isValid || submitting}>
        {submitting ? 'Assigning...' : 'Assign Load'}
      </Button>
      <Button variant="secondary" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
    </Form>
  );
};

export default LoadAssignmentForm;