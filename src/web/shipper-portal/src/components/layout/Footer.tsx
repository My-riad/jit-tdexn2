import React from 'react';
import styled from 'styled-components';
import { Footer, FooterLink } from '../../../shared/components/layout/Footer';
import { theme } from '../../../shared/styles/theme';
import { SHIPPER_PORTAL_ROUTES } from '../../../common/constants/routes';

/**
 * Props for the ShipperFooter component
 */
interface ShipperFooterProps {
  className?: string;
}

/**
 * Styled extension of the base Footer component
 */
const StyledFooter = styled(Footer)`
  background-color: ${theme.colors.background.secondary};
  border-top: 1px solid ${theme.colors.border.light};
`;

/**
 * Array of footer navigation links for the shipper portal
 */
const FOOTER_LINKS: FooterLink[] = [
  { 
    id: 'privacy', 
    label: 'Privacy Policy', 
    path: SHIPPER_PORTAL_ROUTES.PRIVACY_POLICY, 
    external: false 
  },
  { 
    id: 'terms', 
    label: 'Terms of Service', 
    path: SHIPPER_PORTAL_ROUTES.TERMS_OF_SERVICE, 
    external: false 
  },
  { 
    id: 'help', 
    label: 'Help Center', 
    path: SHIPPER_PORTAL_ROUTES.HELP_CENTER, 
    external: false 
  }
];

/**
 * Company name displayed in the footer
 */
const COMPANY_NAME = 'Freight Optimization';

/**
 * A specialized footer component for the shipper portal that provides branding,
 * copyright, and navigation links
 */
const ShipperFooter: React.FC<ShipperFooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <StyledFooter
      companyName={COMPANY_NAME}
      links={FOOTER_LINKS}
      copyrightYear={currentYear}
      className={className}
    />
  );
};

export default ShipperFooter;