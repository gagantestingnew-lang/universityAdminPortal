/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isProd ? '/admin_portal' : '',
  assetPrefix: isProd ? '/admin_portal/' : '',
};

module.exports = nextConfig;