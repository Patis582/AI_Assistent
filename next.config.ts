import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimalizace
  compress: true,
  poweredByHeader: false,
  
  // Experimental optimalizace
  experimental: {
    optimizePackageImports: ['@google/generative-ai', '@notionhq/client']
  }
};

export default nextConfig;
