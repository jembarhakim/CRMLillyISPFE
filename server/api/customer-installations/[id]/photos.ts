// API route to fetch installation photos
// This proxies the request to the backend API and extracts photos

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

        // Fetch complete report from backend API which includes photos
        const response: any = await $fetch(`${config.public.API_HOST}/api/admin/customer-installation/report/complete/${id}`, {
            method: 'GET',
            headers: headers
        });

        // Extract photos from the response
        // Backend returns: { data: { images: [...] }, success: true }
        const data = response?.data || response;
        const images = data?.images || [];

        // Map images to photo URLs
        const photos = images.map((img: any) => ({
            id: img.id,
            url: img.full_path || img.file,
            file: img.file,
            full_path: img.full_path,
            createdAt: img.createdAt
        }));

        return photos;
    } catch (error: any) {
        console.error('Error fetching installation photos:', error);

        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to fetch installation photos'
        });
    }
});
