export default defineEventHandler(async (event) => {
  try {
    // Get the endpoint from the URL parameter
    const endpoint = getRouterParam(event, 'endpoint')
    
    if (!endpoint) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Endpoint parameter is required'
      })
    }
    
    // Validate endpoint to prevent path traversal attacks
    // Only allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(endpoint)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid endpoint name'
      })
    }
    
    // Proxy the request to Kuma API
    const response = await $fetch(`http://rndpolije.lilly.net.id:3002/api/status-page/${endpoint}`)
    return response
  } catch (error) {
    // If it's already a createError, throw it as-is
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Otherwise, create a new error
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch monitoring data'
    })
  }
})








