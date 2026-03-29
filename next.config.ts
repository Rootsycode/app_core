import type { NextConfig } from 'next'

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl) {
  try {
    const host = new URL(supabaseUrl).hostname
    remotePatterns.push({
      protocol: 'https',
      hostname: host,
      pathname: '/storage/v1/object/public/**'
    })
  } catch {
  }
}

const nextConfig: NextConfig = {
  async redirects () {
    return [{ source: '/inicio', destination: '/home', permanent: true }]
  },
  reactStrictMode: false,
  transpilePackages: ['rootsy-feparts'],
  ...(remotePatterns.length
    ? { images: { remotePatterns } }
    : {})
}

export default nextConfig
