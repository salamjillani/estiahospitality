// frontend/src/utils/api.js
export const BASE_URL = 'http://localhost:5000';

export const api = {
  get: async (endpoint) => {
    try {
      console.log('Making GET request to:', `${BASE_URL}${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  },

  post: async (endpoint, data) => {
    try {
      console.log('Making POST request to:', `${BASE_URL}${endpoint}`);
      console.log('With data:', data);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  },

  // Add PUT method for updating bookings
  put: async (endpoint, data) => {
    try {
      console.log('Making PUT request to:', `${BASE_URL}${endpoint}`);
      console.log('With data:', data);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  },

  // Add DELETE method for removing bookings
  delete: async (endpoint) => {
    try {
      console.log('Making DELETE request to:', `${BASE_URL}${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('API error:', error);
        throw new Error(error.message || 'API request failed');
      }
      return response.json();
    } catch (err) {
      console.error('API call failed:', err);
      throw err;
    }
  },
};