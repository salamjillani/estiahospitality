// frontend/src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

export const api = {
  getHeaders: () => {
    const headers = { "Content-Type": "application/json" };
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  },

  get: async (endpoint) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Session expired. Please login again.");
      }

      if (response.status === 401) {
        throw new Error("Session expired. Please login again.");
      }
      if (response.status === 403) {
        throw new Error("Forbidden: Insufficient permissions");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Invalid content type. Received: ${contentType}. Response: ${text}`
        );
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }
      return response.json();
    } catch (err) {
      if (err.message === "Failed to fetch") {
        throw new Error("Network error - please check your connection");
      }
      throw err;
    }
  },

  post: async (endpoint, data, options = {}) => {
    try {
      console.log("API POST Request:", {
        url: `${BASE_URL}${endpoint}`,
        data: data instanceof FormData ? "FormData" : data,
      });

      const headers = options.headers || api.getHeaders();

      if (data instanceof FormData) {
        delete headers["Content-Type"];
        console.log("Using FormData, removed Content-Type header");
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: data instanceof FormData ? data : JSON.stringify(data),
      });

      console.log("Raw response:", response);
      console.log("Response headers:", Object.fromEntries(response.headers));

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      let responseData;
      try {
        responseData = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();
        console.log("Parsed response data:", responseData);
      } catch (parseError) {
        console.error("Response parsing error:", parseError);
        console.log("Raw response text:", await response.text());
        throw parseError;
      }

      if (!response.ok) {
        throw new Error(responseData.message || "API request failed");
      }

      return responseData;
    } catch (err) {
      console.error("API call failed:", err);
      throw err;
    }
  },

  put: async (endpoint, data) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }
      return response.json();
    } catch (err) {
      console.error("API call failed:", err);
      throw err;
    }
  },
  // Add this to your api object in api.js
  patch: async (endpoint, data) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }
      return response.json();
    } catch (err) {
      console.error("API call failed:", err);
      throw err;
    }
  },
  delete: async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
        headers: api.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }
      return response.json();
    } catch (err) {
      console.error("API call failed:", err);
      throw err;
    }
  },
};
