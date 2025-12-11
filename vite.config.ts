import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    base: './',
    publicDir: 'public',
    plugins: [react()],
    
    server: {
      port: 3000,
      host: true,
      strictPort: false,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    },
    
    preview: {
      port: 3000,
      cors: true
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'front-end'),
        '@assets': resolve(__dirname, 'front-end/assets'),
        '@components': resolve(__dirname, 'front-end/components'),
        '@styles': resolve(__dirname, 'front-end'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction ? 'terser' : false,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = String(assetInfo.name || '');
            
            if (!name) {
              return 'assets/[name]-[hash][extname]';
            }
            
            const parts = name.split('.');
            const extension = parts.length > 1 ? parts[parts.length - 1] : '';
            
            if (extension === 'json') {
              return 'locales/[name].[ext]';
            }
            
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      ...(isProduction && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        chunkSizeWarningLimit: 1000,
      }),
    },
  };
});