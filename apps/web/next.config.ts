import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@worldbuild/core",
    "@worldbuild/dnd-rules",
    "@worldbuild/editor-engine",
  ],
  serverExternalPackages: ["@prisma/client", "@worldbuild/database"],
  reactStrictMode: true,
  webpack: (config) => {
    // Corrige compatibilidade de hashing do Webpack 5 com Node.js 24 no Windows
    config.output = config.output || {};
    config.output.hashFunction = "sha256";
    return config;
  },
};

export default nextConfig;
