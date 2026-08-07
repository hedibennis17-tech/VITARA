'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /patient = app mobile autonome, SANS sidebar admin
  if (pathname === '/patient') {
    return <>{children}</>;
  }

  // Toutes les autres routes = dashboard admin AVEC sidebar
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
