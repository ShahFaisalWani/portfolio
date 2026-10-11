import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    define: {
      __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
    },
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          // libraries change less often than the app: in their own chunks they stay cached across deploys
          codeSplitting: {
            groups: [
              { name: "react", test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie)[\\/]/ },
              { name: "gsap", test: /node_modules[\\/](gsap|@gsap[\\/]react|lenis)[\\/]/ },
              { name: "motion", test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            ],
          },
        },
      },
    },
    // the prerender build (src/entry-server.tsx) bundles its deps: gsap ships ESM files Node can't load directly
    ssr: { noExternal: true },
    server: {
      port: 9999,
      proxy: env.VITE_API_PROXY
        ? {
            "/api-proxy": {
              target: env.VITE_API_PROXY,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api-proxy/, ""),
            },
          }
        : undefined,
    },
  };
});
