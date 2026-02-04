import Link from 'next/link';
import { UserPlus } from 'lucide-react';

import { registerAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type RegisterPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : '/dashboard';

  return (
    <Card terminal className="w-full max-w-md border-sky-500/30 bg-background/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-100">
          <UserPlus className="h-5 w-5" />
          Register
        </CardTitle>
        <CardDescription>Hackathon demo registration — claim a callsign and pick a faction.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={registerAction} className="space-y-5">
          <input type="hidden" name="next" value={nextPath} />

          <div className="space-y-2">
            <label htmlFor="callsign" className="text-sm font-medium leading-none">
              Callsign
            </label>
            <Input id="callsign" name="callsign" placeholder="e.g. Ghost" autoComplete="username" required />
          </div>

          <div className="space-y-2">
            <label htmlFor="passcode" className="text-sm font-medium leading-none">
              Passcode
            </label>
            <Input id="passcode" name="passcode" type="password" autoComplete="new-password" required />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="submit"
              name="faction"
              value="rebel"
              variant="secondary"
              className="border-sky-500/30 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20"
            >
              Rebel Cadet
            </Button>
            <Button type="submit" name="faction" value="imperial" variant="destructive">
              Imperial Recruit
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="text-sky-200 underline-offset-4 hover:underline">
              Login here
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
