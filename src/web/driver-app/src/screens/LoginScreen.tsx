import React from 'react'; // React v18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.1.6
import styled from 'styled-components'; // styled-components v5.3.6

import useAuth from '../../../common/hooks/useAuth';
import useForm from '../../../common/hooks/useForm';
import { AuthNavigationProp } from '../navigation/types';
import Input from '../../../shared/components/forms/Input';
import Button from '../../../shared/components/buttons/Button';
import Link from '../../../shared/components/typography/Link';
import LoadingIndicator from '../../../shared/components/feedback/LoadingIndicator';

// Styled components for the login screen
const LoginContainer = styled.View`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background.primary};
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

const ForgotPasswordContainer = styled.View`
  alignItems: flex-end;
  marginBottom: ${({ theme }) => theme.spacing.md};
`;

const ButtonContainer = styled.View`
  marginTop: ${({ theme }) => theme.spacing.md};
  marginBottom: ${({ theme }) => theme.spacing.lg};
`;

const SignUpContainer = styled.View`
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

// Initial values for the login form
const initialValues = {
  email: '',
  password: '',
};

// Validation schema for the login form
const validationSchema = {
  email: (value: string) =>
    !value
      ? 'Email is required'
      : !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
      ? 'Invalid email address'
      : true,
  password: (value: string) =>
    !value
      ? 'Password is required'
      : value.length < 8
      ? 'Password must be at least 8 characters'
      : true,
};

/**
 * Component that renders the login screen for driver authentication
 * @returns The rendered login screen component
 */
const LoginScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // Get authentication functions and state from useAuth hook
  const { login, error, loading } = useAuth();

  // Initialize form state and validation using useForm hook
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useForm({
      initialValues,
      validationSchema,
      onSubmit: async (values) => {
        // Handle form submission by calling login function with form values
        try {
          await login({
            email: values.email,
            password: values.password,
            rememberMe: true, // Set rememberMe to true
          });
          // If login is successful, navigate to the Main screen
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (e) {
          // Handle login errors
          console.error('Login failed', e);
        }
      },
    });

  // Render the login form with company logo
  return (
    <LoginContainer>
      <LogoContainer>
        <Logo source={require('../../../../assets/logo.png')} />
      </LogoContainer>
      <FormContainer>
        {/* Display error message if authentication fails */}
        {error && <ErrorText>{error}</ErrorText>}

        {/* Render email input field with validation */}
        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your email"
          error={touched.email && errors.email}
          required
        />

        {/* Render password input field with validation */}
        <Input
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your password"
          error={touched.password && errors.password}
          required
        />

        {/* Render forgot password link */}
        <ForgotPasswordContainer>
          <Link href="/forgot-password">Forgot Password?</Link>
        </ForgotPasswordContainer>

        {/* Render login button with loading state */}
        <ButtonContainer>
          <Button
            fullWidth
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <LoadingIndicator /> : 'Log In'}
          </Button>
        </ButtonContainer>

        {/* Render registration link for new users */}
        <SignUpContainer>
          Don't have an account?
          <Link href="/register">Sign Up</Link>
        </SignUpContainer>
      </FormContainer>
    </LoginContainer>
  );
};

export default LoginScreen;