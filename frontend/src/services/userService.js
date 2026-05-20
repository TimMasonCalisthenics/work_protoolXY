import { getAuthHeaders, API_BASE_URL, apiClient } from '@services/interceptor';

const API_BASE_URL_USERS = API_BASE_URL + 'users';
// Get paginated users with optional search
export const getUsers = async (page = 1, limit = 10, search = '') => {

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await apiClient(`${API_BASE_URL_USERS}?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to Get users');
  }

  return result.data;

};

// Get user detail by ID
export const getUserById = async (userId) => {
  const response = await apiClient(`${API_BASE_URL_USERS}/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to Get user details');
  }

  return result.data;

};

// Create new user
export const createUser = async (username, password) => {
  const response = await apiClient(API_BASE_URL_USERS, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create user');
  }

  return result;

};

// Update user role
export const updateUserRole = async (username, role) => {
  const response = await apiClient(`${API_BASE_URL_USERS}/${username}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update user role');
  }

  return result;

};

// Delete user
export const deleteUser = async (username) => {
  const response = await apiClient(`${API_BASE_URL_USERS}/${username}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete user');
  }

  return result;

};
