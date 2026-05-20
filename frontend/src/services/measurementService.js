import { API_BASE_URL, apiClient, getAuthHeaders } from "@services/interceptor";

const API_BASE_URL_MEASUREMENT = API_BASE_URL + 'measurements';

export const createMeasurement = async (barcode1, barcode2, product_id, status) => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        "serial_a": barcode1, "serial_b": barcode2,
        "product_id": product_id,
        "status": status
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
  } catch (error) {
    console.error('Error creating measurement:', error);
    throw error;
  }
};

export const createMeasurementDraft = async (barcode1, barcode2, product_id, status) => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/draft`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        "serial_a": barcode1, "serial_b": barcode2,
        "product_id": product_id,
        "status": status
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
  } catch (error) {
    console.error('Error creating measurement:', error);
    throw error;
  }
};

export const getMeasurementsDraft = async () => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/draft`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get measurements draft');
    }
    return result;
  } catch (error) {
    console.error('Error getting measurements draft:', error);
    throw error;
  }
};

export const updateMeasurementDraft = async ({ id, ...payload }) => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/draft/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update measurement');
    }
    return result;
  } catch (error) {
    console.error('Error updating measurement:', error);
    throw error;
  }
};
export const saveMeasurement = async (stage) => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/save_draft`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        "stage": stage
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save measurement');
    }
    return result;
  } catch (error) {
    console.error('Error saving measurement:', error);
    throw error;
  }
};
export const saveMeasurementWithoutCheck = async (stage) => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/save_draftWithoutCheck`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        "stage": stage
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to save measurement');
    }
    return result;
  } catch (error) {
    console.error('Error saving measurement:', error);
    throw error;
  }
};

export const cancelMeasurementDraft = async () => {
  try {
    const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/cancel_draft`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to cancel measurement draft');
    }
    return result;
  } catch (error) {
    console.error('Error canceling measurement draft:', error);
    throw error;
  }
};

export const getMeasurements = async (page = 1, limit = 10, search = '', searchResult = '', startDate = '', endDate = '') => {

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append('search', search);
  }
  if (searchResult) {
    params.append('search_result', searchResult);
  }
  if (startDate) {
    params.append('start_date', startDate);
  }
  if (endDate) {
    params.append('end_date', endDate);
  }

  const response = await apiClient(`${API_BASE_URL_MEASUREMENT}?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to Get measurements');
  }
  return result;

};

export const exportMeasurementsCsv = async (search = '', searchResult = '', startDate = '', endDate = '') => {

  const params = new URLSearchParams();

  if (search) {
    params.append('search', search);
  }
  if (searchResult) {
    params.append('search_result', searchResult);
  }
  if (startDate) {
    params.append('start_date', startDate);
  }
  if (endDate) {
    params.append('end_date', endDate);
  }

  const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/export?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || 'Failed to export measurements');
  }

  const blob = await response.blob();
  return blob;

};

export const getMeasurementById = async (id) => {

  const response = await apiClient(`${API_BASE_URL_MEASUREMENT}/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to Get measurement detail');
  }
  return result;

};
