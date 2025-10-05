import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/api';

// Create a separate instance for protected endpoints
const protectedApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for protected endpoints
protectedApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for protected endpoints to handle token refresh
protectedApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) {
                    throw new Error('No refresh token available');
                }

                const authApi = axios.create({
                    baseURL: API_BASE_URL,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const refreshResponse = await authApi.post('/auth/refresh/', { refresh });
                
                if (refreshResponse.data?.access) {
                    localStorage.setItem('access_token', refreshResponse.data.access);
                    // Retry the original request with new token
                    error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
                    return protectedApi.request(error.config);
                }
            } catch (refreshError) {
                // Clear tokens on refresh failure
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                throw refreshError;
            }
        }
        return Promise.reject(error);
    }
);

// Seeds API
export const seedsApi = {
    getAll: () => protectedApi.get('/seeds/'),
    getById: (id: string) => protectedApi.get(`/seeds/${id}/`),
    create: (data: any) => protectedApi.post('/seeds/', data),
    update: (id: string, data: any) => protectedApi.put(`/seeds/${id}/`, data),
    delete: (id: string) => protectedApi.delete(`/seeds/${id}/`),
    search: (query: string) => protectedApi.get(`/seeds/search/?q=${query}`),
    getTrials: (id: string) => protectedApi.get(`/seeds/${id}/trials/`),
};

// Plots API
export const plotsApi = {
    getAll: () => protectedApi.get('/plots/'),
    getById: (id: string) => protectedApi.get(`/plots/${id}/`),
    create: (data: any) => protectedApi.post('/plots/', data),
    update: (id: string, data: any) => protectedApi.put(`/plots/${id}/`, data),
    delete: (id: string) => protectedApi.delete(`/plots/${id}/`),
    search: (query: string) => protectedApi.get(`/plots/search/?q=${query}`),
    getActiveTrials: (id: string) => protectedApi.get(`/plots/${id}/active_trials/`),
    getIncidents: (id: string) => protectedApi.get(`/plots/${id}/incidents/`),
};

// Trials API
export const trialsApi = {
    getAll: () => protectedApi.get('/trials/'),
    getById: (id: string) => protectedApi.get(`/trials/${id}/`),
    create: (data: any) => protectedApi.post('/trials/', data),
    update: (id: string, data: any) => protectedApi.put(`/trials/${id}/`, data),
    delete: (id: string) => protectedApi.delete(`/trials/${id}/`),
    search: (query: string) => protectedApi.get(`/trials/search/?q=${query}`),
    getPlots: (id: string) => protectedApi.get(`/trials/${id}/plots/`),
    getSeeds: (id: string) => protectedApi.get(`/trials/${id}/seeds/`),
    getSummary: (params: any) => protectedApi.get('/trials/summary/', { params }),
    getIncidents: (id: string) => protectedApi.get(`/trials/${id}/incidents/`),
    addIncident: (id: string, data: any) => protectedApi.post(`/trials/${id}/add_incident/`, data),
};

// Incidents API
export const incidentsApi = {
    getAll: () => protectedApi.get('/incidents/'),
    getById: (id: string) => protectedApi.get(`/incidents/${id}/`),
    create: (data: any) => protectedApi.post('/incidents/', data),
    update: (id: string, data: any) => protectedApi.put(`/incidents/${id}/`, data),
    delete: (id: string) => protectedApi.delete(`/incidents/${id}/`),
    getSummary: () => protectedApi.get('/incidents/summary/'),
};

export default protectedApi;