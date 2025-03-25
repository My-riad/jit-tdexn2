/**
 * animations.ts
 * 
 * Defines reusable animations and transitions for the AI-driven Freight Optimization Platform.
 * This file exports keyframe animations, transition durations, and easing functions that
 * create consistent and smooth motion effects throughout the application.
 */

import { keyframes, css } from 'styled-components'; // styled-components ^5.3.6

// Fade animations
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Slide animations - horizontal
export const slideInFromRight = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`;

export const slideOutToRight = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
`;

export const slideInFromLeft = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`;

export const slideOutToLeft = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
`;

// Slide animations - vertical
export const slideInFromTop = keyframes`
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
`;

export const slideOutToTop = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-100%);
  }
`;

export const slideInFromBottom = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
`;

export const slideOutToBottom = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
`;

// Utility animations
export const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const progressBar = keyframes`
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
`;

export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

export const scale = keyframes`
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
`;

// Standard transition durations
export const transitionDurations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Standard easing functions
export const easings = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard easing curve for most animations
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Acceleration curve - quick at the end
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Deceleration curve - slow at the end
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',     // Sharp curve for quick transitions
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bounce effect for playful animations
};