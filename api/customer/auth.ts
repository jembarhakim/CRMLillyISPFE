import { useApiHost } from "@/composables/useApiHost";
import { useAuthStore } from "@/stores/auth";

export const authCustomerApi = () => {
    const api = useApiHost();
    const authStore = useAuthStore();

    const authHeaders = () => {
        const token = authStore.getToken;
        if (!token || token === '' || token === 'null' || token === 'undefined') {
            throw new Error('No valid authentication token available');
        }

        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    };

    return {
        loginAuth: async (phone: string, password: string) => {
            const response = await fetch(`${api}/api/auth/login-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone,
                    password,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }
            return response.json();
        },
        verifyAuth: async () => {
            const response = await fetch(`${api}/api/auth/verify-customer`, {
                method: 'POST',
                headers: authHeaders(),
            });

            return response.json();
        },
        requestOtp: async (phone: string) => {
            const response = await fetch(`${api}/api/auth/request-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to send OTP');
            }
            return data;
        },
        verifyOtp: async (phone: string, code: string) => {
            const response = await fetch(`${api}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, code }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || 'Invalid OTP code');
            }
            return data;
        },
    };
};
