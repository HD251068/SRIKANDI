// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@anthropic-ai/sdk'],

  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          // CSP — izinkan Vercel Live di dev, ketat di production
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
              : [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
                  "script-src-elem 'self' 'unsafe-inline' https://vercel.live",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.deepseek.com https://vercel.live wss://ws-us3.pusher.com",
                  "img-src 'self' data: blob: https://*.supabase.co https://vercel.live",
                  "media-src 'self' blob:",
                  "frame-src 'self' https://vercel.live",
                ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
