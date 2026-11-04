import { useApiHost } from "@/composables/useApiHost";
import { useAuthStore } from "@/stores/auth";

export const authApi = () => {
    const api = useApiHost();
    const authStore = useAuthStore();
    
    const authHeaders = () => {
        const token = authStore.getToken;
        if (!token || token === '' || token === 'null' || token === 'undefined') {
            throw new Error('No token available');
        }
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    };

    return {
        loginAuth: async (email: string, password: string) => {
            const response = await fetch(`${api}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            return response.json();
        },
        verifyAuth: async () => {
            const response = await fetch(`${api}/api/auth/verify`, {
                method: 'POST',
                headers: authHeaders(),
            });
            return response.json();
        },
        verifyAuthCustomer: async () => {
            const response = await fetch(`${api}/api/auth/verify-customer`, {
                method: 'POST',
                headers: authHeaders(),
            });
            return response.json();
        }
    };
};
