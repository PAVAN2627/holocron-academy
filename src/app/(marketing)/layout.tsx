import Link from 'next/link';
import { GraduationCap, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium tracking-tight">Holocron Academy</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/login">
              <LogIn />
              Log in
            </Link>
          </Button>
          <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10">
            <Link href="/signup">Enroll</Link>
          </Button>
        </nav>
      </header>

      <div className="flex-1">{children}</div>
    </div>
  );
}
