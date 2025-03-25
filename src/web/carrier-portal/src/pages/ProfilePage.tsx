import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.6

import MainLayout from '../components/layout/MainLayout';
import PageHeader from '../components/layout/PageHeader';
import ProfileSettings from '../components/settings/ProfileSettings';
import Tabs from '../../../shared/components/navigation/Tabs';
import Card from '../../../shared/components/cards/Card';
import Form from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Alert from '../../../shared/components/feedback/Alert';
import useForm from '../../../common/hooks/useForm';
import { useAuthContext } from '../../../common/contexts/AuthContext';
import settingsService from '../services/settingsService';

// Define the interface for password change form values
interface PasswordFormValues {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Define the interface for MFA setup response data
interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
}

// Define the tab definitions for the profile page
const TABS = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security Settings' },
];

// Styled component for the profile page content
const PageContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

// Styled component for the active tab content
const TabContent = styled.div`
  margin-top: 2rem;
  width: 100%;
`;

// Styled component for the security settings section
const SecuritySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 600px;
`;

// Styled component for settings sections title
const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

// Styled component for forms
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

// Styled component for form buttons
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

// Styled component for MFA setup and management
const MfaContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// Styled component for MFA QR code
const QrCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
`;

// Styled component for MFA QR code image
const QrCode = styled.img`
  width: 200px;
  height: 200px;
  border: 1px solid #e0e0e0;
`;

// Styled component for MFA instructions
const MfaInstructions = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: #666;
  margin-bottom: 1rem;
`;

// Styled component for MFA verification
const VerificationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Validation schema for password change form
 */
const validationSchema = {
  currentPassword: (value: string) => {
    if (!value) return 'Required field';
    if (value.length < 8) return 'Must be at least 8 characters';
    return true;
  },
  newPassword: (value: string) => {
    if (!value) return 'Required field';
    if (value.length < 8) return 'Must be at least 8 characters';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).*$/.test(value)) {
      return 'Must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    return true;
  },
  confirmPassword: (value: string) => {
    if (!value) return 'Required field';
    return true;
  },
};

/**
 * Main component for the user profile page
 * @returns {JSX.Element} Rendered profile page component
 */
const ProfilePage: React.FC = () => {
  // Initialize state for active tab
  const [activeTab, setActiveTab] = useState('profile');

  // Initialize state for password form values
  const [passwordFormValues, setPasswordFormValues] = useState<PasswordFormValues>({});

  // Initialize state for password form errors
  const [passwordFormErrors, setPasswordFormErrors] = useState<Record<string, string>>({});

  // Initialize state for password change success/error messages
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);

  // Initialize state for MFA setup data
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupData | null>(null);

  // Initialize state for MFA verification code
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');

  // Initialize state for MFA setup/verification status
  const [mfaStatus, setMfaStatus] = useState<'idle' | 'setting-up' | 'verifying' | 'enabled' | 'disabling' | 'disabled'>('idle');

  // Get authentication context
  const { authState, changePassword, setupMfa, verifyMfaSetup, disableMfa } = useAuthContext();

  // Implement handleTabChange function
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Implement handlePasswordChange function
  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      setPasswordChangeMessage(null);
      setPasswordFormErrors({});
      if (values.newPassword !== values.confirmPassword) {
        setPasswordFormErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }
      await changePassword({
        currentPassword: values.currentPassword || '',
        newPassword: values.newPassword || '',
      });
      setPasswordChangeMessage('Password changed successfully!');
    } catch (error: any) {
      setPasswordFormErrors({ form: error.message });
    }
  };

  // Implement handleSetupMfa function
  const handleSetupMfa = async () => {
    try {
      setMfaStatus('setting-up');
      const data = await setupMfa();
      setMfaSetupData(data);
    } catch (error: any) {
      console.error('MFA setup failed', error);
    }
  };

  // Implement handleVerifyMfa function
  const handleVerifyMfa = async () => {
    try {
      setMfaStatus('verifying');
      if (mfaVerificationCode && authState.user) {
        const success = await verifyMfaSetup(mfaVerificationCode);
        if (success) {
          setMfaStatus('enabled');
        } else {
          console.error('MFA verification failed');
        }
      }
    } catch (error: any) {
      console.error('MFA verification failed', error);
    }
  };

  // Implement handleDisableMfa function
  const handleDisableMfa = async () => {
    try {
      setMfaStatus('disabling');
      if (mfaVerificationCode) {
        const success = await disableMfa(mfaVerificationCode);
        if (success) {
          setMfaStatus('disabled');
        } else {
          console.error('MFA disabling failed');
        }
      }
    } catch (error: any) {
      console.error('MFA disabling failed', error);
    }
  };

  // Render the profile page
  return (
    <MainLayout>
      <PageContainer>
        <PageHeader title="My Profile" />
        <Tabs
          tabs={TABS}
          activeTabId={activeTab}
          onChange={handleTabChange}
        />
        <TabContent>
          {activeTab === 'profile' && (
            <ProfileSettings />
          )}
          {activeTab === 'security' && (
            <SecuritySection>
              <Card>
                <SectionTitle>Change Password</SectionTitle>
                <FormContainer>
                  {passwordChangeMessage && <Alert severity="success" message={passwordChangeMessage} />}
                  {passwordFormErrors.form && <Alert severity="error" message={passwordFormErrors.form} />}
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    required
                  />
                  <ButtonContainer>
                    <Button type="submit">Change Password</Button>
                  </ButtonContainer>
                </FormContainer>
              </Card>
              <Card>
                <SectionTitle>Multi-Factor Authentication</SectionTitle>
                <MfaContainer>
                  {mfaStatus === 'idle' && !authState.user?.mfaEnabled && (
                    <>
                      <p>
                        Set up multi-factor authentication to add an extra layer of security to your account.
                      </p>
                      <Button onClick={handleSetupMfa}>Setup MFA</Button>
                    </>
                  )}
                  {mfaStatus === 'setting-up' && mfaSetupData && (
                    <QrCodeContainer>
                      <QrCode src={mfaSetupData.qrCodeUrl} alt="MFA QR Code" />
                      <MfaInstructions>
                        Scan this QR code with an authenticator app (like Google Authenticator or Authy) and enter the verification code below.
                      </MfaInstructions>
                      <VerificationContainer>
                        <Input
                          label="Verification Code"
                          type="text"
                          value={mfaVerificationCode}
                          onChange={(e) => setMfaVerificationCode(e.target.value)}
                        />
                        <Button onClick={handleVerifyMfa}>Verify MFA</Button>
                      </VerificationContainer>
                    </QrCodeContainer>
                  )}
                  {mfaStatus === 'enabled' && authState.user?.mfaEnabled && (
                    <>
                      <p>
                        Multi-factor authentication is enabled for your account.
                      </p>
                      <VerificationContainer>
                        <Input
                          label="Verification Code"
                          type="text"
                          value={mfaVerificationCode}
                          onChange={(e) => setMfaVerificationCode(e.target.value)}
                        />
                        <Button onClick={handleDisableMfa}>Disable MFA</Button>
                      </VerificationContainer>
                    </>
                  )}
                  {mfaStatus === 'disabled' && !authState.user?.mfaEnabled && (
                    <p>
                      Multi-factor authentication is disabled for your account.
                    </p>
                  )}
                </MfaContainer>
              </Card>
            </SecuritySection>
          )}
        </TabContent>
      </PageContainer>
    </MainLayout>
  );
};

export default ProfilePage;