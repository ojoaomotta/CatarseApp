import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'finance-entry',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          res.writeHead(302, { Location: '/v2.html' }); res.end();
        } else next();
      });
    },
  }, {
    name: 'development-csp',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';");
    },
  }],
  server: { host: '127.0.0.1', port: 1430, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:1432', changeOrigin: true } } },
  preview: { host: '127.0.0.1', port: 1431, strictPort: true },
  build: { outDir: 'dist-finance', rollupOptions: { input: 'v2.html' } },
});
