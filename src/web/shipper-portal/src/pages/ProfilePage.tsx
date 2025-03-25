import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.6
import { useNotification } from '@mui/material'; // version ^5.11.0
import MainLayout from '../components/layout/MainLayout';
import Form, { FormProps } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import { getCurrentUser, changePassword } from '../../../common/services/authService';
import settingsService from '../services/settingsService';
import { User } from '../../../common/interfaces/user.interface';

// LD1: Define an interface for profile form values
interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// LD1: Define an interface for password change form values
interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// LD1: Define an interface for notification preference item
interface NotificationPreference {
  id: string;
  type: string;
  name: string;
  description: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

// LD1: Styled component for the entire profile page
const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

// LD1: Styled component for the title of each section
const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fonts.size.lg};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

// LD1: Styled component for each section of the profile page
const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

// LD1: Styled component for a row of form fields
const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// LD1: Styled component for a column of form fields
const FormColumn = styled.div`
  flex: 1;
  min-width: 250px;
`;

// LD1: Styled component for the container of form buttons
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

// LD1: Styled component for each notification preference item
const NotificationPreferenceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

// LD1: Styled component for the MFA configuration section
const MfaSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

// LD1: Define a validation schema for the profile form
const PROFILE_VALIDATION_SCHEMA = {
  firstName: (value: string) => value ? true : 'First name is required',
  lastName: (value: string) => value ? true : 'Last name is required',
  email: (value: string) => value ? true : 'Email is required',
  phone: (value: string) => value ? true : 'Phone is required',
};

// LD1: Define a validation schema for the password change form
const PASSWORD_VALIDATION_SCHEMA = {
  currentPassword: (value: string) => value ? true : 'Current password is required',
  newPassword: (value: string) => value ? true : 'New password is required',
  confirmPassword: (value: string) => value ? true : 'Confirm password is required',
};

/**
 * LD1: Main component for the user profile page
 */
const ProfilePage: React.FC = () => {
  // LD1: Initialize state for user profile data
  const [profile, setProfile] = useState<User | null>(null);

  // LD1: Initialize state for loading status
  const [loading, setLoading] = useState<boolean>(false);

  // LD1: Initialize state for notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);

  // LD1: Initialize state for form errors
  const [formError, setFormError] = useState<string | null>(null);

  // LD1: Get the notification display function
  const notification = useNotification();

  // LD1: Fetch current user data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        setProfile(user);
      } catch (error: any) {
        setFormError(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // LD1: Fetch notification preferences on component mount
  useEffect(() => {
    const fetchNotificationPrefs = async () => {
      setLoading(true);
      try {
        //LD1: Check if profile exists before accessing its id
        if (profile?.id) {
          const prefs = await settingsService.getNotificationPreferences(profile.id);
          setNotificationPreferences(prefs);
        }
      } catch (error: any) {
        setFormError(error.message || 'Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationPrefs();
  }, [profile?.id]);

  // LD1: Handle profile form submission
  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    setFormError(null);
    try {
      //LD1: Check if profile exists before accessing its id
      if (profile?.id) {
        await settingsService.updateCompanySettings(profile.id, values);
        notification.showNotification({
          type: 'success',
          message: 'Profile updated successfully',
        });
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to update profile');
      notification.showNotification({
        type: 'error',
        message: error.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  // LD1: Handle password change form submission
  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setLoading(true);
    setFormError(null);
    try {
      await changePassword(values);
      notification.showNotification({
        type: 'success',
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      setFormError(error.message || 'Failed to change password');
      notification.showNotification({
        type: 'error',
        message: error.message || 'Failed to change password',
      });
    } finally {
      setLoading(false);
    }
  };

  // LD1: Handle notification preferences updates
  const handleNotificationPreferencesSubmit = async (preferences: any) => {
    setLoading(true);
    setFormError(null);
    try {
      //LD1: Check if profile exists before accessing its id
      if (profile?.id) {
        await settingsService.updateNotificationPreferences(profile.id, preferences);
        notification.showNotification({
          type: 'success',
          message: 'Notification preferences updated successfully',
        });
      }
    } catch (error: any) {
      setFormError(error.message || 'Failed to update notification preferences');
      notification.showNotification({
        type: 'error',
        message: error.message || 'Failed to update notification preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  // LD1: Render the page with MainLayout component
  return (
    <MainLayout>
      <PageContainer>
        {/* LD1: Render profile information section with Form component */}
        <Section>
          <SectionTitle>Profile Information</SectionTitle>
          <Form
            initialValues={{
              firstName: profile?.firstName || '',
              lastName: profile?.lastName || '',
              email: profile?.email || '',
              phone: profile?.phone || '',
            }}
            validationSchema={PROFILE_VALIDATION_SCHEMA}
            onSubmit={handleProfileSubmit}
          >
            <FormRow>
              <FormColumn>
                <Input label="First Name" name="firstName" />
              </FormColumn>
              <FormColumn>
                <Input label="Last Name" name="lastName" />
              </FormColumn>
            </FormRow>
            <Input label="Email" name="email" type="email" />
            <Input label="Phone" name="phone" type="tel" />
            <ButtonContainer>
              <Button type="submit">Update Profile</Button>
            </ButtonContainer>
          </Form>
        </Section>

        {/* LD1: Render password change section with Form component */}
        <Section>
          <SectionTitle>Change Password</SectionTitle>
          <Form
            initialValues={{
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            }}
            validationSchema={PASSWORD_VALIDATION_SCHEMA}
            onSubmit={handlePasswordSubmit}
          >
            <Input label="Current Password" name="currentPassword" type="password" />
            <Input label="New Password" name="newPassword" type="password" />
            <Input label="Confirm New Password" name="confirmPassword" type="password" />
            <ButtonContainer>
              <Button type="submit">Change Password</Button>
            </ButtonContainer>
          </Form>
        </Section>

        {/* LD1: Render notification preferences section */}
        <Section>
          <SectionTitle>Notification Preferences</SectionTitle>
          {/* Render notification preferences here */}
        </Section>

        {/* LD1: Render MFA configuration section if not already enabled */}
        {!profile?.mfaEnabled && (
          <Section>
            <SectionTitle>Multi-Factor Authentication</SectionTitle>
            <MfaSection>
              {/* Render MFA setup instructions and button here */}
            </MfaSection>
          </Section>
        )}
      </PageContainer>
    </MainLayout>
  );
};

// IE3: Export the ProfilePage component
export default ProfilePage;

// LD1: Styled component for the entire profile page
const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

// LD1: Styled component for the title of each section
const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fonts.size.lg};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.xs};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

// LD1: Styled component for each section of the profile page
const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

// LD1: Styled component for a row of form fields
const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// LD1: Styled component for a column of form fields
const FormColumn = styled.div`
  flex: 1;
  min-width: 250px;
`;

// LD1: Styled component for the container of form buttons
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

// LD1: Styled component for each notification preference item
const NotificationPreferenceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
`;

// LD1: Styled component for the MFA configuration section
const MfaSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;