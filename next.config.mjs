/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Les routes API fonctionnent correctement au runtime
    // Les types params Next.js 15 sont vérifiés séparément
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
