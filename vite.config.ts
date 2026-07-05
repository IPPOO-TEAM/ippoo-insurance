import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'IPPOO Assurance',
        short_name: 'IPPOO',
        description: "Micro-assurance santé pour l'Afrique",
        start_url: '/espace-client',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        lang: 'fr',
        categories: ['finance', 'health', 'lifestyle'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Ma carte', url: '/espace-client/carte' },
          { name: 'Cotisations', url: '/espace-client/cotisations' },
          { name: 'Messagerie', url: '/espace-client/messagerie' },
          // A1 — Raccourcis console conseiller. Le manifest reste unique
          // (même app), mais l'écran d'accueil PWA propose les entrées
          // critiques agent quand l'utilisateur a le rôle.
          { name: 'Inbox conseiller', url: '/agent/inbox' },
          { name: 'KYC à valider', url: '/agent/kyc' },
          { name: 'Sinistres', url: '/agent/sinistres' },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
