import React, { useState, useEffect } from 'react'; // React v18.2.0
import { useNavigate, useLocation, Link } from 'react-router-dom'; // react-router-dom ^6.4.3
import styled from 'styled-components'; // styled-components ^5.3.6

import { useAuthContext } from '../../../common/contexts/AuthContext';
import { LoginRequest } from '../../../common/interfaces/auth.interface';
import Form from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Container from '../../../shared/components/layout/Container';
import { SHIPPER_PORTAL_ROUTES, AUTH_ROUTES } from '../../../common/constants/routes';

// Define initial values for the login form
const initialValues = { email: '', password: '', rememberMe: false };

// Define initial values for the MFA verification form
const mfaInitialValues = { mfaCode: '' };

// Define validation schema for the login form fields
const validationSchema = { email: emailValidator, password: passwordValidator };

// Define validation schema for the MFA verification form
const mfaValidationSchema = { mfaCode: mfaCodeValidator };

// Interface for MFA verification form values
interface MfaFormValues {
  mfaCode: string;
}

// Styled container for the login page
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.light};
`;

// Styled card containing the login form
const LoginCard = styled.div`
  width: 100%;
  max-width: 450px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background.white};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

// Styled header for the login form
const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

// Styled logo component
const Logo = styled.img`
  width: 180px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// Styled title component
const Title = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.xl};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

// Styled subtitle component
const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fonts.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

// Styled link for forgot password
const ForgotPasswordLink = styled(Link)`
  display: block;
  text-align: right;
  margin-top: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fonts.size.sm};
  &:hover {
    text-decoration: underline;
  }
`;

// Container for remember me checkbox
const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// Styled error message component
const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.error};
  background-color: ${({ theme }) => theme.colors.semantic.error}10;
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fonts.size.sm};
`;

/**
 * Login page component that handles user authentication
 */
const LoginPage: React.FC = () => {
  // Get authentication context using useAuthContext hook
  const { authState, login, verifyMfa, isAuthenticated, error } = useAuthContext();

  // Get navigation and location hooks from React Router
  const navigate = useNavigate();
  const location = useLocation();

  // Set up state for MFA verification if needed
  const [mfaVerificationRequired, setMfaVerificationRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);

  // Set up state for remembering user email
  const [rememberedEmail, setRememberedEmail] = useState('');

  // Check for redirect URL from location state
  const redirectUrl = location.state?.from || SHIPPER_PORTAL_ROUTES.DASHBOARD;

  // Define validation schema for login form
  const validationSchema = {
    email: emailValidator,
    password: passwordValidator,
  };

  // Define form submission handler that calls login function
  const handleSubmit = async (values: typeof initialValues) => {
    try {
      const response = await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });

      if (response.mfaRequired) {
        // MFA is required, set state to show MFA verification form
        setMfaVerificationRequired(true);
        setMfaUserId(response.user.id);
        setRememberedEmail(values.email);
      } else {
        // Login successful, redirect to dashboard
        navigate(redirectUrl, { replace: true });
      }
    } catch (loginError: any) {
      // Handle login error
      console.error('Login failed:', loginError);
    }
  };

  // Define MFA verification handler if MFA is required
  const handleMfaVerification = async (values: MfaFormValues) => {
    if (!mfaUserId) {
      console.error('MFA User ID is missing.');
      return;
    }

    try {
      await verifyMfa(mfaUserId, values.mfaCode);
      // MFA verification successful, redirect to dashboard
      navigate(redirectUrl, { replace: true });
    } catch (mfaError: any) {
      // Handle MFA verification error
      console.error('MFA verification failed:', mfaError);
    }
  };

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Render login form with email and password fields
  if (!mfaVerificationRequired) {
    return (
      <LoginContainer>
        <Container maxWidth="sm">
          <LoginCard>
            <LoginHeader>
              <Logo src="/images/logo.svg" alt="Freight Optimization Logo" />
              <Title>Shipper Portal</Title>
              <Subtitle>Sign in to your account</Subtitle>
            </LoginHeader>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <Form
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                defaultValue={rememberedEmail}
              />
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
              />
              <ForgotPasswordLink to={AUTH_ROUTES.FORGOT_PASSWORD}>
                Forgot Password?
              </ForgotPasswordLink>
              <Button type="submit" fullWidth disabled={authState?.loading}>
                {authState?.loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form>
          </LoginCard>
        </Container>
      </LoginContainer>
    );
  }

  // Render MFA verification form if MFA is required
  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <LoginCard>
          <LoginHeader>
            <Logo src="/images/logo.svg" alt="Freight Optimization Logo" />
            <Title>Two-Factor Verification</Title>
            <Subtitle>Enter the code from your authenticator app</Subtitle>
          </LoginHeader>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Form
            initialValues={mfaInitialValues}
            validationSchema={mfaValidationSchema}
            onSubmit={handleMfaVerification}
          >
            <Input
              label="MFA Code"
              type="text"
              name="mfaCode"
              placeholder="Enter MFA code"
              required
            />
            <Button type="submit" fullWidth disabled={authState?.loading}>
              {authState?.loading ? 'Verifying...' : 'Verify'}
            </Button>
          </Form>
        </LoginCard>
      </Container>
    </LoginContainer>
  );
};

// Validation function for email
function emailValidator(value: string): boolean | string {
  if (!value) {
    return 'Email is required';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email format';
  }
  return true;
}

// Validation function for password
function passwordValidator(value: string): boolean | string {
  if (!value) {
    return 'Password is required';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return true;
}

// Validation function for MFA code
function mfaCodeValidator(value: string): boolean | string {
  if (!value) {
    return 'MFA code is required';
  }
  if (!/^\d{6}$/.test(value)) {
    return 'MFA code must be 6 digits';
  }
  return true;
}

export default LoginPage;