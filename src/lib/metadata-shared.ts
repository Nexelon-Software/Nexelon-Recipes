import type { Metadata } from "next";

import { absoluteUrl } from "~/lib/seo-url";

const DEFAULT_OG_IMAGE = "/og.png";

export function defaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE);
}

export function buildSocialMetadata({
  title,
  description,
  url,
  siteName,
  locale,
  type = "website",
  imageUrl,
}: {
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale: string;
  type?: "website" | "article";
  imageUrl?: string | null;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = imageUrl ? absoluteUrl(imageUrl) : defaultOgImageUrl();

  return {
    openGraph: {
      type,
      locale,
      siteName,
      title,
      description,
      url: absoluteUrl(url),
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
