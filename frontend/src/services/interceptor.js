export const API_BASE_URL = 'http://localhost:5000/api/v1/';
export const API_AIRGAUGE_URL = 'http://localhost:5001/api/v1/';
export const API_MITUTOYO_URL = 'http://localhost:5002/api/v1/';
export const API_SERIAL_URL = 'http://localhost:5003/api/v1/';
export const IMAGE_BASE_URL = 'http://localhost:5000/api/v1/images';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const apiClient = async (url, options = {}) => {

  try {
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 422) {
      localStorage.removeItem("access_token");
      window.location.replace("/");
      throw new Error("Unauthorized");
    }
    return response;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("NETWORK_ERROR");
    }
    throw error;
  }
};
