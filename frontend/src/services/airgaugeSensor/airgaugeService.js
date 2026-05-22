import { API_AIRGAUGE_URL, apiClient } from "@services/interceptor";

const API_AIRGAUGE_SUB_URL = API_AIRGAUGE_URL + 'airgauge'
export const start_readSensor = async () => {
    const response = await apiClient(`${API_AIRGAUGE_SUB_URL}/start-send`, {
        method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
};
export const stop_readSensor = async () => {
    const response = await apiClient(`${API_AIRGAUGE_SUB_URL}/stop-send`, {
        method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
};

export const get_raw_value = async () => {
    const response = await apiClient(`${API_AIRGAUGE_SUB_URL}/raw-value`, {
        method: 'GET',
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
}

export const get_all_settings = async () => {
    const response = await apiClient(`${API_AIRGAUGE_SUB_URL}/all-setting-airgauge`, {
        method: 'GET',
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
}

export const update_all_settings = async (data) => {
    const response = await apiClient(`${API_AIRGAUGE_SUB_URL}/all-setting-airgauge`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
}