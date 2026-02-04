import Link from 'next/link';
import { KeyRound } from 'lucide-react';

import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : '/dashboard';

  return (
    <Card className="w-full max-w-md border-sky-500/30 bg-background/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sky-100">
              <KeyRound className="h-5 w-5" />
              Login
            </CardTitle>
            <CardDescription>Imperial clearance or Rebel credentials required.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={loginAction} className="space-y-5">
          <input type="hidden" name="next" value={nextPath} />

          <div className="space-y-2">
            <label htmlFor="callsign" className="text-sm font-medium leading-none">
              Callsign
            </label>
            <Input id="callsign" name="callsign" placeholder="e.g. Red Five" autoComplete="username" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="passcode" className="text-sm font-medium leading-none">
              Passcode
            </label>
            <Input id="passcode" name="passcode" type="password" autoComplete="current-password" required />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="submit"
              name="faction"
              value="rebel"
              variant="secondary"
              className="border-sky-500/30 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20"
            >
              Join the Rebellion
            </Button>
            <Button type="submit" name="faction" value="imperial" variant="destructive">
              Serve the Empire
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            New cadet?{' '}
            <Link href="/register" className="text-sky-200 underline-offset-4 hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
