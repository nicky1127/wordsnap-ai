import axios from "axios";
import { auth } from "./firebase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://wordsnap-backend-763810149974.us-central1.run.app";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Firebase auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current Firebase user
      const user = auth.currentUser;

      if (user) {
        // Get fresh ID token
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      const errorCode = error.response.data?.error?.code;

      if (errorCode === "TOKEN_EXPIRED" || errorCode === "INVALID_TOKEN") {
        // Token expired - redirect to login
        window.location.href = "/login";
      }
    }

    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  healthCheck: async () => {
    const response = await api.get("/health");
    return response.data;
  },

  generateDescription: async (formData) => {
    const response = await api.post("/api/generate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  analyzeImage: async (formData) => {
    const response = await api.post("/api/generate/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getHistory: async (limit = 20) => {
    const response = await api.get("/api/generate/history", {
      params: { limit },
    });
    return response.data;
  },

  getGeneration: async (id) => {
    const response = await api.get(`/api/generate/${id}`);
    return response.data;
  },

  getUsageStats: async () => {
    const response = await api.get("/api/generate/usage/stats");
    return response.data;
  },
};

export default api;
