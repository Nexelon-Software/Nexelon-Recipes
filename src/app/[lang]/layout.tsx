import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "~/components/ui/sonner";
import { env } from "~/env";
import type { Locale } from "~/language/i18n.config";
import { getLanguage } from "~/language/languages";
import { TranslationProvider } from "~/language/useTranslation";
import { TRPCReactProvider } from "~/trpc/react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const langData = await getLanguage(lang);

  return {
    title: langData.metadata.title,
    description: langData.metadata.description,
    keywords: langData.metadata.keywords,
    metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
    alternates: {
      canonical: `/${lang}`,
      languages: {
        "en-US": "/en",
        "sk-SK": "/sk",
      },
    },
    icons: [{ rel: "icon", url: "/favicon.ico" }],
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
