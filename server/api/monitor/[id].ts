export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Monitor ID is required'
      })
    }
    
    // Validate ID to prevent path traversal
    if (!/^\d+$/.test(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid monitor ID'
      })
    }
    
    // Fetch monitor status from Kuma API
    // Kuma has several endpoints for monitor data
    const response = await $fetch(`http://rndpolije.lilly.net.id:3002/api/heartbeat/${id}`)
    return response
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch monitor data'
    })
  }
})
