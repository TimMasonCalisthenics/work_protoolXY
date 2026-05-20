import { getAuthHeaders, API_BASE_URL, apiClient } from '@services/interceptor';

const API_BASE_URL_PRODUCTS = API_BASE_URL + 'products';

export const getProducts = async (page = 1, limit = 10, search = '') => {

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (search) {
        params.append('search', search);
    }

    const response = await apiClient(`${API_BASE_URL_PRODUCTS}?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to Get products');
    }
    return result;

};

export const getProductById = async (productId) => {

    const response = await apiClient(`${API_BASE_URL_PRODUCTS}/${productId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to Get product');
    }
    return result;

};


export const createProduct = async (productData) => {

    const isFormData = productData instanceof FormData;
    const headers = getAuthHeaders();

    if (isFormData) {
        // Remove Content-Type header to let browser set it with boundary for FormData
        delete headers['Content-Type'];
    }

    const response = await apiClient(API_BASE_URL_PRODUCTS, {
        method: 'POST',
        headers: headers,
        body: isFormData ? productData : JSON.stringify(productData),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to create product');
    }
    return result;

};

export const updateProduct = async (productId, productData) => {

    const isFormData = productData instanceof FormData;
    const headers = getAuthHeaders();

    if (isFormData) {
        delete headers['Content-Type'];
    }

    const response = await apiClient(`${API_BASE_URL_PRODUCTS}/${productId}`, {
        method: 'PATCH',
        headers: headers,
        body: isFormData ? productData : JSON.stringify(productData),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Failed to update product');
    }
    return result;

};

export const deleteProduct = async (productId) => {
    const response = await apiClient(`${API_BASE_URL_PRODUCTS}/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete product');
    }
    return "Product deleted successfully";

};



export const updateActiveProductDetail = async (data) => {
    const response = await apiClient(`${API_BASE_URL_PRODUCTS}/edit-active-product`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: data,
    });
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete product');
    }
    return "Product deleted successfully";

};

