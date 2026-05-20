import { API_BASE_URL, apiClient, getAuthHeaders } from "@services/interceptor";

const API_BASE_URL_MEASUREMENT_DRAFT = API_BASE_URL + 'measurements_draft';

export const getMeasurementsDraft = async () => {

    const response = await apiClient(API_BASE_URL_MEASUREMENT_DRAFT, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to get measurements draft');
    }
    return result;

}

export const clearNgValueMeasurementsDraft = async () => {
    const response = await apiClient(API_BASE_URL_MEASUREMENT_DRAFT + '/clear-ng', {
        method: 'PATCH',
        headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to clear ng value measurements draft');
    }
    return result;

}
export const clearNgAndRawValueMeasurementsDraft = async () => {
    const response = await apiClient(API_BASE_URL_MEASUREMENT_DRAFT + '/clear-ng-raw', {
        method: 'PATCH',
        headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to clear ng and raw value measurements draft');
    }
    return result;

}
