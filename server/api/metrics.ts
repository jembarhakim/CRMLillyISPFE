// server/api/metrics.ts
import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const KUMA_API_FALLBACK = 'http://rndpolije.lilly.net.id:3002'

  try {
    const config = useRuntimeConfig()

    // Base URL: can be taken from runtimeConfig if you want
    const KUMA_API_URL = (config.kumaBaseUrl as string) || KUMA_API_FALLBACK

    const headers: Record<string, string> = {
      Accept: 'text/plain',
    }

    // ---- AUTH PRIORITY ORDER ----
    // 1. Explicit precomputed base64 token from env (KUMA_METRICS_BASIC_AUTH)
    // 2. (user, pass) from env (KUMA_METRICS_USERNAME/PASSWORD)
    // 3. Nuxt runtimeConfig kumaUsername/kumaPassword (same as main handler)
    // --------------------------------

    const envBasic = process.env.KUMA_METRICS_BASIC_AUTH
    const envUser = process.env.KUMA_METRICS_USERNAME
    const envPass = process.env.KUMA_METRICS_PASSWORD
    const cfgUser = (config.kumaUsername as string | undefined)?.trim()
    const cfgPass = (config.kumaPassword as string | undefined)?.trim()

    if (envBasic) {
      // Allow both "Basic xxx" or raw base64 "xxx"
      if (envBasic.startsWith('Basic ')) {
        headers['Authorization'] = envBasic
      } else {
        headers['Authorization'] = `Basic ${envBasic}`
      }
    } else if (envUser && envPass) {
      const token = Buffer.from(`${envUser}:${envPass}`).toString('base64')
      headers['Authorization'] = `Basic ${token}`
    } else if (cfgUser && cfgPass) {
      const token = Buffer.from(`${cfgUser}:${cfgPass}`).toString('base64')
      headers['Authorization'] = `Basic ${token}`
    } else {
      console.error('[Metrics] No credentials configured!')
      return {
        error: 'Kuma credentials not configured (no env or runtimeConfig)',
        monitors: {},
      }
    }

    // ---- Fetch metrics as TEXT ----
    const resp = await fetch(`${KUMA_API_URL}/metrics`, {
      headers,
      redirect: 'follow',
    })

    const metricsText = await resp.text().catch(() => '')

    if (!resp.ok) {
      console.error(`[Metrics] Remote returned non-OK status: ${resp.status}`)
      return {
        error: `Remote returned ${resp.status}`,
        status: resp.status,
        bodyPreview: metricsText.slice(0, 200),
      }
    }

    // ---- Parse Prometheus metrics ----
    const monitorStatusRegex =
      /monitor_status\{[^}]*monitor_name="([^"]*)"[^}]*\}\s*([\d.]+)/g
    const responseTimeRegex =
      /monitor_response_time\{[^}]*monitor_name="([^"]*)"[^}]*\}\s*([\d.-]+)/g

    const monitors: Record<string, any> = {}

    let m: RegExpExecArray | null

    // status
    while ((m = monitorStatusRegex.exec(metricsText)) !== null) {
      const name = m[1]
      const status = parseInt(m[2])
      if (!monitors[name]) monitors[name] = {}
      monitors[name].status = status
    }

    // response time
    while ((m = responseTimeRegex.exec(metricsText)) !== null) {
      const name = m[1]
      const responseTime = parseFloat(m[2])
      if (!monitors[name]) monitors[name] = {}
      monitors[name].responseTime = responseTime
    }

    if (Object.keys(monitors).length === 0) {
      console.warn(
        '[Metrics] No monitors parsed from metrics text; returning raw preview'
      )
      return {
        success: true,
        monitors: {},
        bodyPreview: metricsText.slice(0, 200),
      }
    }

    return { success: true, monitors }
  } catch (err) {
    console.error('[Metrics] Proxy error:', err)
    return {
      error: err instanceof Error ? err.message : String(err),
      monitors: {},
    }
  }
})
