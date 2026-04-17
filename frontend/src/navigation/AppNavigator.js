import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store';
import { colors } from '../theme';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CattleListScreen from '../screens/cattle/CattleListScreen';
import CattleDetailScreen from '../screens/cattle/CattleDetailScreen';
import AddCattleScreen from '../screens/cattle/AddCattleScreen';
import EditCattleScreen from '../screens/cattle/EditCattleScreen';
import AlertsListScreen from '../screens/alerts/AlertsListScreen';
import MilkSummaryScreen from '../screens/milk/MilkSummaryScreen';
import LogMilkScreen from '../screens/milk/LogMilkScreen';
import HeatDetectionScreen from '../screens/repro/HeatDetectionScreen';
import PregnancyTrackerScreen from '../screens/repro/PregnancyTrackerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab navigator for main app
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.textSecondary,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.surface,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Cattle" 
        component={CattleListScreen}
        options={{
          title: 'Cattle',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🐄</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsListScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🚨</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Milk" 
        component={MilkSummaryScreen}
        options={{
          title: 'Milk',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🥛</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Repro" 
        component={HeatDetectionScreen}
        options={{
          title: 'Repro',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💕</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack navigator for cattle module
const CattleStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CattleList" 
        component={CattleListScreen}
        options={{ title: 'Cattle Registry' }}
      />
      <Stack.Screen 
        name="CattleDetail" 
        component={CattleDetailScreen}
        options={{ title: 'Cattle Details' }}
      />
      <Stack.Screen 
        name="AddCattle" 
        component={AddCattleScreen}
        options={{ title: 'Add Cattle' }}
      />
      <Stack.Screen 
        name="EditCattle" 
        component={EditCattleScreen}
        options={{ title: 'Edit Cattle' }}
      />
    </Stack.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const { isLoggedIn, checkLoginStatus } = useAuthStore();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CattleStack" 
        component={CattleStackNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LogMilk" 
        component={LogMilkScreen}
        options={{ title: 'Log Milk Session' }}
      />
      <Stack.Screen 
        name="PregnancyTracker" 
        component={PregnancyTrackerScreen}
        options={{ title: 'Pregnancy Tracker' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
