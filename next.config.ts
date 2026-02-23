/** @type {import('next').NextConfig} */

const nextConfig = {
  // output: 'export', // Kept commented out for Vercel dynamic support
  
  // REMOVED basePath and assetPrefix for Vercel deployment
  
  images: {
    unoptimized: true,
  },
};

export default nextConfig;