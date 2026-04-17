export const typography = {
  // Font Family
  fontFamily: {
    regular: 'System', // Falls back to San Francisco on iOS, Roboto on Android
    medium: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    xxl: 28,
    xxxl: 36,
  },
  
  // Line Heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 22,
    lg: 24,
    xl: 28,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
  
  // Text Styles
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
    color: '#1B2D1A',
  },
  
  h2: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    color: '#1B2D1A',
  },
  
  body: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 22,
    color: '#1B2D1A',
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#8A9E94',
  },
  
  metric: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  
  badge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};
