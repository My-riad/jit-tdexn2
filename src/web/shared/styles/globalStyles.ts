import { createGlobalStyle } from 'styled-components'; // version ^5.3.6
import { normalize } from 'styled-normalize'; // version ^8.0.7
import { colors } from './colors';
import { fonts } from './fonts';
import { mediaQueries } from './mediaQueries';
import { 
  resetButton, 
  resetList, 
  resetInput, 
  scrollbar, 
  focusOutline 
} from './mixins';

export const GlobalStyles = createGlobalStyle`
  ${normalize}
  ${fonts.fontFace}

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    height: 100%;
    width: 100%;
  }

  body {
    font-family: ${fonts.family.primary};
    font-size: ${fonts.size.body};
    font-weight: ${fonts.weight.regular};
    line-height: ${fonts.lineHeight.normal};
    color: ${colors.neutral.darkGray};
    background-color: ${colors.neutral.white};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    height: 100%;
    width: 100%;
  }

  #root {
    height: 100%;
    width: 100%;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${fonts.family.primary};
    font-weight: ${fonts.weight.bold};
    line-height: ${fonts.lineHeight.tight};
    margin-bottom: 0.5em;
    color: ${colors.neutral.darkGray};
  }

  h1 {
    font-size: ${fonts.size.h1};
    ${mediaQueries.up('md')} {
      font-size: calc(${fonts.size.h1} * 1.2);
    }
  }

  h2 {
    font-size: ${fonts.size.h2};
    ${mediaQueries.up('md')} {
      font-size: calc(${fonts.size.h2} * 1.1);
    }
  }

  h3 {
    font-size: ${fonts.size.h3};
  }

  h4 {
    font-size: ${fonts.size.h4};
  }

  h5 {
    font-size: ${fonts.size.h5};
  }

  h6 {
    font-size: ${fonts.size.h6};
  }

  p {
    margin-bottom: 1em;
    line-height: ${fonts.lineHeight.relaxed};
  }

  a {
    color: ${colors.primary.blue};
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${colors.primary.blueLight};
      text-decoration: underline;
    }

    &:focus {
      ${focusOutline}
    }
  }

  img {
    max-width: 100%;
    height: auto;
  }

  button {
    ${resetButton}

    &:focus {
      ${focusOutline}
    }
  }

  input, textarea, select {
    ${resetInput}

    &:focus {
      ${focusOutline}
    }
  }

  ul, ol {
    ${resetList}
    margin-bottom: 1em;
    padding-left: 1.5em;
  }

  code {
    font-family: ${fonts.family.mono};
    font-size: 0.9em;
    background-color: ${colors.neutral.gray200};
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  hr {
    border: 0;
    height: 1px;
    background-color: ${colors.neutral.lightGray};
    margin: 2em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  th, td {
    text-align: left;
    padding: 0.75em;
    border-bottom: 1px solid ${colors.neutral.lightGray};
  }

  th {
    font-weight: ${fonts.weight.medium};
    background-color: ${colors.neutral.gray100};
  }

  /* Custom scrollbar styling */
  body {
    ${scrollbar}
  }

  /* Accessibility utilities */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Print styles */
  @media print {
    body {
      background-color: white;
      color: black;
    }

    a {
      color: black;
      text-decoration: underline;
    }

    a[href]:after {
      content: " (" attr(href) ")";
    }

    thead {
      display: table-header-group;
    }

    tr, img {
      page-break-inside: avoid;
    }

    p, h2, h3 {
      orphans: 3;
      widows: 3;
    }

    h2, h3 {
      page-break-after: avoid;
    }
  }
`;