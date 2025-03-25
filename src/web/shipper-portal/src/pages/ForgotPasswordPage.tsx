import React, { useState } from 'react'; // React v18.2.0
import { useNavigate, Link } from 'react-router-dom'; // React Router v6.8.0
import styled from 'styled-components'; // styled-components v5.3.6

import { useAuthContext } from '../../../common/contexts/AuthContext';
import { PasswordResetRequest } from '../../../common/interfaces/auth.interface';
import Form, { FormProps } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Container from '../../../shared/components/layout/Container';
import { AUTH_ROUTES } from '../../../common/constants/routes';
import { emailValidator } from '../../../shared/utils/validators';

/**
 * @dev initialValues - Initial values for the forgot password form
 */
const initialValues = { email: '' };

/**
 * @dev validationSchema - Validation schema for the forgot password form fields
 */
const validationSchema = { email: emailValidator };

/**
 * @dev ForgotPasswordContainer - Styled container for the forgot password page
 */
const ForgotPasswordContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.light};
`;

/**
 * @dev ForgotPasswordCard - Styled card containing the forgot password form
 */
const ForgotPasswordCard = styled.div`
  width: 100%;
  max-width: 450px;
  padding: ${({ theme }) => theme.spacing.xl};
  background-color: ${({ theme }) => theme.colors.background.white};
  border-radius: ${({ theme }) => theme.borders.radius.lg};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  margin: ${({ theme }) => theme.spacing.xl} 0;
`;

/**
 * @dev ForgotPasswordHeader - Styled header for the forgot password form
 */
const ForgotPasswordHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/**
 * @dev Logo - Styled logo component
 */
const Logo = styled.img`
  width: 180px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/**
 * @dev Title - Styled title component
 */
const Title = styled.h1`
  font-size: ${({ theme }) => theme.fonts.size.xl};
  font-weight: ${({ theme }) => theme.fonts.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/**
 * @dev Subtitle - Styled subtitle component
 */
const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fonts.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

/**
 * @dev BackToLoginLink - Styled link for back to login
 */
const BackToLoginLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fonts.size.sm};
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * @dev SuccessMessage - Styled success message component
 */
const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.semantic.success};
  background-color: ${({ theme }) => theme.colors.semantic.success}10;
  border: 1px solid ${({ theme }) => theme.colors.semantic.success};
  border-radius: ${({ theme }) => theme.borders.radius.md};
  padding: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.fonts.size.sm};
`;

/**
 * @dev ErrorMessage - Styled error message component
 */
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
 * @dev ForgotPasswordPage - Forgot password page component that handles password reset request
 * @returns Rendered forgot password page component
 */
const ForgotPasswordPage: React.FC = () => {
  // LD1: Get authentication context using useAuthContext hook
  const { forgotPassword } = useAuthContext();

  // LD1: Get navigation hook from React Router
  const navigate = useNavigate();

  // LD1: Set up state for form submission status and success message
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LD1: Define form submission handler that calls forgotPassword function
  const handleSubmit = async (values: { email: string }) => {
    try {
      setErrorMessage(null);
      await forgotPassword(values as PasswordResetRequest);
      setIsSubmitted(true);
      setSuccessMessage('Check your email for a password reset link.');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to request password reset.');
      setIsSubmitted(false);
      setSuccessMessage(null);
    }
  };

  // LD1: Render forgot password form with email field
  return (
    <ForgotPasswordContainer>
      <Container maxWidth="md">
        <ForgotPasswordCard>
          <ForgotPasswordHeader>
            <Logo src="/logo.png" alt="Freight Optimization Logo" />
            <Title>Forgot Password</Title>
            <Subtitle>Enter your email to reset your password.</Subtitle>
          </ForgotPasswordHeader>

          {/* LD1: Show loading state during submission */}
          {isSubmitted ? (
            <>
              {/* LD1: Display success message after successful submission */}
              {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
              <BackToLoginLink to={AUTH_ROUTES.LOGIN}>Back to Login</BackToLoginLink>
            </>
          ) : (
            <Form
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {/* LD1: Display error message if submission fails */}
              {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
              <Input
                type="email"
                name="email"
                label="Email"
                placeholder="Enter your email"
                required
              />
              <Button type="submit" fullWidth>
                Reset Password
              </Button>
              <BackToLoginLink to={AUTH_ROUTES.LOGIN}>Back to Login</BackToLoginLink>
            </Form>
          )}
        </ForgotPasswordCard>
      </Container>
    </ForgotPasswordContainer>
  );
};

export default ForgotPasswordPage;