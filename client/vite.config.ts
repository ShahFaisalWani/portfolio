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
