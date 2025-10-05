import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to handle token refresh
authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) {
                    throw new Error('No refresh token available');
                }

                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/auth/refresh/`,
                    { refresh },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (refreshResponse.data?.access) {
                    localStorage.setItem('access_token', refreshResponse.data.access);
                    // Retry the original request with new token
                    error.config.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
                    return authApi.request(error.config);
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

export const authApiService = {
    login: (credentials: { username: string; password: string }) => 
        authApi.post('/auth/login/', credentials),
    refresh: () => authApi.post('/auth/refresh/'),
    me: () => authApi.get('/users/me/'),
};
