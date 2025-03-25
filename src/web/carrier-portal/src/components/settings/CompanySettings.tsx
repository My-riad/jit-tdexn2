import React, { useState, useEffect } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components ^5.3.10
import { toast } from 'react-toastify'; // react-toastify ^9.1.3

import Section from '../../../shared/components/layout/Section';
import Form, { useFormContext } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import FileUpload from '../../../shared/components/forms/FileUpload';
import Button from '../../../shared/components/buttons/Button';
import settingsService from '../../../services/settingsService';
import { Carrier, CarrierUpdateParams } from '../../../common/interfaces/carrier.interface';
import { theme } from '../../../shared/styles/theme';

/**
 * @dev FormContainer - Container for the form elements
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  width: 100%;
  max-width: 800px;
`;

/**
 * @dev FormSection - Section divider for form content
 */
const FormSection = styled.div`
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

/**
 * @dev SectionTitle - Title for form sections
 */
const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
  font-weight: 600;
`;

/**
 * @dev FormRow - Row layout for form fields
 */
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${theme.spacing.md};
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * @dev FormColumn - Column layout for form fields
 */
const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

/**
 * @dev LogoPreview - Container for displaying company logo preview
 */
const LogoPreview = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.background.light};
`;

/**
 * @dev LogoImage - Image element for company logo
 */
const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

/**
 * @dev ButtonContainer - Container for form buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
  gap: ${theme.spacing.md};
`;

/**
 * @dev CompanyFormState - Interface for company form state
 */
interface CompanyFormState {
  name: string;
  dotNumber: string;
  mcNumber: string;
  taxId: string;
  address: object;
  contactInfo: object;
  carrierType: string;
  fleetSize: number;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceCoverageAmount: number;
  insuranceExpirationDate: string;
  safetyRating: string;
}

/**
 * @dev validateCompanyForm - Validates the company settings form data
 * @param values - CarrierUpdateParams
 * @returns Record<string, string> - Validation errors object
 */
const validateCompanyForm = (values: CarrierUpdateParams): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!values.name) {
    errors.name = 'Company name is required';
  }

  if (!values.dotNumber) {
    errors.dotNumber = 'DOT number is required';
  } else if (!/^\d{6,10}$/.test(values.dotNumber)) {
    errors.dotNumber = 'DOT number must be 6-10 digits';
  }

  if (!values.mcNumber) {
    errors.mcNumber = 'MC number is required';
  } else if (!/^\d{1,10}$/.test(values.mcNumber)) {
    errors.mcNumber = 'MC number must be a number with up to 10 digits';
  }

  // Basic address validation
  if (values.address) {
    if (!values.address.street1) {
      errors['address.street1'] = 'Street address is required';
    }
    if (!values.address.city) {
      errors['address.city'] = 'City is required';
    }
    if (!values.address.state) {
      errors['address.state'] = 'State is required';
    }
    if (!values.address.zipCode) {
      errors['address.zipCode'] = 'Zip code is required';
    }
  }

  // Basic contact info validation
  if (values.contactInfo) {
    if (!values.contactInfo.name) {
      errors['contactInfo.name'] = 'Contact name is required';
    }
    if (!values.contactInfo.email && !values.contactInfo.phone) {
      errors['contactInfo.email'] = 'At least one contact method (phone or email) is required';
    }
  }

  return errors;
};

/**
 * @dev CompanySettings - Component for managing carrier company settings
 * @returns Rendered company settings form
 */
const CompanySettings: React.FC = () => {
  // LD1: Initialize state for company data, loading status, and form submission status
  const [companyData, setCompanyData] = useState<Carrier | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // LD1: Fetch company settings data on component mount
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const data = await settingsService.getCompanySettings();
        setCompanyData(data);
        setIsLoading(false);
      } catch (error: any) {
        toast.error(`Failed to load company settings: ${error.message}`);
        setIsLoading(false);
      }
    };

    fetchCompanySettings();
  }, []);

  // LD1: Handle form submission to update company settings
  const handleSubmit = async (values: CarrierUpdateParams) => {
    setIsSubmitting(true);
    try {
      await settingsService.updateCompanySettings(values);
      toast.success('Company settings updated successfully!');

      if (logoFile) {
        await settingsService.uploadCompanyLogo(logoFile);
        toast.success('Company logo updated successfully!');
        // Force refresh of company data to show new logo
        const updatedData = await settingsService.getCompanySettings();
        setCompanyData(updatedData);
      }
    } catch (error: any) {
      toast.error(`Failed to update company settings: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // LD1: Handle logo file selection
  const handleLogoChange = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // LD1: Render form with company information fields
  return (
    <Section title="Company Settings">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Form
          initialValues={{
            name: companyData?.name || '',
            dotNumber: companyData?.dotNumber || '',
            mcNumber: companyData?.mcNumber || '',
            taxId: companyData?.taxId || '',
            address: companyData?.address || { street1: '', city: '', state: '', zipCode: '' },
            contactInfo: companyData?.contactInfo || { name: '', email: '', phone: '' },
          }}
          validationSchema={validateCompanyForm}
          onSubmit={handleSubmit}
        >
          <FormContainer>
            <FormSection>
              <SectionTitle>Company Information</SectionTitle>
              <Input label="Company Name" name="name" required />
              <FormRow>
                <FormColumn>
                  <Input label="DOT Number" name="dotNumber" required />
                </FormColumn>
                <FormColumn>
                  <Input label="MC Number" name="mcNumber" required />
                </FormColumn>
              </FormRow>
              <Input label="Tax ID" name="taxId" />
            </FormSection>

            <FormSection>
              <SectionTitle>Address</SectionTitle>
              <Input label="Street Address" name="address.street1" />
              <Input label="City" name="address.city" />
              <FormRow>
                <FormColumn>
                  <Input label="State" name="address.state" />
                </FormColumn>
                <FormColumn>
                  <Input label="Zip Code" name="address.zipCode" />
                </FormColumn>
              </FormRow>
            </FormSection>

            <FormSection>
              <SectionTitle>Contact Information</SectionTitle>
              <Input label="Contact Name" name="contactInfo.name" />
              <Input label="Email" name="contactInfo.email" type="email" />
              <Input label="Phone" name="contactInfo.phone" type="tel" />
            </FormSection>

            <FormSection>
              <SectionTitle>Company Logo</SectionTitle>
              <LogoPreview>
                {logoPreview ? (
                  <LogoImage src={logoPreview} alt="Company Logo" />
                ) : companyData?.logoUrl ? (
                  <LogoImage src={companyData.logoUrl} alt="Company Logo" />
                ) : (
                  <div>No logo uploaded</div>
                )}
              </LogoPreview>
              <FileUpload label="Upload New Logo" name="logo" accept="image/*" onChange={(files) => files && files[0] && handleLogoChange(files[0])} />
            </FormSection>

            <ButtonContainer>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Settings'}
              </Button>
            </ButtonContainer>
          </FormContainer>
        </Form>
      )}
    </Section>
  );
};

export default CompanySettings;