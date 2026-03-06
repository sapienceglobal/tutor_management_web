import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import ImpersonationBar from "@/components/layout/ImpersonationBar";
import SuspensionBanner from "@/components/layout/SuspensionBanner";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Sapience LMS — AI-Powered Learning Platform",
    template: "%s | Sapience LMS", 
  },
  description:
    "Sapience LMS is an enterprise-grade, AI-powered Learning Management System for coaching institutes, universities, and corporate training. Deliver intelligent, adaptive learning experiences at scale.",
  keywords: [
    "LMS", "learning management system", "AI tutor", "online courses",
    "exam management", "adaptive testing", "coaching institute software",
    "EdTech platform", "live classes", "student analytics",
  ],
  authors: [{ name: "Sapience LMS" }],
  creator: "Sapience LMS",
  metadataBase: new URL("https://sapienceLMS.com"), // update to your actual domain
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Sapience LMS",
    title: "Sapience LMS — AI-Powered Learning Platform",
    description:
      "Enterprise SaaS LMS with AI tutoring, adaptive exams, live classes, CRM, and multi-tenant support for modern educational institutions.",
    images: [
      {
        url: "/og-image.png", // add a 1200×630 image to /public
        width: 1200,
        height: 630,
        alt: "Sapience LMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sapience LMS — AI-Powered Learning",
    description:
      "Enterprise-grade AI-powered LMS for institutes, universities & corporates.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className} suppressHydrationWarning={true}>
        <ErrorBoundary>
          <ImpersonationBar />
          <SuspensionBanner />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '500',
                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <TenantProvider>
            <SettingsProvider>
              <ConfirmProvider>
                {children}
              </ConfirmProvider>
            </SettingsProvider>
          </TenantProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}