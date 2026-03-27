import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/providers/ErrorBoundary";

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Sapience LMS - AI-Powered Learning Platform",
    template: "%s | Sapience LMS",
  },
  description:
    "Sapience LMS is an enterprise-grade, AI-powered Learning Management System for coaching institutes, universities, and corporate training. Deliver intelligent, adaptive learning experiences at scale.",
  keywords: [
    "LMS",
    "learning management system",
    "AI tutor",
    "online courses",
    "exam management",
    "adaptive testing",
    "coaching institute software",
    "EdTech platform",
    "live classes",
    "student analytics",
  ],
  authors: [{ name: "Sapience LMS" }],
  creator: "Sapience LMS",
  metadataBase: new URL("https://sapiencelms.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Sapience LMS",
    title: "Sapience LMS - AI-Powered Learning Platform",
    description:
      "Enterprise SaaS LMS with AI tutoring, adaptive exams, live classes, CRM, and multi-tenant support for modern educational institutions.",
    images: [
      {
        url: "/favicon.ico",
        width: 64,
        height: 64,
        alt: "Sapience LMS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sapience LMS - AI-Powered Learning",
    description:
      "Enterprise-grade AI-powered LMS for institutes, universities and corporates.",
    images: ["/favicon.ico"],
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
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Anti-flash script:
          Runs synchronously before paint, reads cached theme data, and
          applies CSS variables immediately to avoid a theme flash.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            try {
              var CACHE_KEY = 'sapience_global_theme_v2';
              var INST_KEY  = 'sapience_institute_cache';
              var FALLBACK  = {
                primary:'#4338ca', secondary:'#f8fafc', accent:'#6366f1',
                sidebar:'#1e1b4b', background:'#f8fafc', font:"'DM Sans',sans-serif",
                fontSize:'14'
              };
              var DARK = {
                background:'#0f172a', secondary:'#1e293b'
              };

              function getCookie(name) {
                var m = document.cookie.match('(?:^|; )' + name + '=([^;]*)');
                return m ? decodeURIComponent(m[1]) : null;
              }

              var role = getCookie('user_role') || localStorage.getItem('userRole') || 'student';
              var mode = localStorage.getItem('theme-mode') || 'light';

              document.documentElement.classList.add(mode);

              if (role === 'admin' || role === 'superadmin') return;

              var isStudent = role === 'student';
              var globalData = null, institute = null;

              try {
                var gr = localStorage.getItem(CACHE_KEY);
                if (gr) {
                  var gp = JSON.parse(gr);
                  if (Date.now() - gp.ts < 300000) globalData = gp.data;
                }
              } catch (e) {}

              try {
                var ir = localStorage.getItem(INST_KEY);
                if (ir) {
                  var ip = JSON.parse(ir);
                  if (Date.now() - ip.ts < 600000) institute = ip.data;
                }
              } catch (e) {}

              var t = null;
              if (globalData && globalData.enforceGlobalTheme) {
                t = globalData.globalTheme;
              } else if (institute) {
                if (institute.themeSettings && institute.themeSettings.useGlobalTheme) {
                  t = globalData ? (isStudent ? globalData.studentTheme : globalData.tutorTheme) : null;
                  if (!t) t = isStudent ? institute.studentTheme : institute.tutorTheme;
                } else {
                  t = isStudent ? institute.studentTheme : institute.tutorTheme;
                }
              } else if (globalData) {
                t = isStudent ? globalData.studentTheme : globalData.tutorTheme;
              }

              if (!t) return;

              var r = document.documentElement;
              var primary = t.primaryColor || FALLBACK.primary;
              var secondary = t.secondaryColor || FALLBACK.secondary;
              var sidebar = t.sidebarColor || FALLBACK.sidebar;
              var accent = t.accentColor || FALLBACK.accent;
              var background = mode === 'dark' ? DARK.background : secondary;

              r.style.setProperty('--theme-primary', primary);
              r.style.setProperty('--theme-secondary', secondary);
              r.style.setProperty('--theme-accent', accent);
              r.style.setProperty('--theme-sidebar', sidebar);
              r.style.setProperty('--theme-background', background);
              r.style.setProperty('--theme-muted', background);

              if (t.fontFamily) {
                r.style.setProperty('--theme-font', t.fontFamily);
                document.documentElement.style.fontFamily = t.fontFamily;
              }

              if (t.fontSize) {
                r.style.fontSize = t.fontSize + 'px';
              }
            } catch (e) {}
          })();
        `,
          }}
        />
      </head>
      <body className={font.className} suppressHydrationWarning={true}>
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
