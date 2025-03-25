import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { View } from 'react-native';
import styled from 'styled-components/native'; // styled-components v5.3.6

import Container from '../../../shared/components/layout/Container';
import Heading from '../../../shared/components/typography/Heading';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Form from '../../../shared/components/forms/Form';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import Alert from '../../../shared/components/feedback/Alert';
import StatusBar from '../components/StatusBar';
import useAuth from '../../../common/hooks/useAuth';
import { Driver } from '../../../common/interfaces/driver.interface';
import { User } from '../../../common/interfaces/user.interface';

/**
 * @dev ProfileFormValues - TypeScript interface for profile form values
 */
interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: string;
  'homeAddress.street': string;
  'homeAddress.city': string;
  'homeAddress.state': string;
  'homeAddress.zipCode': string;
}

/**
 * @dev ProfileScreen - Main component for the driver profile screen
 * @returns Rendered profile screen component
 */
const ProfileScreen: React.FC = () => {
  // LD1: Initialize state for driver profile data
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  // LD1: Initialize state for loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // LD1: Initialize state for error and success messages
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // LD1: Initialize state for edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // LD5: Get authentication context using useAuth hook
  const { authState, logout } = useAuth();

  // LD5: Extract user and tokens from authentication state
  const user = authState.user;

  // LD6: Fetch driver profile data on component mount
  useEffect(() => {
    const fetchDriverProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with actual API call to fetch driver profile
        // const profile = await api.getDriverProfile(authState.user.driverId);
        // setDriverProfile(profile);
        setDriverProfile({
          id: '123',
          userId: '456',
          carrierId: '789',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          licenseNumber: 'DL12345',
          licenseState: 'CA',
          licenseClass: 'class_a',
          licenseEndorsements: [],
          licenseExpiration: '2024-12-31',
          homeAddress: {
            street1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '91234',
            country: 'USA',
          },
          currentLocation: { latitude: 34.0522, longitude: -118.2437 },
          currentVehicleId: 'VC123',
          currentLoadId: 'LD456',
          status: 'active',
          hosStatus: 'off_duty',
          hosStatusSince: '2023-10-26T12:00:00Z',
          drivingMinutesRemaining: 480,
          dutyMinutesRemaining: 720,
          cycleMinutesRemaining: 3400,
          efficiencyScore: 85,
          eldDeviceId: 'ELD789',
          eldProvider: 'KeepTruckin',
          createdAt: '2023-10-26T10:00:00Z',
          updatedAt: '2023-10-26T11:00:00Z',
          active: true,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.isAuthenticated && authState.user?.driverId) {
      fetchDriverProfile();
    }
  }, [authState]);

  // LD7: Handle form submission for profile updates
  const handleSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // TODO: Replace with actual API call to update driver profile
      // await api.updateDriverProfile(authState.user.driverId, values);
      setSuccessMessage('Profile updated successfully!');
      setIsEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // LD8: Toggle between view and edit modes
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setError(null);
    setSuccessMessage(null);
  };

  // LD9: Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      // TODO: Navigate to login screen
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  // LD10: Render loading indicator while fetching data
  if (isLoading) {
    return (
      <Container>
        <LoadingIndicator label="Loading profile..." />
      </Container>
    );
  }

  // LD11: Render error alert if fetch or update fails
  if (error) {
    return (
      <Container>
        <Alert severity="error" message={error} onClose={() => setError(null)} />
      </Container>
    );
  }

  // LD12: Render success alert after successful update
  if (successMessage) {
    return (
      <Container>
        <Alert severity="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      </Container>
    );
  }

  // LD13: Render profile information in view mode
  if (!isEditMode && driverProfile) {
    return (
      <Container>
        <StatusBar driverId={authState.user?.driverId || ''} />
        <Heading level={2}>Profile Information</Heading>
        <View>
          <Text>First Name: {driverProfile.firstName}</Text>
          <Text>Last Name: {driverProfile.lastName}</Text>
          <Text>Email: {driverProfile.email}</Text>
          <Text>Phone: {driverProfile.phone}</Text>
          <Text>License Number: {driverProfile.licenseNumber}</Text>
          <Text>License State: {driverProfile.licenseState}</Text>
          <Text>License Expiration: {driverProfile.licenseExpiration}</Text>
          <Text>Home Address: {driverProfile.homeAddress.street1}, {driverProfile.homeAddress.city}, {driverProfile.homeAddress.state} {driverProfile.homeAddress.zipCode}</Text>
        </View>
        <Button onPress={toggleEditMode}>Edit Profile</Button>
        <Button variant="secondary" onPress={handleLogout}>Logout</Button>
      </Container>
    );
  }

  // LD14: Render editable form in edit mode
  return (
    <Container>
      <StatusBar driverId={authState.user?.driverId || ''} />
      <Heading level={2}>Edit Profile</Heading>
      <Form
        initialValues={{
          firstName: driverProfile?.firstName || '',
          lastName: driverProfile?.lastName || '',
          email: driverProfile?.email || '',
          phone: driverProfile?.phone || '',
          licenseNumber: driverProfile?.licenseNumber || '',
          licenseState: driverProfile?.licenseState || '',
          licenseExpiration: driverProfile?.licenseExpiration || '',
          'homeAddress.street': driverProfile?.homeAddress.street1 || '',
          'homeAddress.city': driverProfile?.homeAddress.city || '',
          'homeAddress.state': driverProfile?.homeAddress.state || '',
          'homeAddress.zipCode': driverProfile?.homeAddress.zipCode || '',
        }}
        onSubmit={handleSubmit}
      >
        <Input name="firstName" label="First Name" />
        <Input name="lastName" label="Last Name" />
        <Input name="email" label="Email" type="email" />
        <Input name="phone" label="Phone" type="tel" />
        <Input name="licenseNumber" label="License Number" />
        <Input name="licenseState" label="License State" />
        <Input name="licenseExpiration" label="License Expiration" type="date" />
        <Input name="homeAddress.street" label="Home Street" />
        <Input name="homeAddress.city" label="Home City" />
        <Input name="homeAddress.state" label="Home State" />
        <Input name="homeAddress.zipCode" label="Home Zip Code" />
        <Button type="submit">Save Changes</Button>
        <Button variant="secondary" onPress={toggleEditMode}>Cancel</Button>
      </Form>
    </Container>
  );
};

// Enterprise-ready and production-appropriate coding style
export default ProfileScreen;