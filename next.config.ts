import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Firebaseでの認証を使用するため、trailingSlashを有効化
  trailingSlash: true,
};

export default nextConfig;
