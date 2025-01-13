import './globals.css';
import './animations.css';
import type { Metadata } from 'next';

const APP_NAME = "Breeze";
const APP_DESCRIPTION = "Transform your Tailwind classes into clean, optimized CSS. Instant compilation, custom class names, and modern CSS output.";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: "Mohamed Shuaau" }],
  keywords: ["Tailwind CSS", "CSS Compiler", "CSS Optimizer", "Tailwind Tools", "CSS Tools"],
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [{
      url: '/breeze.png',
      width: 1200,
      height: 630,
      alt: 'Breeze - Tailwind CSS Compiler'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/breeze.png'],
    creator: '@mohamed_shuaau'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="bg-[#0F172A]">{children}</body>
    </html>
  );
}
