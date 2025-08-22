export const useApiHost = () => {
  const config = useRuntimeConfig();
  const api = config.public.API_HOST;

  if (!api) {
    console.warn('⚠️ NUXT_PUBLIC_API_HOST is not defined in .env');
  }

  return api;
};
export const useWaHost = () => {
  const config = useRuntimeConfig();
  const wa = config.public.WA_HOST;

  if (!wa) {
    console.warn('⚠️ NUXT_PUBLIC_API_HOST is not defined in .env');
  }

  return wa;
};