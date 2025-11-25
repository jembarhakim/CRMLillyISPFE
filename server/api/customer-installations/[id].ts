// API route to handle customer installation operations
// This proxies requests to the backend API

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Installation ID is required'
        });
    }

    const method = event.method || 'GET';

    // Get the authorization token from the request headers or cookies
    const authHeader = getHeader(event, 'authorization');
    const cookieHeader = getHeader(event, 'cookie');

    // Extract token from cookie if not in Authorization header
    let token = authHeader;
    if (!token && cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        if (tokenMatch) {
            token = tokenMatch[1];
        }
    }

    let apiHost = config.public.API_HOST;

    // Fallback for local development if API_HOST points to production
    if (process.env.NODE_ENV === 'development' && apiHost.includes('rndpolije.lilly.net.id')) {
        console.log('⚠️ Detected production API host in development, falling back to localhost:3001');
        apiHost = 'http://localhost:3001';
    }

    try {
        let backendUrl = '';

        if (method === 'GET') {
            // Use the complete report endpoint for GET requests
            backendUrl = `${apiHost}/api/admin/customer-installation/report/complete/${id}`;
        } else if (method === 'DELETE') {
            // Use the delete endpoint for DELETE requests
            backendUrl = `${apiHost}/api/admin/customer-installation/report/delete/${id}`;
        } else {
            throw createError({
                statusCode: 405,
                statusMessage: 'Method not allowed'
            });
        }

        // Prepare headers for backend request
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Forward the authentication token
        if (token) {
            headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Proxy request to backend API with authentication
        const response = await $fetch(backendUrl, {
            method: method as any,
            headers: headers
        });

        return response;
    } catch (error: any) {
        console.error(`Error ${method} installation:`, error);

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || `Failed to ${method.toLowerCase()} installation`
        });
    }
});
