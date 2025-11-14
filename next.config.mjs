/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  // Allow access from network devices
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // Image optimization
  images: {
    dangerouslyAllowSVG: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.openverse.org',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'www.rawpixel.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      // Add backend URL for generated images
      {
        protocol: 'https',
        hostname: '*.railway.app',
      },
      {
        protocol: 'https',
        hostname: '*.render.com',
      },
    ],
  },
  // Headers for security, CORS, and WebXR
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? (process.env.NEXT_PUBLIC_APP_URL || '*')
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      {
        // Enable CORS for 3D model files
        source: '/models/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        // Security headers for WebXR
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, xr-spatial-tracking=*',
          },
        ],
      },
    ]
  },
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Webpack configuration for Three.js and WebXR
  webpack: (config, { isServer }) => {
    // Handle model-viewer web component
    config.resolve.alias = {
      ...config.resolve.alias,
      '@google/model-viewer': '@google/model-viewer/dist/model-viewer.min.js',
    };

    // Ignore node-specific modules in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Handle Three.js examples imports
    config.module.rules.push({
      test: /\.glsl$/,
      use: 'raw-loader',
    });

    return config;
  },
  // Transpile packages that need it
  transpilePackages: ['three', '@google/model-viewer'],
}

export default nextConfig
