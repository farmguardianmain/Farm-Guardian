// API service for communicating with FastAPI backend
import Constants from 'expo-constants';

const resolveApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (!__DEV__) {
    return 'https://your-production-url.com';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:8002`;
};

const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Cattle endpoints
  async getCattle() {
    return this.request('/cattle');
  }

  async createCattle(cattleData) {
    return this.request('/cattle', {
      method: 'POST',
      body: JSON.stringify(cattleData),
    });
  }

  async getCattleDetail(tagId) {
    return this.request(`/cattle/${tagId}`);
  }

  async updateCattle(tagId, cattleData) {
    return this.request(`/cattle/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(cattleData),
    });
  }

  async deleteCattle(tagId) {
    return this.request(`/cattle/${tagId}`, {
      method: 'DELETE',
    });
  }

  async logMilkSession(tagId, milkData) {
    return this.request(`/cattle/${tagId}/milk`, {
      method: 'POST',
      body: JSON.stringify(milkData),
    });
  }

  async addHealthEvent(tagId, healthData) {
    return this.request(`/cattle/${tagId}/health-event`, {
      method: 'POST',
      body: JSON.stringify(healthData),
    });
  }

  // Alerts endpoints
  async getAlerts(status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/alerts${query}`);
  }

  async getAlertDetail(alertId) {
    return this.request(`/alerts/${alertId}`);
  }

  async dismissAlert(alertId) {
    return this.request(`/alerts/${alertId}/dismiss`, {
      method: 'PATCH',
    });
  }

  async getAlertStats() {
    return this.request('/alerts/stats/summary');
  }

  // Milk endpoints
  async getMilkSummary() {
    return this.request('/milk/summary');
  }

  async getCattleMilkHistory(tagId, days = 30) {
    return this.request(`/milk/cattle/${tagId}/history?days=${days}`);
  }

  async logMilkSession(milkData) {
    return this.request('/milk/log-session', {
      method: 'POST',
      body: JSON.stringify(milkData),
    });
  }

  // Reproduction endpoints
  async getHeatDetection() {
    return this.request('/reproduction/heat-detection');
  }

  async getPregnancyTracker() {
    return this.request('/reproduction/pregnancy-tracker');
  }

  async logAIEvent(aiData) {
    return this.request('/reproduction/log-ai-event', {
      method: 'POST',
      body: JSON.stringify(aiData),
    });
  }

  async confirmCalving(calvingData) {
    return this.request('/reproduction/confirm-calving', {
      method: 'POST',
      body: JSON.stringify(calvingData),
    });
  }

  async getCattleReproductionHistory(tagId) {
    return this.request(`/reproduction/cattle/${tagId}/history`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Manual data generation trigger (for demo)
  async triggerDataTick() {
    return this.request('/admin/tick', {
      method: 'POST',
    });
  }
}

export default new ApiService();
