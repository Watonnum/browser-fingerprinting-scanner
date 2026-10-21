import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Browser Fingerprinting & Privacy Leak Scanner",
  description:
    "Scan your browser for Canvas, WebGL, AudioContext, font and environment fingerprinting leaks. See your entropy, uniqueness score, stateless tracking status and tailored hardening steps.",
  applicationName: "Fingerprint Leak Scanner",
  keywords: ["browser fingerprinting", "privacy", "canvas fingerprint", "webgl", "audiocontext", "entropy", "tracking"],
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 font-sans text-slate-100">{children}</body>
    </html>
  );
}
