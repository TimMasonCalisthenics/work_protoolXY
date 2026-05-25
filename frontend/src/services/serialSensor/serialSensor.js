import { API_SERIAL_URL, apiClient } from "@services/interceptor";

const API_SERIAL_SUB_URL = API_SERIAL_URL + 'signal';
export const sendQualitySignal = async (status) => {
    if (status) {
        status = "OK";
    } else {
        status = "NG";
    }
    const response = await apiClient(`${API_SERIAL_SUB_URL}` + '/quality', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create measurement');
    }
    return result;
};  