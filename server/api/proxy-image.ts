export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const query = getQuery(event);
    const path = query.path as string;

    if (!path) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Image path is required',
        });
    }

    try {
        // Determine the backend API host
        let apiHost = config.public.API_HOST;

        // Fallback for local development if API_HOST points to production
        if (process.env.NODE_ENV === 'development' && apiHost.includes('rndpolije.lilly.net.id')) {
            console.log('⚠️ Detected production API host in development, falling back to localhost:3001');
            apiHost = 'http://localhost:3001';
        }

        // Construct the full URL to the backend
        const imageUrl = `${apiHost}/${path}`;

        console.log(`[Proxy Image] Fetching: ${imageUrl}`);

        // Fetch the image from the backend
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw createError({
                statusCode: response.status,
                statusMessage: `Failed to fetch image: ${response.statusText}`,
            });
        }

        // Get the image data as a buffer
        const imageBuffer = await response.arrayBuffer();

        // Get content type from the backend response
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Set appropriate headers
        setResponseHeaders(event, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        });

        // Return the image buffer
        return new Uint8Array(imageBuffer);
    } catch (error) {
        console.error('[Proxy Image] Error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to proxy image',
        });
    }
});
