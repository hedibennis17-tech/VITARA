'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

// Routes standalone (sans sidebar admin)
const STANDALONE = ['/patient', '/patient-portal'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Apps standalone : pas de sidebar admin
  if (STANDALONE.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <>{children}</>;
  }

  // Dashboard admin
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
