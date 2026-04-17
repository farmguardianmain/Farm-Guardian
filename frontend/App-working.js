import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

export default function App() {
  const { checkLoginStatus } = useAuthStore();

  useEffect(() => {
    // Check login status on app start
    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" backgroundColor={theme.primary} />
      <AppNavigator />
    </NavigationContainer>
  );
}
