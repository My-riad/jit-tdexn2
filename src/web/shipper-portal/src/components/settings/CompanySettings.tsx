# src/web/shipper-portal/src/components/settings/CompanySettings.tsx
```typescript
import React, { useState, useEffect } from 'react'; // React v18.2.0
import styled from 'styled-components'; // styled-components v5.3.6

import Card from '../../../shared/components/cards/Card';
import Form, { useFormContext } from '../../../shared/components/forms/Form';
import Input from '../../../shared/components/forms/Input';
import Select from '../../../shared/components/forms/Select';
import TextArea from '../../../shared/components/forms/TextArea';
import FileUpload from '../../../shared/components/forms/FileUpload';
import Button from '../../../shared/components/buttons/Button';
import { Shipper, ShipperType } from '../../../common/interfaces/shipper.interface';
import { Address, ContactInfo } from '../../../common/types/global.d';
import settingsService from '../../services/settingsService';
import useAuth from '../../../common/hooks/useAuth';
import useNotification from '../../../common/hooks/useNotification';

/**
 * Form values for company settings
 */
interface CompanyFormValues {
  name: string;
  shipperType: ShipperType;
  taxId: string;
  address: Address;
  contactInfo: ContactInfo;
  primaryCommodities: string[];
  paymentTerms: string;
}

/**
 * Main container for the company settings component
 */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

/**
 * Title for each settings section
 */
const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

/**
 * Container for form sections
 */
const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
`;

/**
 * Row container for form fields
 */
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * Column container for form fields
 */
const FormColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

/**
 * Container for logo upload section
 */
const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
`;

/**
 * Container for logo preview
 */
const LogoPreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.light};
`;

/**
 * Image element for logo preview
 */
const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

/**
 * Container for form buttons
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

/**
 * Options for shipper type dropdown
 */
const SHIPPER_TYPE_OPTIONS = [
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'THIRD_PARTY_LOGISTICS', label: 'Third-Party Logistics (3PL)' },
];

/**
 * Initial values for the company settings form
 */
const INITIAL_FORM_VALUES: CompanyFormValues = {
  name: '',
  shipperType: 'MANUFACTURER',
  taxId: '',
  address: {
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  },
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    notes: '',
  },
  primaryCommodities: [],
  paymentTerms: '',
};

/**
 * Validation schema for the company settings form
 */
const VALIDATION_SCHEMA: Record<string, (value: any) => boolean | string> = {
  name: (value) => !!value || 'Company name is required',
  shipperType: (value) => !!value || 'Shipper type is required',
  taxId: (value) => !!value || 'Tax ID is required',
  'address.street1': (value) => !!value || 'Street address is required',
  'address.city': (value) => !!value || 'City is required',
  'address.state': (value) => !!value || 'State is required',
  'address.zipCode': (value) => !!value || 'ZIP code is required',
  'contactInfo.name': (value) => !!value || 'Contact name is required',
  'contactInfo.email': (value) => /^[^s@]+@[^s@]+.[^s@]+$/.test(value) || 'Valid email is required',
  'contactInfo.phone': (value) => /^\d{10}$/.test(value.replace(/D/g, '')) || 'Valid phone number is required',
};

/**
 * Component for managing shipper company settings
 */
