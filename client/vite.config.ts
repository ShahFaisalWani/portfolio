import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import EnvironmentPlugin from "vite-plugin-environment";

// https://vitejs.dev/config/
export default ({ mode }: any) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return defineConfig({
    plugins: [
      tsconfigPaths(),
      react(),
      EnvironmentPlugin("all", { prefix: "VITE_" }),
    ],
    server: {
      port: 9999,
      proxy: {
        "/api-proxy": {
          target: env.VITE_API_PROXY,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-proxy/, ""),
        },
      },
    },
  });
};
