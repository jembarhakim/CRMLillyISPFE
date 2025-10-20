export const useApiHost = () => {
  const config = useRuntimeConfig();
  let api = config.public.API_HOST;

  if (!api || api.trim() === '') {
    if (process.client && typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'https' : 'http';
      const host = window.location.hostname; // works with LAN IP when accessed from phone
      const port = '3001';
      api = `${proto}://${host}:${port}`;
      console.warn(`⚠️ NUXT_PUBLIC_API_HOST not set; using inferred ${api}`);
    } else {
      console.warn('⚠️ NUXT_PUBLIC_API_HOST is not defined in .env; using fallback http://rndpolije.lilly.net.id');
      api = 'http://rndpolije.lilly.net.id';
    }
  }

  // Only force localhost if explicitly on localhost AND no API_HOST is set
  if (process.client && window.location.hostname === 'localhost' && !config.public.API_HOST) {
    api = 'http://localhost:3001';
    console.log('🔧 Using localhost:3001 for local development');
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
      const port = '3001';
      wa = `${proto}://${host}:${port}`;
      console.warn(`⚠️ NUXT_PUBLIC_WA_HOST not set; using inferred ${wa}`);
    } else {
      console.warn('⚠️ NUXT_PUBLIC_WA_HOST is not defined in .env; using fallback http://rndpolije.lilly.net.id');
      wa = 'http://rndpolije.lilly.net.id';
    }
  }

  return wa;
};