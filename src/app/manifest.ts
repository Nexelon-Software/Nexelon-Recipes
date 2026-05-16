import type { MetadataRoute } from "next";

import sk from "~/language/lang/sk.json";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: sk.metadata.title,
    short_name: "Nexelon",
    description: sk.metadata.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "sk",
    dir: "ltr",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
