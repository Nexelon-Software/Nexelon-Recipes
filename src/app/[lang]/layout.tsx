import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "~/components/ui/sonner";
import { env } from "~/env";
import { buildSocialMetadata } from "~/lib/metadata-shared";
import {
  languageAlternates,
  localePath,
  openGraphLocale,
} from "~/lib/seo-url";
import type { Locale } from "~/language/i18n.config";
import { getLanguage } from "~/language/languages";
import { TranslationProvider } from "~/language/useTranslation";
import { TRPCReactProvider } from "~/trpc/react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const langData = await getLanguage(lang);
  const siteName = langData.metadata.siteName ?? langData.metadata.title;
  const canonical = localePath(lang, "/");
  const ogLocale = openGraphLocale(lang);

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
    title: {
      default: langData.metadata.title,
      template: `%s | ${langData.metadata.title}`,
    },
    description: langData.metadata.description,
    keywords: langData.metadata.keywords,
    applicationName: siteName,
    category: "food",
    manifest: "/manifest.webmanifest",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical,
      languages: languageAlternates("/"),
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    ...buildSocialMetadata({
      title: langData.metadata.title,
      description: langData.metadata.description,
      url: canonical,
      siteName,
      locale: ogLocale,
    }),
  };
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;

  return (
    <html lang={lang} className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TranslationProvider>
              {children}
              <Toaster />
            </TranslationProvider>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
