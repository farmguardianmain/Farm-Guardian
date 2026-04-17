import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set, get) => ({
  // State
  isLoggedIn: false,
  isLoading: false,
  error: null,
  
  // Demo credentials
  DEMO_EMAIL: 'farm@farmguardian.app',
  DEMO_PASSWORD: 'herd',
  
  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check demo credentials
      if (email === get().DEMO_EMAIL && password === get().DEMO_PASSWORD) {
        // Store login state
        await AsyncStorage.setItem('isLoggedIn', 'true');
        set({ isLoggedIn: true, isLoading: false, error: null });
        return true;
      } else {
        set({ 
          isLoggedIn: false, 
          isLoading: false, 
          error: 'Invalid email or password. Use farm@farmguardian.app / herd' 
        });
        return false;
      }
    } catch (error) {
      set({ 
        isLoggedIn: false, 
        isLoading: false, 
        error: 'Login failed. Please try again.' 
      });
      return false;
    }
  },
  
  logout: async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      set({ isLoggedIn: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  checkLoginStatus: async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      set({ isLoggedIn: isLoggedIn === 'true' });
    } catch (error) {
      console.error('Check login status error:', error);
      set({ isLoggedIn: false });
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
