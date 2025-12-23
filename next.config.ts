import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "btnavimumbai.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
