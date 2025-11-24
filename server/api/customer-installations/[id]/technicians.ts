// API route to fetch installation technicians
// This proxies the request to the backend API

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Installation ID is required'
        });
    }

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

    try {
        // Prepare headers for backend request
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Forward the authentication token
        if (token) {
            headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Fetch from backend API - use the correct endpoint
        const response = await $fetch(`${config.public.API_HOST}/api/admin/customer-installation/report/technician-team/${id}`, {
            method: 'GET',
            headers: headers
        });

        return response;
    } catch (error: any) {
        console.error('Error fetching installation technicians:', error);

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to fetch installation technicians'
        });
    }
});
