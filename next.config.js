/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  serverExternalPackages: ["xlsx"],
  allowedDevOrigins: ["192.168.1.113", "192.168.1.113.nip.io"],
  async redirects() {
    return [
      {
        source: "/myrecipes",
        destination: "/recipes",
        permanent: true,
      },
      {
        source: "/myrecipes/:path*",
        destination: "/recipes/:path*",
        permanent: true,
      },
      {
        source: "/en/myrecipes",
        destination: "/en/recipes",
        permanent: true,
      },
      {
        source: "/en/myrecipes/:path*",
        destination: "/en/recipes/:path*",
        permanent: true,
      },
      {
        source: "/recipes/user/:userId",
        destination: "/:userId/recipes",
        permanent: true,
      },
      {
        source: "/en/recipes/user/:userId",
        destination: "/en/:userId/recipes",
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
