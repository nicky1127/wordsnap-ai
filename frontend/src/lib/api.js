import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers["x-user-id"] = localStorage.getItem("userId") || "demo-user";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
