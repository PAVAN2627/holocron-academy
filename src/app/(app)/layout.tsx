import Link from 'next/link';
import { cookies } from 'next/headers';
import { Compass, LogOut, Radar } from 'lucide-react';

import { logoutAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { coerceHolocronFaction, HOLOCRON_FACTION_COOKIE } from '@/lib/holocron-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const faction = coerceHolocronFaction(cookies().get(HOLOCRON_FACTION_COOKIE)?.value);
  const isImperial = faction === 'imperial';
  const accentTextClassName = isImperial ? 'text-destructive' : 'text-sky-100';
  const accentBorderClassName = isImperial ? 'border-destructive/35' : 'border-sky-500/30';

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
        <aside
          className={cn(
            'terminal-overlay border-b bg-background/40 px-4 py-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r',
            accentBorderClassName
          )}
        >
          <div className="space-y-4">
            <div>
              <p className={cn('text-lg font-semibold tracking-tight', accentTextClassName)}>Holocron Academy</p>
              <p className="text-xs text-muted-foreground">
                Faction: <span className="font-medium text-foreground">{isImperial ? 'Imperial' : 'Rebel'}</span>
              </p>
            </div>

            <nav className="grid gap-2">
              <Button asChild variant="ghost" className="justify-start gap-2">
                <Link href="/">
                  <Compass />
                  Landing
                </Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start gap-2">
                <Link href="/dashboard">
                  <Radar />
                  Dashboard
                </Link>
              </Button>
            </nav>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className={cn(
                  'w-full justify-start gap-2',
                  isImperial
                    ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
                    : 'border-sky-500/30 text-sky-100 hover:bg-sky-500/10'
                )}
              >
                <LogOut />
                Log out
              </Button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
