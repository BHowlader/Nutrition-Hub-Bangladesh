/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"]
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