const CompanySettings: React.FC = () => {
  // Get current user and shipper ID from auth context
  const { authState } = useAuth();
  const shipperId = authState.user?.shipperId;

  // Initialize state for company data, loading status, and saving status
  const [company, setCompany] = useState<Shipper | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Initialize notification hook for displaying success/error messages
  const { showNotification } = useNotification();

  // Fetch company settings data on component mount
  useEffect(() => {
    if (shipperId) {
      setLoading(true);
      settingsService.getCompanySettings(shipperId)
        .then(data => {
          setCompany(data);
        })
        .catch(error => {
          showNotification({ type: 'error', message: 'Failed to load company settings.' });
          console.error('Error fetching company settings:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [shipperId, showNotification]);

  // Handle form submission to update company settings
  const handleSubmit = async (values: CompanyFormValues) => {
    if (!shipperId) {
      showNotification({ type: 'error', message: 'Shipper ID not found.' });
      return;
    }

    setSaving(true);
    settingsService.updateCompanySettings(shipperId, values)
      .then(updatedCompany => {
        setCompany(updatedCompany);
        showNotification({ type: 'success', message: 'Company settings updated successfully!' });
      })
      .catch(error => {
        showNotification({ type: 'error', message: 'Failed to update company settings.' });
        console.error('Error updating company settings:', error);
      })
      .finally(() => setSaving(false));
  };

  // Handle logo upload
  const handleLogoUpload = async (files: File[]) => {
    if (!shipperId) {
      showNotification({ type: 'error', message: 'Shipper ID not found.' });
      return;
    }

    if (files && files.length > 0) {
      const logoFile = files[0];
      settingsService.uploadCompanyLogo(shipperId, logoFile)
        .then(data => {
          setCompany(prevCompany => ({ ...prevCompany, logoUrl: data.logoUrl } as Shipper));
          showNotification({ type: 'success', message: 'Company logo updated successfully!' });
        })
        .catch(error => {
          showNotification({ type: 'error', message: 'Failed to upload company logo.' });
          console.error('Error uploading company logo:', error);
        });
    }
  };

  // Render form with company information fields
  return (
    <Container>
      <Card>
        {loading ? (
          <div>Loading company settings...</div>
        ) : (
          company && (
            <Form
              initialValues={{
                name: company.name || '',
                shipperType: company.shipperType || 'MANUFACTURER',
                taxId: company.taxId || '',
                address: company.address || { street1: '', street2: '', city: '', state: '', zipCode: '', country: 'US' },
                contactInfo: company.contactInfo || { name: '', email: '', phone: '', alternatePhone: '', notes: '' },
                primaryCommodities: company.primaryCommodities || [],
                paymentTerms: company.paymentTerms || '',
              }}
              validationSchema={VALIDATION_SCHEMA}
              onSubmit={handleSubmit}
            >
              <SectionTitle>Company Information</SectionTitle>
              <FormSection>
                <FormRow>
                  <FormColumn>
                    <Input label="Company Name" name="name" required />
                  </FormColumn>
                  <FormColumn>
                    <Select label="Company Type" name="shipperType" options={SHIPPER_TYPE_OPTIONS} required />
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn>
                    <Input label="Tax ID" name="taxId" required />
                  </FormColumn>
                  <FormColumn>
                    <Input label="Payment Terms" name="paymentTerms" />
                  </FormColumn>
                </FormRow>
              </FormSection>

              <SectionTitle>Address</SectionTitle>
              <FormSection>
                <Input label="Street Address 1" name="address.street1" required />
                <Input label="Street Address 2" name="address.street2" />
                <FormRow>
                  <FormColumn>
                    <Input label="City" name="address.city" required />
                  </FormColumn>
                  <FormColumn>
                    <Input label="State" name="address.state" required />
                  </FormColumn>
                </FormRow>
                <FormRow>
                  <FormColumn>
                    <Input label="ZIP Code" name="address.zipCode" required />
                  </FormColumn>
                  <FormColumn>
                    <Input label="Country" name="address.country" value="US" disabled />
                  </FormColumn>
                </FormRow>
              </FormSection>

              <SectionTitle>Contact Information</SectionTitle>
              <FormSection>
                <Input label="Contact Name" name="contactInfo.name" required />
                <Input label="Email" name="contactInfo.email" required />
                <Input label="Phone" name="contactInfo.phone" required />
                <Input label="Alternate Phone" name="contactInfo.alternatePhone" />
                <TextArea label="Notes" name="contactInfo.notes" rows={3} />
              </FormSection>

              <SectionTitle>Company Logo</SectionTitle>
              <FormSection>
                <LogoSection>
                  <LogoPreview>
                    {company.logoUrl ? (
                      <LogoImage src={company.logoUrl} alt="Company Logo" />
                    ) : (
                      <div>No Logo</div>
                    )}
                  </LogoPreview>
                  <FileUpload name="logo" accept="image/*" onChange={handleLogoUpload} />
                </LogoSection>
              </FormSection>

              <ButtonContainer>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </ButtonContainer>
            </Form>
          )
        )}
      </Card>
    </Container>
  );
};

export default CompanySettings;