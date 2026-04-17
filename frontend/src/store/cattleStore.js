import { create } from 'zustand';
import ApiService from '../services/api';
import FirebaseService from '../services/firebase';

const useCattleStore = create((set, get) => ({
  // State
  cattle: [],
  selectedCattle: null,
  isLoading: false,
  error: null,
  
  // Actions
  fetchCattle: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Try API first, fallback to Firebase
      let cattleData = [];
      try {
        cattleData = await ApiService.getCattle();
      } catch (apiError) {
        console.log('API failed, trying Firebase...', apiError);
        cattleData = await FirebaseService.getCollection('cattle');
      }
      
      set({ cattle: cattleData, isLoading: false });
    } catch (error) {
      set({ 
        cattle: [], 
        isLoading: false, 
        error: 'Failed to fetch cattle data' 
      });
    }
  },
  
  fetchCattleDetail: async (tagId) => {
    set({ isLoading: true, error: null });
    
    try {
      let cattleDetail = null;
      try {
        cattleDetail = await ApiService.getCattleDetail(tagId);
      } catch (apiError) {
        console.log('API failed, trying Firebase...', apiError);
        const cattle = await FirebaseService.getDocument('cattle', tagId);
        if (cattle) {
          // Get related data from Firebase
          const healthEvents = await FirebaseService.queryDocuments('health_events', 'cattle_id', '==', tagId);
          const milkRecords = await FirebaseService.queryDocuments('milk_records', 'cattle_id', '==', tagId);
          const aiEvents = await FirebaseService.queryDocuments('ai_events', 'cattle_id', '==', tagId);
          
          cattleDetail = {
            cattle,
            health_events: healthEvents,
            milk_records: milkRecords,
            reproduction_events: aiEvents,
            latest_reading: null // Would need to implement sensor readings
          };
        }
      }
      
      set({ selectedCattle: cattleDetail, isLoading: false });
    } catch (error) {
      set({ 
        selectedCattle: null, 
        isLoading: false, 
        error: 'Failed to fetch cattle details' 
      });
    }
  },
  
  createCattle: async (cattleData) => {
    set({ isLoading: true, error: null });
    
    try {
      let success = false;
      try {
        await ApiService.createCattle(cattleData);
        success = true;
      } catch (apiError) {
        console.log('API failed, trying Firebase...', apiError);
        const newCattle = {
          ...cattleData,
          status: 'healthy',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        success = await FirebaseService.createDocument('cattle', cattleData.tag_id, newCattle);
      }
      
      if (success) {
        // Refresh cattle list
        await get().fetchCattle();
        set({ isLoading: false });
        return true;
      } else {
        throw new Error('Failed to create cattle');
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: 'Failed to create cattle record' 
      });
      return false;
    }
  },
  
  updateCattle: async (tagId, cattleData) => {
    set({ isLoading: true, error: null });
    
    try {
      let success = false;
      try {
        await ApiService.updateCattle(tagId, cattleData);
        success = true;
      } catch (apiError) {
        console.log('API failed, trying Firebase...', apiError);
        const updateData = {
          ...cattleData,
          updated_at: new Date().toISOString()
        };
        success = await FirebaseService.updateDocument('cattle', tagId, updateData);
      }
      
      if (success) {
        // Refresh cattle list
        await get().fetchCattle();
        set({ isLoading: false });
        return true;
      } else {
        throw new Error('Failed to update cattle');
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: 'Failed to update cattle record' 
      });
      return false;
    }
  },
  
  deleteCattle: async (tagId) => {
    set({ isLoading: true, error: null });
    
    try {
      let success = false;
      try {
        await ApiService.deleteCattle(tagId);
        success = true;
      } catch (apiError) {
        console.log('API failed, trying Firebase...', apiError);
        success = await FirebaseService.deleteDocument('cattle', tagId);
      }
      
      if (success) {
        // Refresh cattle list
        await get().fetchCattle();
        set({ isLoading: false });
        return true;
      } else {
        throw new Error('Failed to delete cattle');
      }
    } catch (error) {
      set({ 
        isLoading: false, 
        error: 'Failed to delete cattle record' 
      });
      return false;
    }
  },
  
  clearSelectedCattle: () => {
    set({ selectedCattle: null });
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  // Subscribe to real-time updates
  subscribeToCattleUpdates: () => {
    return FirebaseService.subscribeToCollection('cattle', (cattleData) => {
      set({ cattle: cattleData });
    });
  },
}));

export default useCattleStore;
