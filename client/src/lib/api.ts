import { apiRequest } from "./queryClient";

export const api = {
  // Dashboard
  getDashboardStats: () => 
    fetch("/api/dashboard/stats").then(res => res.json()),
  
  getRecentActivity: (limit?: number) =>
    fetch(`/api/dashboard/recent-activity${limit ? `?limit=${limit}` : ""}`).then(res => res.json()),
  
  getUpcomingCourtDates: (limit?: number) =>
    fetch(`/api/dashboard/upcoming-court-dates${limit ? `?limit=${limit}` : ""}`).then(res => res.json()),

  // Clients
  getClients: (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    return fetch(`/api/clients${params.toString() ? `?${params}` : ""}`).then(res => res.json());
  },

  getClientsWithBonds: () =>
    fetch("/api/clients/with-bonds").then(res => res.json()),

  getClient: (id: string) =>
    fetch(`/api/clients/${id}`).then(res => res.json()),

  createClient: (data: any) =>
    apiRequest("POST", "/api/clients", data).then(res => res.json()),

  updateClient: (id: string, data: any) =>
    apiRequest("PATCH", `/api/clients/${id}`, data).then(res => res.json()),

  deleteClient: (id: string) =>
    apiRequest("DELETE", `/api/clients/${id}`),

  // Cases
  getCases: (filters?: { clientId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append("clientId", filters.clientId);
    if (filters?.status) params.append("status", filters.status);
    return fetch(`/api/cases${params.toString() ? `?${params}` : ""}`).then(res => res.json());
  },

  createCase: (data: any) =>
    apiRequest("POST", "/api/cases", data).then(res => res.json()),

  updateCase: (id: string, data: any) =>
    apiRequest("PATCH", `/api/cases/${id}`, data).then(res => res.json()),

  // Bonds
  getBonds: (filters?: { clientId?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.clientId) params.append("clientId", filters.clientId);
    if (filters?.status) params.append("status", filters.status);
    return fetch(`/api/bonds${params.toString() ? `?${params}` : ""}`).then(res => res.json());
  },

  getBondsWithDetails: () =>
    fetch("/api/bonds/with-details").then(res => res.json()),

  createBond: (data: any) =>
    apiRequest("POST", "/api/bonds", data).then(res => res.json()),

  updateBond: (id: string, data: any) =>
    apiRequest("PATCH", `/api/bonds/${id}`, data).then(res => res.json()),

  // Payments
  getPayments: (filters?: { bondId?: string; clientId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.bondId) params.append("bondId", filters.bondId);
    if (filters?.clientId) params.append("clientId", filters.clientId);
    return fetch(`/api/payments${params.toString() ? `?${params}` : ""}`).then(res => res.json());
  },

  createPayment: (data: any) =>
    apiRequest("POST", "/api/payments", data).then(res => res.json()),

  // Financial
  getFinancialSummary: () =>
    fetch("/api/financial/summary").then(res => res.json()),

  // Documents
  getDocuments: (filters?: { category?: string; relatedId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.relatedId) params.append("relatedId", filters.relatedId);
    return fetch(`/api/documents${params.toString() ? `?${params}` : ""}`).then(res => res.json());
  },

  uploadDocuments: (formData: FormData) =>
    fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    }).then(res => {
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      return res.json();
    }),
};
