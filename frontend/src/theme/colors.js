// Updated colors with overweight and underweight statuses
export const colors = {
  primary: '#2D6A4F',
  secondary: '#52B788',
  accent: '#F4A261',
  danger: '#E63946',
  underweight: '#FFB74D',
  overweight: '#FF5252',
  background: '#F1F8F4',
  surface: '#FFFFFF',
  text: '#1B2D1A',
  textSecondary: '#8A9E94',
  // Status colors
  healthy: '#52B788', // Leaf Green
  warning: '#F4A261', // Amber
  critical: '#E63946', // Red
  inHeat: '#F4A261', // Amber
  pregnant: '#2D6A4F', // Forest Green
  dry: '#8A9E94', // Sage Grey
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
  overweight: colors.overweight,
  underweight: colors.underweight,
};
