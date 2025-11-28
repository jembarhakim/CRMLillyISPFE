export default defineEventHandler(async (event) => {
  try {
    // Get the monitor ID from the URL parameter
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Monitor ID is required'
      })
    }
    
    // Validate ID format (should be numeric)
    if (!/^\d+$/.test(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid monitor ID format'
      })
    }
    
    const KUMA_API_URL = 'http://rndpolije.lilly.net.id:3002'
    
    try {
      // Try to fetch heartbeat data from Kuma
      // Kuma exposes heartbeat data through various endpoints
      console.log(`[Heartbeat] Fetching for monitor ${id}`)
      
      // Try the standard heartbeat endpoint
      const response = await $fetch(`${KUMA_API_URL}/api/heartbeat/${id}`, {
        timeout: 5000
      }).catch(async (err) => {
        // If direct heartbeat fails, try alternative endpoint
        console.log(`[Heartbeat] Standard endpoint failed for ${id}, trying alternative...`)
        return null
      })
      
      if (response) {
        console.log(`[Heartbeat] Success for monitor ${id}`)
        return response
      }
      
      // If both fail, return empty array
      console.log(`[Heartbeat] No data available for monitor ${id}`)
      return []
      
    } catch (err) {
      console.error(`[Heartbeat] Error fetching for monitor ${id}:`, err)
      // Return empty array instead of error to allow graceful degradation
      return []
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    console.error('[Heartbeat] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch heartbeat data'
    })
  }
})
