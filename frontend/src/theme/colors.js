export const colors = {
  // Primary Colors
  primary: '#2D6A4F',      // Forest Green
  secondary: '#52B788',    // Leaf Green
  
  // Accent Colors
  accent: '#F4A261',       // Amber
  danger: '#E63946',       // Red
  
  // Background Colors
  background: '#F1F8F4',   // Pale Mint
  surface: '#FFFFFF',       // White
  
  // Text Colors
  text: '#1B2D1A',         // Dark Green
  textSecondary: '#8A9E94', // Sage Grey
  
  // Status Colors
  healthy: '#52B788',      // Leaf Green
  warning: '#F4A261',      // Amber
  critical: '#E63946',     // Red
  inHeat: '#F4A261',       // Amber
  pregnant: '#2D6A4F',     // Forest Green
  dry: '#8A9E94',          // Sage Grey
  
  // Activity Colors
  active: '#52B788',       // Leaf Green
  resting: '#8A9E94',      // Sage Grey
  eating: '#F4A261',       // Amber
  ruminating: '#2D6A4F',   // Forest Green
};

export const statusColors = {
  healthy: colors.healthy,
  alert: colors.warning,
  in_heat: colors.inHeat,
  pregnant: colors.pregnant,
  dry: colors.dry,
  critical: colors.critical,
  warning: colors.warning,
  info: colors.textSecondary,
};
