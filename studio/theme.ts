import {buildLegacyTheme} from 'sanity'

/**
 * Custom Sanity Studio theme matching the frontend color scheme
 * Colors sourced from frontend/src/styles/tokens.css
 */

// Frontend color palette
const frontendColors = {
  white: '#ffffff',
  blue: '#1B198F', // Primary brand & text color
  red: '#FB534B', // Accent/link color
  yellow: '#DB901B', // Warning color
  green: '#00B39A', // Success color
  greenTint: '#E6F7F5', // Very light green tint for list items
  gray: '#666666', // Neutral
  surface: '#f8f9fa', // Light background variant
}

export const rkmfTheme = buildLegacyTheme({
  // Base colors
  '--black': frontendColors.blue,
  '--white': frontendColors.white,
  '--gray': frontendColors.gray,
  '--gray-base': frontendColors.gray,

  // Component styling
  '--component-bg': frontendColors.white,
  '--component-text-color': frontendColors.blue,

  // Brand colors
  '--brand-primary': frontendColors.blue,

  // Button colors
  '--default-button-color': frontendColors.gray,
  '--default-button-primary-color': frontendColors.blue,
  '--default-button-success-color': frontendColors.green,
  '--default-button-warning-color': frontendColors.yellow,
  '--default-button-danger-color': frontendColors.red,

  // State colors
  '--state-info-color': frontendColors.blue,
  '--state-success-color': frontendColors.green,
  '--state-warning-color': frontendColors.yellow,
  '--state-danger-color': frontendColors.red,

  // Navigation
  '--main-navigation-color': frontendColors.blue,
  '--main-navigation-color--inverted': frontendColors.white,

  // Focus states
  '--focus-color': frontendColors.blue,
})
