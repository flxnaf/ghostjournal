/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Exclude chromadb from webpack entirely (server-side only)
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push('chromadb');
    }
    
    // Exclude MediaPipe from server-side bundling (client-only)
    if (isServer) {
      config.externals.push('@mediapipe/face_mesh', '@mediapipe/camera_utils');
    }
    
    return config;
  },
  // Mark chromadb as server-only
  serverComponentsExternalPackages: ['chromadb'],
}

module.exports = nextConfig

