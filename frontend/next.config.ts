import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  reactCompiler: true,
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
}

export default nextConfig
