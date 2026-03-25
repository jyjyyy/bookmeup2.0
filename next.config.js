/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimisation des images externes (Unsplash, Firebase Storage, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de cache HTTP pour les assets statiques
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // Compression activée
  compress: true,

  // Suppression des logs console en production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
}

module.exports = nextConfig
