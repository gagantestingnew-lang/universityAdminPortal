import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fireflink University Admin Login',
  description: 'Admin portal login for Fireflink University',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
