import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuthStore } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.primary,
    background: theme.background,
    card: theme.surface,
    text: theme.text,
    border: theme.textSecondary,
    notification: theme.danger || theme.primary,
  },
};

export default function App() {
  const { checkLoginStatus } = useAuthStore();

  useEffect(() => {
    // Check login status on app start
    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" backgroundColor={theme.primary} />
      <AppNavigator />
    </NavigationContainer>
  );
}
