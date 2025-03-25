import React, { useState } from 'react'; // React v18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.1.6
import styled from 'styled-components'; // styled-components v5.3.6

import useForm from '../../../common/hooks/useForm';
import { forgotPassword } from '../../../common/api/authApi';
import { AuthNavigationProp } from '../navigation/types';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Container from '../../../shared/components/layout/Container';
import FlexBox from '../../../shared/components/layout/FlexBox';
import Heading from '../../../shared/components/typography/Heading';
import Text from '../../../shared/components/typography/Text';

// Styled components for the ForgotPasswordScreen
const ScreenContainer = styled.View`
  flex: 1;
  backgroundColor: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.lg};
  justifyContent: center;
`;

const FormContainer = styled.View`
  width: 100%;
  marginTop: ${({ theme }) => theme.spacing.lg};
`;

const ButtonContainer = styled.View`
  marginTop: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.md};
`;

const MessageContainer = styled.View`
  marginTop: ${({ theme }) => theme.spacing.md};
  alignItems: center;
`;

const SuccessText = styled(Text)`
  color: ${({ theme }) => theme.colors.text.success};
  textAlign: center;
  marginBottom: ${({ theme }) => theme.spacing.md};
  fontSize: ${({ theme }) => theme.fonts.size.md};
`;

const ErrorText = styled(Text)`
  color: ${({ theme }) => theme.colors.text.error};
  textAlign: center;
  marginBottom: ${({ theme }) => theme.spacing.md};
  fontSize: ${({ theme }) => theme.fonts.size.sm};
`;

// Constants for validation and initial values
const validationSchema = {
  email: (value) =>
    !value
      ? 'Email is required'
      : !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      ? 'Invalid email address'
      : true,
};

const initialValues = {
  email: '',
};

/**
 * Component that renders the forgot password screen for password reset requests
 */
const ForgotPasswordScreen: React.FC = () => {
  // LD1: Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // LD1: Initialize state variables for loading, error, and success message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // LD1: Initialize form state and validation using useForm hook
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid } = useForm({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      // LD1: Handle form submission by calling forgotPassword API function with email
      setLoading(true);
      setError(null);
      try {
        // IE1: Call forgotPassword API function with email
        await forgotPassword({ email: values.email });
        // LD1: Show success message when password reset email is sent
        setSuccess(true);
      } catch (e: any) {
        // LD1: Handle error responses from API
        setError(e?.message || 'Failed to send reset email. Please try again.');
      } finally {
        // LD1: Show loading state during API request
        setLoading(false);
      }
    },
  });

  return (
    <ScreenContainer>
      <Container>
        <Heading level={2} align="center">
          Reset Password
        </Heading>
        <Text align="center">
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <FormContainer>
          {/* LD1: Render email input field with validation */}
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email ? errors.email : undefined}
            placeholder="Enter your email"
            required
          />

          <ButtonContainer>
            {/* LD1: Render submit button with loading state */}
            <Button
              onPress={handleSubmit}
              disabled={loading || !isValid}
              isLoading={loading}
              fullWidth
            >
              Send Reset Link
            </Button>
            {/* LD1: Render back to login button */}
            <Button
              variant="secondary"
              onPress={() => navigation.goBack()}
              fullWidth
            >
              Back to Login
            </Button>
          </ButtonContainer>
        </FormContainer>

        <MessageContainer>
          {/* LD1: Display success message when password reset email is sent */}
          {success && (
            <SuccessText>
              A password reset link has been sent to your email address.
            </SuccessText>
          )}
          {/* LD1: Display error message if request fails */}
          {error && <ErrorText>{error}</ErrorText>}
        </MessageContainer>
      </Container>
    </ScreenContainer>
  );
};

export default ForgotPasswordScreen;