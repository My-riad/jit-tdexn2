# src/web/shipper-portal/src/components/loads/LoadForm.tsx
```typescript
import React, { useState, useEffect, useMemo } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import Form, { useFormContext } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import DatePicker from '../../../shared/components/forms/DatePicker';
import TimePicker from '../../../shared/components/forms/TimePicker';
import Checkbox from '../../../shared/components/forms/Checkbox';
import TextArea from '../../../shared/components/forms/TextArea';
import Button from '../../../shared/components/buttons/Button';
import Card from '../../../shared/components/cards/Card';
import Tabs from '../../../shared/components/navigation/Tabs';
import { LoadCreationParams, LoadUpdateParams, EquipmentType } from '../../../common/interfaces/load.interface';
import { createLoad, updateLoad } from '../../../common/api/loadApi';
import { validateRequired, validateNumber, validateEmail, validatePhone } from '../../../common/utils/validators';
import useNotification from '../../../common/hooks/useNotification';
import { theme } from '../../../shared/styles/theme';

/**
 * Interface for LoadForm component props
 */
interface LoadFormProps {
  initialValues: Partial<LoadCreationParams>;
  onSubmit: (values: LoadCreationParams) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
  isLoading: boolean;
}

/**
 * Main component for creating and editing loads in the shipper portal
 */
const LoadForm: React.FC<LoadFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isEditing,
  isLoading,
}) => {
  // Set up state for the current form step
  const [activeStep, setActiveStep] = useState<string>('basic');

  // Set up state for form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Initialize the notification hook
  const { showNotification } = useNotification();

  // Create validation schema for each form section
  const basicInfoValidationSchema = useMemo(() => ({
    referenceNumber: validateRequired,
    equipmentType: validateRequired,
  }), []);

  const dimensionsValidationSchema = useMemo(() => ({
    weight: validateNumber,
    length: validateNumber,
    width: validateNumber,
    height: validateNumber,
    volume: validateNumber,
    pallets: validateNumber,
  }), []);

  const pickupDeliveryValidationSchema = useMemo(() => ({
    pickupFacilityName: validateRequired,
    pickupAddress: validateRequired,
    pickupCity: validateRequired,
    pickupState: validateRequired,
    pickupZip: validateRequired,
    pickupContactName: validateRequired,
    pickupContactPhone: validatePhone,
    pickupContactEmail: validateEmail,
    deliveryFacilityName: validateRequired,
    deliveryAddress: validateRequired,
    deliveryCity: validateRequired,
    deliveryState: validateRequired,
    deliveryZip: validateRequired,
    deliveryContactName: validateRequired,
    deliveryContactPhone: validatePhone,
    deliveryContactEmail: validateEmail,
  }), []);

  const schedulingValidationSchema = useMemo(() => ({
    pickupDate: validateRequired,
    pickupTimeEarliest: validateRequired,
    pickupTimeLatest: validateRequired,
    deliveryDate: validateRequired,
    deliveryTimeEarliest: validateRequired,
    deliveryTimeLatest: validateRequired,
  }), []);

  const specialRequirementsValidationSchema = useMemo(() => ({
    offeredRate: validateNumber,
  }), []);

  // Define the form steps
  const formSteps = useMemo(() => [
    { id: 'basic', label: 'Basic Info', content: renderBasicInfoStep },
    { id: 'dimensions', label: 'Dimensions', content: renderDimensionsStep },
    { id: 'pickupDelivery', label: 'Pickup/Delivery', content: renderPickupDeliveryStep },
    { id: 'scheduling', label: 'Scheduling', content: renderSchedulingStep },
    { id: 'specialRequirements', label: 'Special Requirements', content: renderSpecialRequirementsStep },
  ], []);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      const formData = prepareFormData(values);
      if (isEditing) {
        // await updateLoad(formData);
        showNotification({ type: 'success', message: 'Load updated successfully!' });
      } else {
        await createLoad(formData);
        showNotification({ type: 'success', message: 'Load created successfully!' });
      }
      onSubmit(formData);
    } catch (error: any) {
      showNotification({ type: 'error', message: error.message || 'Failed to save load. Please try again.' });
    }
  };

  // Handle step navigation
  const handleStepChange = (stepId: string) => {
    setActiveStep(stepId);
  };

  // Render the form container with tabs for multi-step navigation
  return (
    <Form
      initialValues={initialValues}
      validationSchema={{
        ...basicInfoValidationSchema,
        ...dimensionsValidationSchema,
        ...pickupDeliveryValidationSchema,
        ...schedulingValidationSchema,
        ...specialRequirementsValidationSchema,
      }}
      onSubmit={handleSubmit}
    >
      <Tabs
        tabs={formSteps}
        activeTabId={activeStep}
        onChange={handleStepChange}
      />
      <Button type="button" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Load'}
      </Button>
    </Form>
  );

  // Render the first step of the form with basic load information fields
  function renderBasicInfoStep({ values, errors, handleChange, handleBlur }) {
    return (
      <Card>
        <Input
          name="referenceNumber"
          label="Reference Number"
          value={values.referenceNumber || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.referenceNumber}
          required
        />
        <TextArea
          name="description"
          label="Description"
          value={values.description || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.description}
        />
        <Select
          name="equipmentType"
          label="Equipment Type"
          options={Object.values(EquipmentType).map(type => ({ value: type, label: type }))}
          value={values.equipmentType || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.equipmentType}
          required
        />
        <Input
          name="commodity"
          label="Commodity"
          value={values.commodity || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.commodity}
        />
      </Card>
    );
  }

  // Render the second step of the form with load dimension and weight fields
  function renderDimensionsStep({ values, errors, handleChange, handleBlur }) {
    return (
      <Card>
        <Input
          name="weight"
          label="Weight (lbs)"
          type="number"
          value={values.weight || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.weight}
        />
        <Input
          name="length"
          label="Length (ft)"
          type="number"
          value={values.length || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.length}
        />
        <Input
          name="width"
          label="Width (ft)"
          type="number"
          value={values.width || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.width}
        />
        <Input
          name="height"
          label="Height (ft)"
          type="number"
          value={values.height || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.height}
        />
        <Input
          name="volume"
          label="Volume (cu ft)"
          type="number"
          value={values.volume || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.volume}
        />
        <Input
          name="pallets"
          label="Pallets"
          type="number"
          value={values.pallets || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pallets}
        />
      </Card>
    );
  }

  // Render the third step of the form with pickup and delivery location details
  function renderPickupDeliveryStep({ values, errors, handleChange, handleBlur, setFieldValue }) {
    return (
      <Card>
        <h3>Pickup Location</h3>
        <Input
          name="pickupFacilityName"
          label="Facility Name"
          value={values.pickupFacilityName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupFacilityName}
          required
        />
        <Input
          name="pickupAddress"
          label="Address"
          value={values.pickupAddress || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupAddress}
          required
        />
        <Input
          name="pickupCity"
          label="City"
          value={values.pickupCity || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupCity}
          required
        />
        <Input
          name="pickupState"
          label="State"
          value={values.pickupState || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupState}
          required
        />
        <Input
          name="pickupZip"
          label="Zip Code"
          value={values.pickupZip || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupZip}
          required
        />
        <Input
          name="pickupContactName"
          label="Contact Name"
          value={values.pickupContactName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupContactName}
          required
        />
        <Input
          name="pickupContactPhone"
          label="Phone"
          type="tel"
          value={values.pickupContactPhone || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupContactPhone}
        />
        <Input
          name="pickupContactEmail"
          label="Email"
          type="email"
          value={values.pickupContactEmail || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pickupContactEmail}
        />

        <h3>Delivery Location</h3>
        <Input
          name="deliveryFacilityName"
          label="Facility Name"
          value={values.deliveryFacilityName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryFacilityName}
          required
        />
        <Input
          name="deliveryAddress"
          label="Address"
          value={values.deliveryAddress || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryAddress}
          required
        />
        <Input
          name="deliveryCity"
          label="City"
          value={values.deliveryCity || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryCity}
          required
        />
        <Input
          name="deliveryState"
          label="State"
          value={values.deliveryState || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryState}
          required
        />
        <Input
          name="deliveryZip"
          label="Zip Code"
          value={values.deliveryZip || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryZip}
          required
        />
        <Input
          name="deliveryContactName"
          label="Contact Name"
          value={values.deliveryContactName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryContactName}
          required
        />
        <Input
          name="deliveryContactPhone"
          label="Phone"
          type="tel"
          value={values.deliveryContactPhone || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryContactPhone}
        />
        <Input
          name="deliveryContactEmail"
          label="Email"
          type="email"
          value={values.deliveryContactEmail || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.deliveryContactEmail}
        />
      </Card>
    );
  }

  // Render the fourth step of the form with pickup and delivery scheduling
  function renderSchedulingStep({ values, errors, handleChange, handleBlur, setFieldValue }) {
    return (
      <Card>
        <h3>Pickup Scheduling</h3>
        <DatePicker
          name="pickupDate"
          label="Date"
          value={values.pickupDate || null}
          onChange={(date) => setFieldValue('pickupDate', date)}
          onBlur={handleBlur}
          error={errors.pickupDate}
          required
        />
        <TimePicker
          name="pickupTimeEarliest"
          label="Earliest Time"
          value={values.pickupTimeEarliest || null}
          onChange={(time) => setFieldValue('pickupTimeEarliest', time)}
          onBlur={handleBlur}
          error={errors.pickupTimeEarliest}
          required
        />
        <TimePicker
          name="pickupTimeLatest"
          label="Latest Time"
          value={values.pickupTimeLatest || null}
          onChange={(time) => setFieldValue('pickupTimeLatest', time)}
          onBlur={handleBlur}
          error={errors.pickupTimeLatest}
          required
        />

        <h3>Delivery Scheduling</h3>
        <DatePicker
          name="deliveryDate"
          label="Date"
          value={values.deliveryDate || null}
          onChange={(date) => setFieldValue('deliveryDate', date)}
          onBlur={handleBlur}
          error={errors.deliveryDate}
          required
        />
        <TimePicker
          name="deliveryTimeEarliest"
          label="Earliest Time"
          value={values.deliveryTimeEarliest || null}
          onChange={(time) => setFieldValue('deliveryTimeEarliest', time)}
          onBlur={handleBlur}
          error={errors.deliveryTimeEarliest}
          required
        />
        <TimePicker
          name="deliveryTimeLatest"
          label="Latest Time"
          value={values.deliveryTimeLatest || null}
          onChange={(time) => setFieldValue('deliveryTimeLatest', time)}
          onBlur={handleBlur}
          error={errors.deliveryTimeLatest}
          required
        />
      </Card>
    );
  }

  // Render the fifth step of the form with special requirements and pricing
  function renderSpecialRequirementsStep({ values, errors, handleChange, handleBlur, setFieldValue }) {
    return (
      <Card>
        <Checkbox
          name="isHazardous"
          label="Hazardous Materials"
          checked={values.isHazardous || false}
          onChange={(e) => setFieldValue('isHazardous', e.target.checked)}
          onBlur={handleBlur}
          error={errors.isHazardous}
        />
        <Checkbox
          name="temperatureRequirements"
          label="Temperature Requirements"
          checked={!!values.temperatureRequirements}
          onChange={(e) => setFieldValue('temperatureRequirements', e.target.checked ? { min: 0, max: 0, unit: 'F' } : null)}
          onBlur={handleBlur}
          error={errors.temperatureRequirements}
        />
        {values.temperatureRequirements && (
          <>
            <Input
              name="temperatureRequirements.min"
              label="Min Temp (F)"
              type="number"
              value={values.temperatureRequirements.min || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.temperatureRequirements?.min}
            />
            <Input
              name="temperatureRequirements.max"
              label="Max Temp (F)"
              type="number"
              value={values.temperatureRequirements.max || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.temperatureRequirements?.max}
            />
          </>
        )}
        <TextArea
          name="specialInstructions"
          label="Special Instructions"
          value={values.specialInstructions || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.specialInstructions}
        />
        <Input
          name="offeredRate"
          label="Offered Rate"
          type="number"
          value={values.offeredRate || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.offeredRate}
        />
      </Card>
    );
  }

  // Transforms form values into the format expected by the API
  function prepareFormData(values: any): LoadCreationParams | LoadUpdateParams {
    const {
      referenceNumber,
      description,
      equipmentType,
      weight,
      length,
      width,
      height,
      volume,
      pallets,
      commodity,
      pickupDate,
      pickupTimeEarliest,
      pickupTimeLatest,
      deliveryDate,
      deliveryTimeEarliest,
      deliveryTimeLatest,
      offeredRate,
      specialInstructions,
      isHazardous,
      temperatureRequirements,
      pickupFacilityName,
      pickupAddress,
      pickupCity,
      pickupState,
      pickupZip,
      pickupContactName,
      pickupContactPhone,
      pickupContactEmail,
      deliveryFacilityName,
      deliveryAddress,
      deliveryCity,
      deliveryState,
      deliveryZip,
      deliveryContactName,
      deliveryContactPhone,
      deliveryContactEmail,
    } = values;

    const dimensions = {
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
    };

    const pickupEarliest = new Date(`${pickupDate} ${pickupTimeEarliest}`).toISOString();
    const pickupLatest = new Date(`${pickupDate} ${pickupTimeLatest}`).toISOString();
    const deliveryEarliest = new Date(`${deliveryDate} ${deliveryTimeEarliest}`).toISOString();
    const deliveryLatest = new Date(`${deliveryDate} ${deliveryTimeLatest}`).toISOString();

    const formData: LoadCreationParams = {
      shipperId: 'shipper-123', // Replace with actual shipper ID
      referenceNumber,
      description,
      equipmentType,
      weight: parseFloat(weight),
      dimensions,
      volume: parseFloat(volume),
      pallets: parseInt(pallets),
      commodity,
      pickupEarliest,
      pickupLatest,
      deliveryEarliest,
      deliveryLatest,
      offeredRate: parseFloat(offeredRate),
      specialInstructions,
      isHazardous: !!isHazardous,
      temperatureRequirements: temperatureRequirements ? {
        min: parseFloat(temperatureRequirements.min),
        max: parseFloat(temperatureRequirements.max),
        unit: temperatureRequirements.unit,
      } : null,
      locations: [
        {
          locationType: 'pickup',
          facilityName: pickupFacilityName,
          address: {
            street1: pickupAddress,
            city: pickupCity,
            state: pickupState,
            zipCode: pickupZip,
            country: 'USA',
          },
          coordinates: { latitude: 0, longitude: 0 }, // Replace with actual coordinates
          earliestTime: pickupEarliest,
          latestTime: pickupLatest,
          contactName: pickupContactName,
          contactPhone: pickupContactPhone,
          specialInstructions: '',
        },
        {
          locationType: 'delivery',
          facilityName: deliveryFacilityName,
          address: {
            street1: deliveryAddress,
            city: deliveryCity,
            state: deliveryState,
            zipCode: deliveryZip,
            country: 'USA',
          },
          coordinates: { latitude: 0, longitude: 0 }, // Replace with actual coordinates
          earliestTime: deliveryEarliest,
          latestTime: deliveryLatest,
          contactName: deliveryContactName,
          contactPhone: deliveryContactPhone,
          specialInstructions: '',
        },
      ],
    };

    return formData;
  }
};

export default LoadForm;

export type { LoadFormProps };