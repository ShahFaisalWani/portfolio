/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_API_PROXY?: string;
}

/* set in vite.config.ts so the prerendered footer and its hydration agree */
declare const __BUILD_YEAR__: number;
