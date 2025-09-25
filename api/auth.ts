import { useApiHost } from "@/composables/useApiHost";
import { useAuthStore } from "@/stores/auth";

export const authApi = () => {
    const api = useApiHost();
    const authStore = useAuthStore();
    
    return {
        loginAuth: async (email: string, password: string) => {
            console.log('🔐 Attempting login to:', `${api}/api/auth/login`);
            console.log('📧 Email:', email);
            console.log('🌐 Full API URL:', `${api}/api/auth/login`);
            
            try {
                const response = await fetch(`${api}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                });
                
                console.log('📡 Response status:', response.status);
                console.log('📡 Response URL:', response.url);
                console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
                
                // Check if response is HTML (indicates wrong endpoint)
                const contentType = response.headers.get('content-type');
                console.log('📄 Content-Type:', contentType);
                
                if (!contentType || !contentType.includes('application/json')) {
                    const textResponse = await response.text();
                    console.error('❌ Received non-JSON response:', textResponse.substring(0, 200));
                    throw new Error(`Server returned HTML instead of JSON. Check API host configuration.`);
                }
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('❌ Login failed:', errorData);
                    throw new Error(errorData.message || 'Login failed');
                }
                
                const data = await response.json();
                console.log('✅ Login successful:', data);
                return data;
            } catch (error) {
                console.error('💥 Login error:', error);
                throw error;
            }
        },
        verifyAuth: async () => {
            const token = authStore.getToken;
            console.log('verifyAuth - token from store:', token);
            
            if (!token || token === '' || token === 'null' || token === 'undefined') {
                console.error('verifyAuth - No valid token available');
                throw new Error('No token available');
            }
            
            const response = await fetch(`${api}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
            });

            return response.json();
        },
        verifyAuthCustomer: async () => {
            const token = authStore.getToken;
            console.log('verifyAuthCustomer - token from store:', token);
            
            if (!token || token === '' || token === 'null' || token === 'undefined') {
                console.error('verifyAuthCustomer - No valid token available');
                throw new Error('No token available');
            }
            
            const response = await fetch(`${api}/api/auth/verify-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
            });

            return response.json();
        }
    }
}