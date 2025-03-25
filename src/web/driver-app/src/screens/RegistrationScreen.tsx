import React, { useState, useEffect } from 'react'; // React v18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.1.6
import styled from 'styled-components'; // styled-components v5.3.6

import useForm from '../../../common/hooks/useForm';
import { isEmail, isPhone, isRequired, isMinLength } from '../../../common/utils/validators';
import { AuthNavigationProp } from '../navigation/types';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Link from '../../../shared/components/typography/Link';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';
import { register } from '../../../common/services/authService';

// Styled components for the registration screen
const RegistrationContainer = styled.View`
  flex: 1;
  backgroundColor: ${({ theme }) => theme.colors.background.primary};
  padding: ${({ theme }) => theme.spacing.lg};
  justifyContent: center;
`;

const LogoContainer = styled.View`
  alignItems: center;
  marginBottom: ${({ theme }) => theme.spacing.xl};
`;

const Logo = styled.Image`
  width: 200;
  height: 80;
  resizeMode: contain;
`;

const FormContainer = styled.View`
  width: 100%;
`;

const ButtonContainer = styled.View`
  marginTop: ${({ theme }) => theme.spacing.md};
  marginBottom: ${({ theme }) => theme.spacing.lg};
`;

const LoginContainer = styled.View`
  flexDirection: row;
  justifyContent: center;
  alignItems: center;
`;

const ErrorText = styled.Text`
  color: ${({ theme }) => theme.colors.text.error};
  textAlign: center;
  marginBottom: ${({ theme }) => theme.spacing.md};
  fontSize: ${({ theme }) => theme.fonts.size.sm};
`;

const ScrollView = styled.ScrollView`
  flex: 1;
  width: 100%;
`;

// Initial values for the registration form
const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

// Validation schema for the registration form
const validationSchema = {
  firstName: (value: string) => isRequired(value) || 'First name is required',
  lastName: (value: string) => isRequired(value) || 'Last name is required',
  email: (value: string) => isRequired(value) || isEmail(value) || 'Invalid email address',
  phone: (value: string) => isRequired(value) || isPhone(value) || 'Invalid phone number',
  password: (value: string) => isRequired(value) || isMinLength(value, 8) || 'Password must be at least 8 characters',
  confirmPassword: (value: string, values: any) => isRequired(value) || (value !== values.password ? 'Passwords do not match' : true),
};

/**
 * Component that renders the registration screen for new driver account creation
 * @returns The rendered registration screen component
 */
const RegistrationScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // Initialize state for registration process loading and error
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Initialize form state and validation using useForm hook
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isSubmitting,
  } = useForm({
    initialValues,
    validationSchema,
    onSubmit: async (formValues) => {
      // Handle form submission by calling register function with form values
      try {
        // Show loading state during registration process
        setRegistrationError(null);
        // Call the register function from authService
        await register({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          password: formValues.password,
          phone: formValues.phone,
        });

        // Handle registration success by navigating to login screen
        navigation.navigate('Login');
      } catch (error: any) {
        // Handle registration errors by displaying error message
        console.error('Registration failed:', error);
        setRegistrationError(error.message || 'Registration failed. Please try again.');
      }
    },
  });

  // Render the registration form with company logo
  return (
    <RegistrationContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <LogoContainer>
          <Logo source={require('../../../../assets/logo.png')} />
        </LogoContainer>

        {/* Display error message if registration fails */}
        {registrationError && (
          <ErrorText>{registrationError}</ErrorText>
        )}

        <FormContainer>
          {/* Render input fields for first name, last name, email, phone, password, and confirm password with validation */}
          <Input
            label="First Name"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
          />
          <Input
            label="Last Name"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Phone Number"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />

          {/* Render registration button with loading state */}
          <ButtonContainer>
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingIndicator size="sm" color="#fff" />
              ) : (
                'Register'
              )}
            </Button>
          </ButtonContainer>

          {/* Render login link for existing users */}
          <LoginContainer>
            <Link href="#" onPress={() => navigation.navigate('Login')}>
              Already have an account? Log In
            </Link>
          </LoginContainer>
        </FormContainer>
      </ScrollView>
    </RegistrationContainer>
  );
};

// Export the registration screen component for use in navigation
export default RegistrationScreen;