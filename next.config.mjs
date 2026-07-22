/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // optional dep of rpc-websockets, itself a dep of @solana/web3.js -
      // safe to stub out in the browser bundle
      encoding: false,
    }

    return config
  },
}

export default nextConfig
