import React, { useState } from 'react'; // React v18.2.0
import { useNavigate } from 'react-router-dom'; // react-router-dom ^6.8.0
import styled from 'styled-components'; // styled-components ^5.3.6
import * as Yup from 'yup'; // Library for object schema validation

import { useAuthContext } from '../../../common/contexts/AuthContext';
import Form, { useFormContext } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Container from '../../../shared/components/layout/Container';
import { AUTH_ROUTES } from '../../../common/constants/routes';
import { PasswordResetRequest } from '../../../common/interfaces/auth.interface';

/**
 * Interface for forgot password form values
 */
interface ForgotPasswordFormValues {
  email: string;
}

/**
 * Styled container for the forgot password page
 */
const ForgotPasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

/**
 * Styled card containing the forgot password form
 */
const ForgotPasswordCard = styled.div`
  width: 100%;
  max-width: 450px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

/**
 * Styled header for the forgot password form
 */
const ForgotPasswordHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/**
 * Styled title for the forgot password form
 */
const ForgotPasswordTitle = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.xl};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Styled subtitle for the forgot password form
 */
const ForgotPasswordSubtitle = styled.p`
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
 * Styled success message container
 */
const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.semantic.success}10;
  color: ${({ theme }) => theme.colors.semantic.success};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

/**
 * Styled link for back to login
 */
const BackToLoginLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: ${({ theme }) => theme.fonts.size.sm};
  text-align: center;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.md};
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

/**
 * Styled container for the submit button
 */
const ButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;

/**
 * Forgot password page component for carrier portal
 */
const ForgotPasswordPage: React.FC = () => {
  // Initialize state for loading status and success message
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get authentication context using useAuthContext hook
  const { forgotPassword } = useAuthContext();

  // Get navigation hook from React Router
  const navigate = useNavigate();

  // Define form validation schema for email
  const forgotPasswordValidationSchema = Yup.object().shape({
    email: Yup.string().email('Please enter a valid email address').required('Email is required'),
  });

  // Define handleSubmit function to process form submission
  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      await forgotPassword({ email: values.email });
      setSuccessMessage('A password reset link has been sent to your email address.');
    } catch (error: any) {
      console.error('Forgot password failed', error);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  // Define handleBackToLogin function to navigate to login page
  const handleBackToLogin = () => {
    navigate(AUTH_ROUTES.LOGIN);
  };

  // Render forgot password form with email field
  return (
    <ForgotPasswordContainer>
      <Container maxWidth="md">
        <ForgotPasswordCard>
          <ForgotPasswordHeader>
            <LogoContainer>
              {/* Replace with actual logo component if available */}
              <Logo src="/images/logo.svg" alt="Freight Optimization Logo" />
            </LogoContainer>
            <ForgotPasswordTitle>Forgot Password</ForgotPasswordTitle>
            <ForgotPasswordSubtitle>
              Enter your email address and we'll send you a link to reset your password.
            </ForgotPasswordSubtitle>
          </ForgotPasswordHeader>

          {/* Include success message when password reset email is sent */}
          {successMessage && (
            <SuccessMessage>
              {successMessage}
            </SuccessMessage>
          )}

          <Form
            initialValues={{ email: '' }}
            validationSchema={forgotPasswordValidationSchema}
            onSubmit={handleSubmit}
          >
            <Input
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter your email address"
              required
            />

            <ButtonContainer>
              {/* Include loading state for the submit button */}
              <Button type="submit" fullWidth disabled={loading} isLoading={loading}>
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </Button>
            </ButtonContainer>
          </Form>

          {/* Include back to login link */}
          <BackToLoginLink type="button" onClick={handleBackToLogin}>
            Back to Login
          </BackToLoginLink>
        </ForgotPasswordCard>
      </Container>
    </ForgotPasswordContainer>
  );
};

// Default export of the forgot password page component
export default ForgotPasswordPage;

// Styled components for the ForgotPasswordPage
const ForgotPasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
`;

const ForgotPasswordCard = styled.div`
  width: 100%;
  max-width: 450px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const ForgotPasswordHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ForgotPasswordTitle = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.xl};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ForgotPasswordSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fonts.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Logo = styled.img`
  height: 60px;
  width: auto;
`;

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.semantic.success}10;
  color: ${({ theme }) => theme.colors.semantic.success};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const BackToLoginLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: ${({ theme }) => theme.fonts.size.sm};
  text-align: center;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.md};
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primary.dark};
  }
`;

const ButtonContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  width: 100%;
`;