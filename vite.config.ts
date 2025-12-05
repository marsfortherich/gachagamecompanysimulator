import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  const base = env.VITE_BASE_URL || '/';

  return {
    // Base public path for deployment (GitHub Pages, etc.)
    base,
    
    plugins: [
      react(),
      
      // PWA Plugin for service worker and manifest
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: false, // Use existing manifest.json in public/
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
          disableDevLogs: true,
        },
        devOptions: {
          enabled: false, // Disable PWA in dev mode
        },
      }),
    ],
    
    resolve: {
      alias: {
        '@domain': path.resolve(__dirname, './src/domain'),
        '@application': path.resolve(__dirname, './src/application'),
        '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
        '@presentation': path.resolve(__dirname, './src/presentation'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    
    server: {
      port: 3000,
      open: true,
      strictPort: false,
    },
    
    preview: {
      port: 4173,
      open: true,
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      
      // Enable minification with terser for better compression
      minify: isProduction ? 'terser' : false,
      
      terserOptions: isProduction ? {
        compress: {
          drop_console: env.VITE_DROP_CONSOLE === 'true',
          drop_debugger: true,
          pure_funcs: env.VITE_DROP_CONSOLE === 'true' 
            ? ['console.log', 'console.debug', 'console.trace'] 
            : [],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      } : undefined,
      
      // Source maps for production debugging (optional)
      sourcemap: env.VITE_SOURCEMAP === 'true',
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-charts': ['recharts'],
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      target: 'es2020',
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts'],
    },
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: !isProduction,
    },
    
    // Enable JSON tree-shaking
    json: {
      stringify: true,
    },
  };
});
