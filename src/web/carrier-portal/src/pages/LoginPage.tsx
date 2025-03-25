import React, { useState, useEffect } from 'react'; // React v18.2.0
import { useNavigate, useLocation } from 'react-router-dom'; // react-router-dom
import styled from 'styled-components'; // styled-components ^5.3.6
import * as Yup from 'yup'; // Library for schema validation

import { useAuthContext } from '../../../common/contexts/AuthContext';
import Form, { FormProps } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Container from '../../../shared/components/layout/Container';
import { CARRIER_PORTAL_ROUTES, AUTH_ROUTES } from '../../../common/constants/routes';
import { LoginRequest } from '../../../common/interfaces/auth.interface';

/**
 * Interface for login form values
 */
interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Interface for MFA verification form values
 */
interface MfaFormValues {
  mfaCode: string;
}

/**
 * Validation rules for email and password fields
 */
const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

/**
 * Validation rules for MFA code field
 */
const mfaValidationSchema = Yup.object().shape({
  mfaCode: Yup.string().required('MFA code is required'),
});

/**
 * Styled container for the login page
 */
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

/**
 * Styled card containing the login form
 */
const LoginCard = styled.div`
  width: 100%;
  max-width: 450px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

/**
 * Styled header for the login form
 */
const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/**
 * Styled title for the login form
 */
const LoginTitle = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.xl};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Styled subtitle for the login form
 */
const LoginSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fonts.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * Styled container for the logo
 */
const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/**
 * Styled logo image
 */
const Logo = styled.img`
  height: 60px;
  width: auto;
`;

/**
 * Styled link for forgot password
 */
const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: ${({ theme }) => theme.fonts.size.sm};
  text-align: right;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.sm};
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

/**
 * Styled container for the login button
 */
const ButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

/**
 * Login page component for carrier portal authentication
 * @returns Rendered login page component
 */
const LoginPage: React.FC = () => {
  // Initialize state for email, password, and MFA code
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Initialize state for loading status and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state for MFA verification mode
  const [mfaVerification, setMfaVerification] = useState(false);

  // Get authentication context using useAuthContext hook
  const { login, verifyMfa } = useAuthContext();

  // Get navigation and location hooks from React Router
  const navigate = useNavigate();
  const location = useLocation();

  // Define handleLogin function to process login form submission
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the login function from the authentication context
      const response = await login({ email, password, rememberMe: true });
      if (response && response.mfaRequired) {
        // If MFA is required, set the MFA verification mode to true
        setMfaVerification(true);
      } else {
        // If login is successful, navigate to the dashboard
        const returnUrl = location.state?.returnUrl || CARRIER_PORTAL_ROUTES.DASHBOARD;
        navigate(returnUrl, { replace: true });
      }
    } catch (err: any) {
      // If login fails, set the error message
      setError(err.message || 'Login failed');
    } finally {
      // Set loading to false after login attempt
      setLoading(false);
    }
  };

  // Define handleMfaVerification function to process MFA verification
  const handleMfaVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call the verifyMfa function from the authentication context
      await verifyMfa(email, mfaCode);
      // If MFA verification is successful, navigate to the dashboard
      const returnUrl = location.state?.returnUrl || CARRIER_PORTAL_ROUTES.DASHBOARD;
      navigate(returnUrl, { replace: true });
    } catch (err: any) {
      // If MFA verification fails, set the error message
      setError(err.message || 'MFA verification failed');
    } finally {
      // Set loading to false after MFA verification attempt
      setLoading(false);
    }
  };

  // Define handleForgotPassword function to navigate to forgot password page
  const handleForgotPassword = () => {
    navigate(AUTH_ROUTES.FORGOT_PASSWORD);
  };

  // Check for return URL in location state for post-login redirection
  useEffect(() => {
    const returnUrl = location.state?.returnUrl;
    if (returnUrl) {
      console.log('Return URL:', returnUrl);
    }
  }, [location.state?.returnUrl]);

  // Render login form with email and password fields when not in MFA mode
  if (!mfaVerification) {
    return (
      <LoginContainer>
        <LoginCard>
          <LoginHeader>
            <LogoContainer>
              <Logo src="/logo.png" alt="Freight Optimization Logo" />
            </LogoContainer>
            <LoginTitle>Carrier Portal</LoginTitle>
            <LoginSubtitle>Sign in to your account</LoginSubtitle>
          </LoginHeader>
          <Form
            initialValues={{ email: '', password: '' }}
            validationSchema={{
              email: (value: string) => loginValidationSchema.fields.email.isValidSync(value) || loginValidationSchema.fields.email.validateSync(value),
              password: (value: string) => loginValidationSchema.fields.password.isValidSync(value) || loginValidationSchema.fields.password.validateSync(value),
            }}
            onSubmit={async () => {
              await handleLogin();
            }}
          >
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ForgotPasswordLink type="button" onClick={handleForgotPassword}>
              Forgot Password?
            </ForgotPasswordLink>
            <ButtonContainer>
              <Button type="submit" fullWidth isLoading={loading}>
                Log In
              </Button>
            </ButtonContainer>
          </Form>
        </LoginCard>
      </LoginContainer>
    );
  }

  // Render MFA verification form when in MFA mode
  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <LoginTitle>Verify MFA Code</LoginTitle>
          <LoginSubtitle>Enter the code from your authenticator app</LoginSubtitle>
        </LoginHeader>
        <Form
          initialValues={{ mfaCode: '' }}
          validationSchema={{
            mfaCode: (value: string) => mfaValidationSchema.fields.mfaCode.isValidSync(value) || mfaValidationSchema.fields.mfaCode.validateSync(value),
          }}
          onSubmit={async () => {
            await handleMfaVerification();
          }}
        >
          <Input
            label="MFA Code"
            type="text"
            name="mfaCode"
            placeholder="Enter MFA code"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            required
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <ButtonContainer>
            <Button type="submit" fullWidth isLoading={loading}>
              Verify
            </Button>
          </ButtonContainer>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;