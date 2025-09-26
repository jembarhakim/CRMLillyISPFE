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
      console.warn('⚠️ NUXT_PUBLIC_API_HOST is not defined in .env; using fallback http://localhost:3001');
      api = 'http://localhost:3001';
    }
  }

  // Force localhost for development
  if (process.client && window.location.hostname === 'localhost') {
    api = 'http://localhost:3001';
    console.log('🔧 Forcing localhost:3001 for development');
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
      console.warn('⚠️ NUXT_PUBLIC_WA_HOST is not defined in .env; using fallback http://localhost:3001');
      wa = 'http://localhost:3001';
    }
  }

  return wa;
};