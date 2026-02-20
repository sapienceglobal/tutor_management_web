import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "YaadKaro - AI Powered Learning",
  description: "Advanced tutoring management system with AI capabilities",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className} suppressHydrationWarning={true}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
