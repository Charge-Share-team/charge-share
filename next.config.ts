/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <--- Add this line
  images: {
    unoptimized: true, // Static exports don't support the default Image Optimization
  },
};

export default nextConfig;