import { apiClient, API_BASE_URL, getAuthHeaders } from './interceptor';

export const rawValueLogService = {
  getLogs: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient(`${API_BASE_URL}measurement_raw_value_logs?${queryString}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch raw value logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching raw value logs:', error);
      throw error;
    }
  },
  clearLogs: async () => {
    try {
      const response = await apiClient(`${API_BASE_URL}measurement_raw_value_logs`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear raw value logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing raw value logs:', error);
      throw error;
    }
  }
};

