import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: false,
  // Suppress source map warnings in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

export default withWorkflow(nextConfig);
