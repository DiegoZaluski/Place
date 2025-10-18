import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    // Base configuration
    base: './',
    publicDir: 'public',
    
    // Plugins
    plugins: [react()],
    
    // Development server configuration
    server: {
      port: 3000,         // Initial port
      open: '/index.html',  // Ensures index.html opens by default
      host: true,         // Allows local network access
      strictPort: false,  // Tries alternative ports if 3000 is busy
      cors: true,        // Enable CORS
      proxy: {
        // Proxy para o n8n
        '/api': {
          target: 'http://localhost:5678',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false
        },
        // Proxy para webhook de teste
        '/webhook-test': {
          target: 'http://localhost:5678',
          changeOrigin: true,
          secure: false
        },
        // Proxy para outros webhooks
        '/webhook': {
          target: 'http://localhost:5678',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    // Preview configuration
    preview: {
      port: 3000,
      cors: true
    },

    // Module resolution and aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@components': resolve(__dirname, 'src/components'),
        '@styles': resolve(__dirname, 'src'), // Moved to src since we don't have a styles directory
      },
      extensions: ['.js', '.jsx', '.json'], // Added common extensions
    },
    
    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCaseOnly',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";` // If you use SCSS
        }
      }
    },
    
    // Build configuration // adding i18n 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? false : 'inline', // Improves performance in production
      minify: isProduction ? 'terser' : false,   // Minifies only in production
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (['json'].includes(ext)) {
              return `locales/[name].[ext]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        }
      },

      // Production optimizations
      ...(isProduction && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        chunkSizeWarningLimit: 1000, // Increases chunk size warning limit
      }),
    },
    
    // Preview configuration is already defined above with proxy settings
  };
});