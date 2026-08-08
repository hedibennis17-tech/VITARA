import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

const SITE_URL = 'https://vitara-hedi-benniss-projects.vercel.app';

export const metadata: Metadata = {
  title: 'VITARA — Clinique Médicale JOLIBOURG de Laval',
  description: 'Prenez rendez-vous facilement avec votre agent médical IA VITARA — Clinique Médicale JOLIBOURG de Laval.',
  openGraph: {
    title: 'VITARA — Clinique Médicale JOLIBOURG de Laval',
    description: 'Prenez rendez-vous avec votre agent médical IA. Service disponible 24h/7j.',
    url: SITE_URL + '/patient',
    siteName: 'VITARA',
    locale: 'fr_CA',
    type: 'website',
  },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
