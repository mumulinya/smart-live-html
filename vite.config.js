import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VantResolver } from '@vant/auto-import-resolver'
import path from 'path'

const manualChunks = (id) => {
  const normalized = id.replace(/\\/g, '/');
  if (!normalized.includes('/node_modules/')) return;

  if (normalized.includes('/element-plus/')) return 'vendor-element-plus';
  if (normalized.includes('/vant/')) return 'vendor-vant';
  if (normalized.includes('/vue-router/')) return 'vendor-vue-router';
  if (normalized.includes('/axios/')) return 'vendor-axios';
  if (normalized.includes('/markdown-it/')) return 'vendor-markdown';
  if (normalized.includes('/qrcode.vue/')) return 'vendor-qrcode';
  return 'vendor';
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    plugins: [
      vue(),
      Components({
        dts: false,
        resolvers: [
          ElementPlusResolver({
            importStyle: 'css'
          }),
          VantResolver()
        ]
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'axios', 'element-plus', 'vant']
    },
    server: {
      watch: {
        ignored: ['**/dist/**', '**/docs/**']
      },
      proxy: {
        '/app-dev-api': {
          target: 'http://127.0.0.1:8080', // Adjust based on common.js logic if needed, user had some commented out IPs
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/app-dev-api/, '')
        }
      }
    },
    esbuild: isBuild ? { drop: ['console', 'debugger'] } : undefined,
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks
        }
      }
    }
  };
})
