import React, { useState, useEffect } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import Form, { useFormContext } from '../../../../shared/components/forms/Form';
import Input from '../../../../shared/components/forms/Input';
import Button from '../../../../shared/components/buttons/Button';
import FileUpload from '../../../../shared/components/forms/FileUpload';
import Card from '../../../../shared/components/cards/Card';
import Alert from '../../../../shared/components/feedback/Alert';
import useForm from '../../../../common/hooks/useForm';
import { User, UserUpdateParams } from '../../../../common/interfaces/user.interface';
import authService from '../../../../common/services/authService';
import settingsService from '../../../services/settingsService';

/**
 * @dev ProfileFormValues - TypeScript interface for profile form values
 */
interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * @dev PasswordFormValues - TypeScript interface for password change form values
 */
interface PasswordFormValues {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * @dev AlertState - TypeScript interface for alert message state
 */
interface AlertState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

/**
 * @dev ProfileContainer - Container for the profile settings component
 */
const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

/**
 * @dev ProfileSection - Section container for grouping related profile settings
 */
const ProfileSection = styled.div`
  margin-bottom: 2rem;
`;

/**
 * @dev SectionTitle - Title for each profile settings section
 */
const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

/**
 * @dev FormRow - Row container for form fields
 */
const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
`;

/**
 * @dev FormColumn - Column container for form fields
 */
const FormColumn = styled.div`
  flex: 1;
  min-width: 250px;
`;

/**
 * @dev ProfileImageContainer - Container for profile image and upload controls
 */
const ProfileImageContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

/**
 * @dev ProfileImage - Styled profile image display
 */
const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

/**
 * @dev ButtonContainer - Container for form buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

/**
 * @dev ProfileSettings - Component for managing user profile settings
 * @returns Rendered profile settings component
 */
const ProfileSettings: React.FC = () => {
  // LD1: Initialize state for user data, loading state, and alert messages
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileAlert, setProfileAlert] = useState<AlertState>({ type: 'success', message: '', visible: false });
  const [passwordAlert, setPasswordAlert] = useState<AlertState>({ type: 'success', message: '', visible: false });
  const [logoAlert, setLogoAlert] = useState<AlertState>({ type: 'success', message: '', visible: false });
  const [profileImage, setProfileImage] = useState<File | null>(null);

  // LD1: Fetch current user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setProfileAlert({ type: 'error', message: 'Failed to load profile information.', visible: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // LD1: Set up form validation schema for profile fields
  const profileValidationSchema = {
    firstName: (value: string) => value ? true : 'First name is required',
    lastName: (value: string) => value ? true : 'Last name is required',
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Invalid email format',
    phone: (value: string) => /^[0-9]{10}$/.test(value) ? true : 'Invalid phone number format',
  };

  // LD1: Set up form validation schema for password change fields
  const passwordValidationSchema = {
    currentPassword: (value: string) => value ? true : 'Current password is required',
    newPassword: (value: string) => value ? true : 'New password is required',
    confirmPassword: (value: string) => value ? true : 'Confirm password is required',
  };

  // LD1: Handle form submission to update profile information
  const handleProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    const updateParams: UserUpdateParams = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    };

    try {
      await settingsService.updateCompanySettings(user.shipperId || '', updateParams);
      setUser({ ...user, ...values });
      setProfileAlert({ type: 'success', message: 'Profile updated successfully!', visible: true });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileAlert({ type: 'error', message: 'Failed to update profile. Please try again.', visible: true });
    }
  };

  // LD1: Handle profile image upload
  const handleImageUpload = async (file: File) => {
    if (!user) return;

    try {
      await settingsService.uploadCompanyLogo(user.shipperId || '', file);
      setProfileImage(file);
      setLogoAlert({ type: 'success', message: 'Logo updated successfully!', visible: true });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setLogoAlert({ type: 'error', message: 'Failed to upload logo. Please try again.', visible: true });
    }
  };

  // LD1: Handle password change submission
  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword || '',
        newPassword: values.newPassword || '',
      });
      setPasswordAlert({ type: 'success', message: 'Password changed successfully!', visible: true });
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordAlert({ type: 'error', message: 'Failed to change password. Please try again.', visible: true });
    }
  };

  // LD1: Render form with profile fields (first name, last name, email, phone)
  return (
    <ProfileContainer>
      {loading ? (
        <div>Loading...</div>
      ) : user ? (
        <>
          <Card>
            <ProfileSection>
              <SectionTitle>Profile Information</SectionTitle>
              {profileAlert.visible && (
                <Alert severity={profileAlert.type} message={profileAlert.message} onClose={() => setProfileAlert({ ...profileAlert, visible: false })} />
              )}
              <Form
                initialValues={{
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  phone: user.phone,
                }}
                validationSchema={profileValidationSchema}
                onSubmit={handleProfileSubmit}
              >
                <FormRow>
                  <FormColumn>
                    <Input label="First Name" name="firstName" required />
                  </FormColumn>
                  <FormColumn>
                    <Input label="Last Name" name="lastName" required />
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn>
                    <Input label="Email" name="email" type="email" required />
                  </FormColumn>
                  <FormColumn>
                    <Input label="Phone" name="phone" type="tel" required />
                  </FormColumn>
                </FormRow>
                <ButtonContainer>
                  <Button type="submit">Update Profile</Button>
                </ButtonContainer>
              </Form>
            </ProfileSection>
          </Card>

          {/* LD1: Render profile image upload section */}
          <Card>
            <ProfileSection>
              <SectionTitle>Profile Image</SectionTitle>
              {logoAlert.visible && (
                <Alert severity={logoAlert.type} message={logoAlert.message} onClose={() => setLogoAlert({ ...logoAlert, visible: false })} />
              )}
              <ProfileImageContainer>
                <ProfileImage src={profileImage ? URL.createObjectURL(profileImage) : user.profileImageUrl || 'default-profile-image.png'} alt="Profile" />
                <FileUpload name="profileImage" accept="image/*" onChange={(files) => files[0] && handleImageUpload(files[0])} />
              </ProfileImageContainer>
            </ProfileSection>
          </Card>

          {/* LD1: Render password change section */}
          <Card>
            <ProfileSection>
              <SectionTitle>Change Password</SectionTitle>
              {passwordAlert.visible && (
                <Alert severity={passwordAlert.type} message={passwordAlert.message} onClose={() => setPasswordAlert({ ...passwordAlert, visible: false })} />
              )}
              <Form
                initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                validationSchema={passwordValidationSchema}
                onSubmit={handlePasswordChange}
              >
                <Input label="Current Password" name="currentPassword" type="password" required />
                <Input label="New Password" name="newPassword" type="password" required />
                <Input label="Confirm Password" name="confirmPassword" type="password" required />
                <ButtonContainer>
                  <Button type="submit">Change Password</Button>
                </ButtonContainer>
              </Form>
            </ProfileSection>
          </Card>
        </>
      ) : (
        <div>User not found.</div>
      )}
    </ProfileContainer>
  );
};

export default ProfileSettings;