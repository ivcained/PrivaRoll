/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 14: use experimental.serverComponentsExternalPackages
  // to keep BitGo SDK and its problematic deps out of the webpack bundle
  experimental: {
    serverComponentsExternalPackages: [
      "bitgo",
      "eccrypto",
      "@wasmer/wasi",
      "casper-js-sdk",
      "@bitgo/sdk-core",
      "@bitgo/sdk-coin-cspr",
      "@bitgo/sdk-lib-mpc",
    ],
  },
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
};

module.exports = nextConfig;
