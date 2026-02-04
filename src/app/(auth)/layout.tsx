import Link from 'next/link';
import { Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-sky-200" />
          <span className="text-sm font-medium tracking-tight">Holocron Academy</span>
        </Link>

        <Badge variant="secondary">Secure Sector</Badge>
      </header>

      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
