import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "192.168.90.201",
    "172.30.0.1",
    "localhost",
    "127.0.0.1"
  ]
};

export default nextConfig;
