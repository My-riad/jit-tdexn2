import React from 'react';
import styled from 'styled-components';
import Footer from '../../../../shared/components/layout/Footer';
import { theme } from '../../../../shared/styles/theme';
import { mediaQueries } from '../../../../shared/styles/mediaQueries';

/**
 * Interface for footer navigation links
 */
interface FooterLink {
  id: string;
  label: string;
  path: string;
  external?: boolean;
}

/**
 * Navigation links for the carrier footer
 */
const CARRIER_FOOTER_LINKS: FooterLink[] = [
  { id: 'terms', label: 'Terms of Service', path: '/terms', external: false },
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy', external: false },
  { id: 'help', label: 'Help Center', path: '/help', external: false },
  { id: 'contact', label: 'Contact Us', path: '/contact', external: false },
];

/**
 * Props for the CarrierFooter component
 */
interface CarrierFooterProps {
  className?: string;
}

/**
 * Styled wrapper for the carrier-specific footer
 */
const StyledFooter = styled(Footer)`
  background-color: ${theme.colors.background.secondary};
  color: ${theme.colors.text.primary};
  padding: ${theme.spacing.md} 0;
  box-shadow: 0 -1px 4px ${theme.colors.shadow.light};
  
  ${mediaQueries.down('sm')} {
    padding: ${theme.spacing.sm} 0;
  }
`;

/**
 * A carrier-specific footer component that extends the shared Footer component with
 * carrier-specific styling and content.
 */
const CarrierFooter: React.FC<CarrierFooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <StyledFooter
      companyName="Freight Optimization"
      links={CARRIER_FOOTER_LINKS}
      copyrightYear={currentYear}
      className={className}
    />
  );
};

export default CarrierFooter;