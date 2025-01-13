import './globals.css';
import './animations.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Breeze - Tailwind Class Compiler',
  description: 'Transform your Tailwind classes into clean, optimized CSS',
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
