import React, { useState, useEffect } from 'react'; // react ^18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import Form from '../../../../shared/components/forms/Form';
import Input from '../../../../shared/components/forms/Input';
import Select from '../../../../shared/components/forms/Select';
import Button from '../../../../shared/components/buttons/Button';
import useForm from '../../../../common/hooks/useForm';
import { UserProfile, UserUpdateParams } from '../../../../common/interfaces/user.interface';
import settingsService from '../../services/settingsService';
import { ThemeType } from '../../../../shared/styles/theme';

// Define the default profile image
const DEFAULT_PROFILE_IMAGE = '/assets/images/avatar-placeholder.png';

// Define the interface for the profile form values
interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl: string;
}

// Styled component for the profile settings container
const ProfileSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
`;

// Styled component for a form section
const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

// Styled component for a section title
const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  margin-bottom: 1rem;
`;

// Styled component for a form row
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// Styled component for the profile image container
const ProfileImageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

// Styled component for the profile image
const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }: { theme: ThemeType }) => theme.colors.primary.main};
`;

// Styled component for the image upload input
const ImageUploadInput = styled.input`
  display: none;
`;

// Styled component for the button container
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

// Styled component for the error message
const ErrorMessage = styled.div`
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.semantic.error};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

// Styled component for the success message
const SuccessMessage = styled.div`
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.semantic.success};
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

// ProfileSettings component
const ProfileSettings: React.FC = () => {
  // Initialize state for user profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Initialize state for loading status
  const [loading, setLoading] = useState(true);
  // Initialize state for error messages
  const [error, setError] = useState<string | null>(null);
  // Initialize state for success message
  const [success, setSuccess] = useState<string | null>(null);
  // Initialize state for profile image file
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  // Initialize state for profile image preview
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const userProfile = await settingsService.getUserProfile();
        setProfile(userProfile);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Define validation schema for form fields
  const validationSchema = {
    firstName: (value: string) => {
      if (!value) return 'Required field';
      if (value.length < 2 || value.length > 50) return 'Must be between 2 and 50 characters';
      return true;
    },
    lastName: (value: string) => {
      if (!value) return 'Required field';
      if (value.length < 2 || value.length > 50) return 'Must be between 2 and 50 characters';
      return true;
    },
    email: (value: string) => {
      if (!value) return 'Required field';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Must be a valid email format';
      return true;
    },
    phone: (value: string) => {
      if (!value) return 'Required field';
      if (!/^[0-9]{10}$/.test(value)) return 'Must be a valid phone number format';
      return true;
    },
  };

  // Handle form submission to update profile
  const handleSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateParams: UserUpdateParams = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        profileImageUrl: values.profileImageUrl,
        status: profile?.status || 'ACTIVE', // Default to active if profile is not yet loaded
        roles: profile?.roles || [], // Default to empty array if profile is not yet loaded
        carrierId: profile?.carrierId || null, // Default to null if profile is not yet loaded
        shipperId: profile?.shipperId || null, // Default to null if profile is not yet loaded
        driverId: profile?.driverId || null, // Default to null if profile is not yet loaded
      };

      const updatedProfile = await settingsService.updateUserProfile(updateParams);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setProfileImageFile(file);

      try {
        const imageUrl = await settingsService.uploadProfileImage(file);
        setProfileImagePreview(imageUrl.imageUrl);
        setSuccess('Profile image uploaded successfully!');
      } catch (e: any) {
        setError(e.message || 'Failed to upload profile image');
        setProfileImagePreview(null);
      } finally {
        setLoading(false);
      }
    }
  };

  // Define initial form values based on profile data
  const initialValues: ProfileFormValues = {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    profileImageUrl: profile?.profileImageUrl || '',
  };

  // Render form with user profile fields
  return (
    <ProfileSettingsContainer>
      {loading && <div>Loading profile...</div>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      {profile && (
        <Form initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>Personal Information</SectionTitle>
            <ProfileImageContainer>
              <ProfileImage
                src={profileImagePreview || profile.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                alt="Profile"
              />
              <label htmlFor="profileImageUpload">
                <Button variant="secondary" disabled={loading}>
                  Upload New Image
                </Button>
              </label>
              <ImageUploadInput
                type="file"
                id="profileImageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
              />
            </ProfileImageContainer>
            <FormRow>
              <Input label="First Name" name="firstName" required disabled={loading} />
              <Input label="Last Name" name="lastName" required disabled={loading} />
            </FormRow>
            <Input label="Email" name="email" type="email" required disabled={loading} />
            <Input label="Phone" name="phone" type="tel" required disabled={loading} />
          </FormSection>
          <ButtonContainer>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </ButtonContainer>
        </Form>
      )}
    </ProfileSettingsContainer>
  );
};

export default ProfileSettings;