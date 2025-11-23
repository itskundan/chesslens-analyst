import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";


const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname
const devPort = 5173

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.localhost',
      '.127.0.0.1',
      '.github.dev',
      '.app.github.dev',
    ],
  },
  preview: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
  },
});
