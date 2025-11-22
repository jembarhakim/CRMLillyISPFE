// Fetch Kuma metrics and parse monitor status
export default defineEventHandler(async (event) => {
  const KUMA_API_URL = 'http://rndpolije.lilly.net.id:3002'
  try {
    // Build headers, support optional Basic auth via env vars
    const headers: Record<string,string> = { Accept: 'text/plain' }
    // Prefer a precomputed Basic auth token if provided
    const basicAuth = process?.env?.KUMA_METRICS_BASIC_AUTH || null
    const user = process?.env?.KUMA_METRICS_USERNAME || null
    const pass = process?.env?.KUMA_METRICS_PASSWORD || null
    if (basicAuth) {
      headers['Authorization'] = `Basic ${basicAuth}`
    } else if (user && pass) {
      const token = Buffer.from(`${user}:${pass}`).toString('base64')
      headers['Authorization'] = `Basic ${token}`
    }

    // Attempt to fetch metrics as text
    const resp = await fetch(`${KUMA_API_URL}/metrics`, { headers, redirect: 'follow' })

    // Read body even when status !== 200 for debugging
    const metricsText = await resp.text().catch(() => '')

    if (!resp.ok) {
      console.error(`[Metrics] Remote returned non-OK status: ${resp.status}`)
      return { error: `Remote returned ${resp.status}`, status: resp.status, bodyPreview: metricsText.slice(0, 200) }
    }

    // Parse Prometheus metrics format
    const monitorStatusRegex = /monitor_status\{[^}]*monitor_name="([^"]*)"[^}]*\}\s*([\d.]+)/g
    const responseTimeRegex = /monitor_response_time\{[^}]*monitor_name="([^"]*)"[^}]*\}\s*([\d.-]+)/g

    const monitors: Record<string, any> = {}
    let m: RegExpExecArray | null
    while ((m = monitorStatusRegex.exec(metricsText)) !== null) {
      const name = m[1]
      const status = parseInt(m[2])
      monitors[name] = { status }
    }

    while ((m = responseTimeRegex.exec(metricsText)) !== null) {
      const name = m[1]
      const responseTime = parseFloat(m[2])
      if (!monitors[name]) monitors[name] = {}
      monitors[name].responseTime = responseTime
    }

    // If we parsed nothing, include a preview for debugging
    if (Object.keys(monitors).length === 0) {
      console.warn('[Metrics] No monitors parsed from metrics text; returning raw preview')
      return { success: true, monitors: {}, bodyPreview: metricsText.slice(0, 200) }
    }

    return { success: true, monitors }
  } catch (err) {
    console.error('[Metrics] Proxy error:', err)
    return { error: err instanceof Error ? err.message : String(err), monitors: {} }
  }
})
