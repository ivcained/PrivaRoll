/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable webpack 5 experiments for noble/secp256k1 and BitGo SDK
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side: polyfill/stub Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
      };
    }
    return config;
  },
  // Ensure BitGo SDK is only used in server-side API routes
  serverExternalPackages: ["bitgo"],
};

module.exports = nextConfig;
