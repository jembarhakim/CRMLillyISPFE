export default defineEventHandler(async (event) => {
  try {
    const response = await $fetch('http://rndpolije.lilly.net.id:3002/api/status-page/menara')
    return response
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch monitoring data'
    })
  }
})

