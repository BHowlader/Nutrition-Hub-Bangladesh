/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  images: {
    formats: ["image/webp"],
    qualities: [55, 60, 72, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "*.onrender.com"
      },
      {
        protocol: "https",
        hostname: "api.nutritionhubbd.com"
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000"
      }
    ]
  }
};

export default nextConfig;
