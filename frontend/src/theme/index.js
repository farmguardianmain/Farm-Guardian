import { colors, statusColors } from './colors';
import { typography } from './typography';

export const theme = {
  ...colors,
  ...typography,
  roundness: 8,
  animation: {
    scale: 1.0,
  },
};

export default theme;
export { colors, statusColors, typography };
