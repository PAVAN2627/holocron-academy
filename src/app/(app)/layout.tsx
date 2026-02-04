import Link from 'next/link';
import { cookies } from 'next/headers';
import { ClipboardList, LayoutDashboard, LogOut, Orbit } from 'lucide-react';

import { logoutAction } from '@/app/actions/auth';
import { PageTransition } from '@/components/motion/PageTransition';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HOLOCRON_PROFILE_COOKIE, parseHolocronProfile } from '@/lib/holocron-auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = parseHolocronProfile(cookies().get(HOLOCRON_PROFILE_COOKIE)?.value);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row">
        <aside
          className={cn(
            'terminal-overlay border-b bg-white/5 px-4 py-5 backdrop-blur-xl md:min-h-screen md:w-72 md:border-b-0 md:border-r',
            'border-white/10'
          )}
        >
          <div className="space-y-4">
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
                Holocron Academy
              </Link>
              <p className="text-xs text-muted-foreground">
                {profile?.fullName ? (
                  <span>
                    Signed in as <span className="font-medium text-foreground">{profile.fullName}</span>
                  </span>
                ) : (
                  <span>Signed in</span>
                )}
              </p>
              {profile?.classYear ? <p className="text-xs text-muted-foreground">Class/Year: {profile.classYear}</p> : null}
            </div>

            <nav className="grid gap-2">
              <Button asChild variant="secondary" className="justify-start gap-2 bg-white/5 hover:bg-white/10">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Lessons
                </Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start gap-2">
                <Link href="/dashboard#trials">
                  <ClipboardList className="h-4 w-4" />
                  Trials
                </Link>
              </Button>
              <Button asChild variant="ghost" className="justify-start gap-2">
                <Link href="/dashboard#galaxy-map">
                  <Orbit className="h-4 w-4" />
                  Galaxy Map
                </Link>
              </Button>
            </nav>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start gap-2 border-primary/20 text-foreground hover:bg-white/10"
              >
                <LogOut />
                Log out
              </Button>
            </form>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
