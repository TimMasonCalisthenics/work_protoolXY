import { getAuthHeaders, API_BASE_URL, apiClient } from '@services/interceptor';
const API_BASE_URL_SENSORS = API_BASE_URL + 'sensors';


export const getSensors = async (sensors_type) => {
    const params = new URLSearchParams({
        sensors_type: sensors_type.toString(),
    });

    const response = await apiClient(`${API_BASE_URL_SENSORS}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to Get sensors');
    }
    return result;

};

export const clearTmp = async () => {
    const response = await apiClient(`${API_BASE_URL_SENSORS}/clearTmp`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to clear tmp');
    }
    return result;

};