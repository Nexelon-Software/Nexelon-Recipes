/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.113", "192.168.1.113.nip.io"],
  async redirects() {
    return [
      {
        source: "/recipes",
        destination: "/myrecipes",
        permanent: true,
      },
      {
        source: "/recipes/:path*",
        destination: "/myrecipes/:path*",
        permanent: true,
      },
      {
        source: "/en/recipes",
        destination: "/en/myrecipes",
        permanent: true,
      },
      {
        source: "/en/recipes/:path*",
        destination: "/en/myrecipes/:path*",
        permanent: true,
      },
      {
        source: "/profile",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/en/profile",
        destination: "/en/settings",
        permanent: true,
      },
    ];
  },
};

export default config;
