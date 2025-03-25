import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { mediaQueries } from '../../styles/mediaQueries';
import Container from './Container';

/**
 * Interface for footer navigation links
 */
export interface FooterLink {
  id: string;
  label: string;
  path: string;
  external?: boolean;
}

/**
 * Props for the Footer component
 */
export interface FooterProps {
  companyName?: string;
  links?: FooterLink[];
  copyrightYear?: number;
  className?: string;
}

// Default values
const DEFAULT_LINKS: FooterLink[] = [];
const DEFAULT_COPYRIGHT_YEAR = new Date().getFullYear();

// Styled components
const FooterContainer = styled.footer`
  height: ${theme.sizes.footerHeight};
  width: 100%;
  background-color: ${theme.colors.background.secondary};
  border-top: ${theme.borders.width.thin} solid ${theme.colors.border.light};
  padding: ${theme.spacing.md} 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  ${mediaQueries.down('sm')} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const CompanyName = styled.p`
  margin: 0;
  font-weight: ${theme.fonts.weight.medium};
  color: ${theme.colors.text.primary};
  font-size: ${theme.fonts.size.sm};
`;

const Copyright = styled.p`
  margin: 0;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.fonts.size.xs};
`;

const LinksSection = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  flex-wrap: wrap;
  justify-content: flex-end;
  
  ${mediaQueries.down('sm')} {
    justify-content: flex-start;
  }
`;

const FooterLinkItem = styled(Link)`
  color: ${theme.colors.text.secondary};
  text-decoration: none;
  font-size: ${theme.fonts.size.sm};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${theme.colors.text.accent};
  }
`;

const ExternalLink = styled.a`
  color: ${theme.colors.text.secondary};
  text-decoration: none;
  font-size: ${theme.fonts.size.sm};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${theme.colors.text.accent};
  }
`;

/**
 * A reusable footer component that provides consistent branding, copyright information,
 * and navigation links across the AI-driven Freight Optimization Platform.
 */
const Footer: React.FC<FooterProps> = ({
  companyName = 'Freight Optimization',
  links = DEFAULT_LINKS,
  copyrightYear = DEFAULT_COPYRIGHT_YEAR,
  className,
}) => {
  return (
    <FooterContainer className={className}>
      <Container>
        <FooterContent>
          <FooterSection>
            <CompanyName>{companyName}</CompanyName>
            <Copyright>
              © {copyrightYear} {companyName}. All rights reserved.
            </Copyright>
          </FooterSection>
          
          {links.length > 0 && (
            <LinksSection>
              {links.map((link) => (
                link.external ? (
                  <ExternalLink 
                    key={link.id}
                    href={link.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} (opens in a new tab)`}
                  >
                    {link.label}
                  </ExternalLink>
                ) : (
                  <FooterLinkItem 
                    key={link.id}
                    to={link.path}
                    aria-label={link.label}
                  >
                    {link.label}
                  </FooterLinkItem>
                )
              ))}
            </LinksSection>
          )}
        </FooterContent>
      </Container>
    </FooterContainer>
  );
};

export default Footer;