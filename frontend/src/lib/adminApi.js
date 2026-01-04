import api from "./api";

export const adminApi = {
  // Users
  getUsers: async (params = {}) => {
    const response = await api.get("/api/admin/users", { params });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  updateUserTier: async (userId, tier) => {
    const response = await api.patch(`/api/admin/users/${userId}/tier`, {
      tier,
    });
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/api/admin/users/${userId}/status`, {
      status,
    });
    return response.data;
  },

  resetUserQuota: async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/reset-quota`);
    return response.data;
  },

  // Stats & Analytics
  getStats: async () => {
    const response = await api.get("/api/admin/stats");
    return response.data;
  },

  getAnalytics: async (days = 30) => {
    const response = await api.get("/api/admin/analytics", {
      params: { days },
    });
    return response.data;
  },

  getAuditLogs: async (limit = 100) => {
    const response = await api.get("/api/admin/audit-logs", {
      params: { limit },
    });
    return response.data;
  },
};
