export const useApiHost = () => {
  const config = useRuntimeConfig();
  let api = config.public.API_HOST;

  if (!api || api.trim() === '') {
    if (process.client && typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'https' : 'http';
      const host = window.location.hostname;
      // Use the configured Nginx port for the backend, which is 80 (or 443 for https)
      // Since Nginx proxies to 3001, the client should just use the domain/IP
      api = `${proto}://${host}`;
      console.warn(`⚠️ NUXT_PUBLIC_API_HOST not set; using inferred ${api}`);
    } else {
      console.warn('⚠️ NUXT_PUBLIC_API_HOST is not defined in .env; using fallback http://rndpolije.lilly.net.id');
      api = 'http://rndpolije.lilly.net.id';
    }
  }

  console.log('🔗 API Host configured as:', api);
  console.log('🌐 Current window location:', process.client ? window.location.href : 'server-side');
  return api;
};
export const useWaHost = () => {
  const config = useRuntimeConfig();
  let wa = config.public.WA_HOST;

  if (!wa || wa.trim() === '') { 
    if (process.client && typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'https' : 'http';
      const host = window.location.hostname;
      // Use the same logic as API_HOST - no port needed as Nginx handles routing
      wa = `${proto}://${host}`;
      console.warn(`⚠️ NUXT_PUBLIC_WA_HOST not set; using inferred ${wa}`);
    } else {
      console.warn('⚠️ NUXT_PUBLIC_WA_HOST is not defined in .env; using fallback http://rndpolije.lilly.net.id');
      wa = 'http://rndpolije.lilly.net.id';
    }
  }

  return wa;
};