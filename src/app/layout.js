import { Inter, Plus_Jakarta_Sans, Sora, Outfit, Kanit } from 'next/font/google';
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/providers/ErrorBoundary";

// Fonts Configuration
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const kanit = Kanit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '900'], variable: '--font-kanit', display: 'swap' });

export const metadata = {
  title: {
    default: "Sapience LMS - AI-Powered Learning Platform",
    template: "%s | Sapience LMS",
  },
  description: "Sapience LMS is an enterprise-grade, AI-powered Learning Management System...",
  // ... (aapka baki metadata same rahega)
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${sora.variable} ${outfit.variable} ${kanit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning={true} className="antialiased">
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "500",
                boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
              },
              success: {
                iconTheme: { primary: "var(--theme-primary)", secondary: "#fff" },
              },
              error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
            }}
          />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}