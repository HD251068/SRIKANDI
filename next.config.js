// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan server-side environment variables
  serverExternalPackages: ['@anthropic-ai/sdk'],

  // Headers keamanan untuk data sensitif kepolisian
  async headers() {
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
            // microphone diizinkan untuk STT
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.deepseek.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "media-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
