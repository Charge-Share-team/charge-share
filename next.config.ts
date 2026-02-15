/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // Active for GitHub Pages deployment
  basePath: '/charge-share', 
  assetPrefix: '/charge-share/',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;