/** @type {import('next').NextConfig} */
const nextConfig = {
  // ビルド時の型チェックを無効化
  typescript: {
    // 開発中は警告を表示するが、ビルドを中断しない
    ignoreBuildErrors: true,
  },
  eslint: {
    // 開発中は警告を表示するが、ビルドを中断しない
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
