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
    default: "YaadKaro - AI Powered Learning Platform",
    template: "%s | YaadKaro",
  },
  description: "Advanced AI-powered tutoring management system. Manage courses, exams, live classes, and student learning journeys with enterprise-grade tools.",
  keywords: ["tutoring", "education", "AI learning", "online courses", "exam management", "LMS", "learning management"],
  authors: [{ name: "YaadKaro" }],
  creator: "YaadKaro",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "YaadKaro",
    title: "YaadKaro - AI Powered Learning Platform",
    description: "Advanced AI-powered tutoring management system for modern education.",
  },
  twitter: {
    card: "summary_large_image",
    title: "YaadKaro - AI Powered Learning",
    description: "Advanced AI-powered tutoring management system for modern education.",
  },
  robots: {
    index: true,
    follow: true,
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
          <Toaster position="top-right" />
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
