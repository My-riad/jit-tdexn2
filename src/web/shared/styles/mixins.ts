import { css } from 'styled-components'; // version ^5.3.6
import { colors } from './colors';
import { mediaQueries } from './mediaQueries';

// Layout Mixins
export const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const flexBetween = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

export const absoluteFill = css`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

// Reset Mixins
export const resetButton = css`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  text-align: inherit;
  color: inherit;
`;

export const resetList = css`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const resetInput = css`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  outline: none;
`;

// Typography Mixins
export const ellipsis = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Utility Mixins
export const hideScrollbar = css`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

export const scrollbar = css`
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: ${colors.neutral.gray200};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${colors.neutral.gray400};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${colors.neutral.gray500};
  }
  scrollbar-width: thin;
  scrollbar-color: ${colors.neutral.gray400} ${colors.neutral.gray200};
`;

// Accessibility Mixins
export const focusOutline = css`
  outline: 2px solid ${colors.primary.blue};
  outline-offset: 2px;
`;

export const boxShadow = {
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

// Component Mixins
export const card = css`
  background-color: ${colors.neutral.white};
  border-radius: 8px;
  box-shadow: ${boxShadow.sm};
  padding: 16px;
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: ${boxShadow.md};
  }
`;

// Button Mixins
export const buttonBase = css`
  ${resetButton}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &:focus {
    ${focusOutline}
  }
`;

export const primaryButton = css`
  ${buttonBase}
  background-color: ${colors.primary.blue};
  color: ${colors.neutral.white};
  
  &:hover:not(:disabled) {
    background-color: ${colors.primary.blueLight};
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const secondaryButton = css`
  ${buttonBase}
  background-color: transparent;
  color: ${colors.primary.blue};
  border: 1px solid ${colors.primary.blue};
  
  &:hover:not(:disabled) {
    background-color: ${colors.transparency.blue10};
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const textButton = css`
  ${buttonBase}
  background-color: transparent;
  color: ${colors.primary.blue};
  padding: 4px 8px;
  
  &:hover:not(:disabled) {
    background-color: ${colors.transparency.blue10};
  }
`;

// Responsive Mixins
export const gridLayout = (columns = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = '16px') => css`
  display: grid;
  grid-template-columns: repeat(${columns.xs}, 1fr);
  gap: ${gap};
  
  ${mediaQueries.up('sm')} {
    grid-template-columns: repeat(${columns.sm}, 1fr);
  }
  
  ${mediaQueries.up('md')} {
    grid-template-columns: repeat(${columns.md}, 1fr);
  }
  
  ${mediaQueries.up('lg')} {
    grid-template-columns: repeat(${columns.lg}, 1fr);
  }
`;

export const truncateText = (lines = 2) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Export all mixins as a single object
export const mixins = {
  flexCenter,
  flexBetween,
  flexColumn,
  absoluteFill,
  resetButton,
  resetList,
  resetInput,
  ellipsis,
  hideScrollbar,
  scrollbar,
  focusOutline,
  boxShadow,
  visuallyHidden,
  card,
  buttonBase,
  primaryButton,
  secondaryButton,
  textButton,
  gridLayout,
  truncateText
};

export default mixins;